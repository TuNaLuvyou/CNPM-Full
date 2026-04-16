from rest_framework import serializers
from django.utils import timezone
from .models import Event, EventInvitation, Notification
from django.contrib.auth.models import User

class UserSimpleSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'name']
    
    def get_name(self, obj):
        return obj.first_name or obj.username

class EventInvitationSerializer(serializers.ModelSerializer):
    invitee_details = UserSimpleSerializer(source='invitee', read_only=True)
    class Meta:
        model = EventInvitation
        fields = ['id', 'invitee', 'invitee_details', 'status', 'permission']

class EventSerializer(serializers.ModelSerializer):
    link = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    date = serializers.DateField(write_only=True, required=False)
    timeStart = serializers.TimeField(write_only=True, required=False)
    timeEnd = serializers.TimeField(write_only=True, required=False)
    
    date_display = serializers.SerializerMethodField()
    time_start_display = serializers.SerializerMethodField()
    time_end_display = serializers.SerializerMethodField()
    
    invitations = EventInvitationSerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source='user.username', read_only=True)
    is_owner = serializers.SerializerMethodField()
    my_permission = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'event_type', 'user', 'owner_name', 'is_owner', 'my_permission',
            'title', 'description', 'location', 'link', 'color', 
            'is_all_day', 'is_deleted', 'deleted_at',
            'start_time', 'end_time', 'created_at', 'updated_at',
            'date', 'timeStart', 'timeEnd',
            'date_display', 'time_start_display', 'time_end_display',
            'invitations'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'deleted_at',
                            'date_display', 'time_start_display', 'time_end_display']
        extra_kwargs = {
            'start_time': {'required': False},
            'end_time': {'required': False},
        }

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if not request: return False
        return obj.user == request.user

    def get_my_permission(self, obj):
        request = self.context.get('request')
        if not request: return 'view'
        if obj.user == request.user: return 'edit'
        invite = obj.invitations.filter(invitee=request.user, status='accepted').first()
        return invite.permission if invite else 'view'

    def get_date_display(self, obj):
        if obj.start_time:
            return timezone.localtime(obj.start_time).strftime('%Y-%m-%d')
        return None

    def get_time_start_display(self, obj):
        if obj.start_time:
            return timezone.localtime(obj.start_time).strftime('%H:%M')
        return None

    def get_time_end_display(self, obj):
        if obj.end_time:
            return timezone.localtime(obj.end_time).strftime('%H:%M')
        return None

    def _handle_guests(self, event, guests_data):
        if not isinstance(guests_data, list): return

        request = self.context.get('request')
        current_invites = {inv.invitee_id: inv for inv in event.invitations.all()}
        new_guest_ids = []

        for g in guests_data:
            try:
                # Handle both object with 'invitee' key and raw IDs if necessary
                uid_raw = g.get('invitee')
                if isinstance(uid_raw, dict): uid = int(uid_raw.get('id'))
                else: uid = int(uid_raw)
            except (TypeError, ValueError):
                continue
            
            perm = g.get('permission', 'view')
            new_guest_ids.append(uid)

            if uid in current_invites:
                invite = current_invites[uid]
                if invite.permission != perm:
                    invite.permission = perm
                    invite.save()
            else:
                # Tạo mới invitation
                EventInvitation.objects.create(event=event, invitee_id=uid, permission=perm)
                # Tạo thông báo
                if request:
                    Notification.objects.create(
                        user_id=uid,
                        ntype='invite',
                        event=event,
                        content=f"{request.user.username} đã mời bạn tham gia sự kiện: {event.title}"
                    )
        
        # Xóa những người không còn trong danh sách (uninvite)
        event.invitations.exclude(invitee_id__in=new_guest_ids).delete()

    def create(self, validated_data):
        request = self.context.get('request')
        guests_data = request.data.get('guests', []) if request else []
        
        event = Event.objects.create(**validated_data)
        self._handle_guests(event, guests_data)
        return event

    def update(self, instance, validated_data):
        request = self.context.get('request')
        # Standard update
        instance = super().update(instance, validated_data)
        
        # Chỉ owner mới được sửa khách mời
        if request and instance.user == request.user:
            guests_data = request.data.get('guests', [])
            self._handle_guests(instance, guests_data)
        
        return instance

    def validate(self, data):
        date = data.pop('date', None)
        time_start = data.pop('timeStart', None)
        time_end = data.pop('timeEnd', None)

        if date and time_start:
            from datetime import datetime
            naive_start = datetime.combine(date, time_start)
            data['start_time'] = timezone.make_aware(naive_start)

        if date and time_end:
            from datetime import datetime
            naive_end = datetime.combine(date, time_end)
            data['end_time'] = timezone.make_aware(naive_end)

        if 'start_time' in data and 'end_time' in data:
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError("Thời gian kết thúc phải sau thời gian bắt đầu.")
        return data

class NotificationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True)
    class Meta:
        model = Notification
        fields = ['id', 'user', 'ntype', 'event', 'event_title', 'content', 'is_read', 'created_at']
        read_only_fields = ['created_at']