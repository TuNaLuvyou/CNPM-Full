from rest_framework import serializers
from django.utils import timezone
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    """
    Serializer nhận dữ liệu từ FE theo format:
    - type: 'event' | 'appointment'
    - title, description, location, link, color
    - date: 'YYYY-MM-DD'
    - timeStart: 'HH:MM'
    - timeEnd: 'HH:MM'

    Và trả về FE thêm các field tiện lợi:
    - date, time_start, time_end (dạng string tách riêng)
    """
    link = serializers.URLField(required=False, allow_blank=True, allow_null=True)

    # Write-only: FE gửi lên nhưng không lưu trực tiếp
    date = serializers.DateField(write_only=True, required=False)
    timeStart = serializers.TimeField(write_only=True, required=False)
    timeEnd = serializers.TimeField(write_only=True, required=False)

    # Read-only: BE trả về dạng tách biệt để FE hiển thị
    date_display = serializers.SerializerMethodField()
    time_start_display = serializers.SerializerMethodField()
    time_end_display = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'event_type', 'title', 'description', 'location',
            'link', 'color', 'is_all_day', 'is_deleted', 'deleted_at',
            'start_time', 'end_time', 'created_at', 'updated_at',
            # FE-friendly fields
            'date', 'timeStart', 'timeEnd',
            'date_display', 'time_start_display', 'time_end_display',
        ]
        read_only_fields = ['created_at', 'updated_at', 'deleted_at',
                            'date_display', 'time_start_display', 'time_end_display']
        extra_kwargs = {
            'start_time': {'required': False},
            'end_time': {'required': False},
        }

    def get_date_display(self, obj):
        if obj.start_time:
            local_time = timezone.localtime(obj.start_time)
            return local_time.strftime('%Y-%m-%d')
        return None

    def get_time_start_display(self, obj):
        if obj.start_time:
            return timezone.localtime(obj.start_time).strftime('%H:%M')
        return None

    def get_time_end_display(self, obj):
        if obj.end_time:
            return timezone.localtime(obj.end_time).strftime('%H:%M')
        return None

    def validate(self, data):
        """Merge date + timeStart/timeEnd thành start_time + end_time"""
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

        # Validate start < end
        if 'start_time' in data and 'end_time' in data:
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError(
                    "Thời gian kết thúc phải sau thời gian bắt đầu."
                )

        return data

    def create(self, validated_data):
        # Nếu FE gửi type='appointment', map vào event_type
        request = self.context.get('request')
        if request and 'type' in request.data:
            fe_type = request.data.get('type')
            if fe_type == 'appointment':
                validated_data['event_type'] = 'appointment'
        return super().create(validated_data)