from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Event, EventInvitation, Notification, CalendarGroup, ReminderPreference
from .serializers import EventSerializer, NotificationSerializer, EventInvitationSerializer, CalendarGroupSerializer, ReminderPreferenceSerializer

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Mặc định lấy các sự kiện chưa xóa, trừ khi action là restore/permanent_delete hoặc có param trash=true
        is_deleted_qs = self.request.query_params.get('trash', 'false') == 'true'
        
        # Các action này cần tìm được item bất kể trạng thái chấp nhận lời mời
        if self.action in ['trash', 'restore', 'permanent_delete', 'leave']:
             return Event.objects.filter(
                (Q(user=user) | Q(invitations__invitee=user, invitations__status__in=['accepted', 'pending']))
             ).distinct().order_by('start_time')

        # Xây dựng filter cơ bản: sự kiện của mình hoặc mình được mời
        base_filter = (Q(user=user) | Q(invitations__invitee=user, invitations__status='accepted'))
        
        qs = Event.objects.filter(base_filter & Q(deleted_at__isnull=not is_deleted_qs)).distinct()
        
        # Filter theo thời gian nếu có
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(Q(end_time__date__gte=date_from) | Q(recurrence_rule__in=['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']))
        if date_to:
            qs = qs.filter(Q(start_time__date__lte=date_to) | Q(recurrence_rule__in=['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']))
        
        return qs.order_by('start_time')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def _can_edit(self, event):
        """Chỉ chủ sở hữu hoặc khách mời có quyền 'edit' mới được sửa sự kiện."""
        user = self.request.user
        if event.user == user:
            return True
        invite = event.invitations.filter(invitee=user, status='accepted').first()
        return invite is not None and invite.permission == 'edit'

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        if not self._can_edit(instance):
            return Response({"error": "Bạn không có quyền chỉnh sửa sự kiện này."}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        event = self.get_object()
        if event.user != request.user:
            return Response({"error": "Chỉ người tạo mới có quyền xoá"}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='trashed')
    def list_trash(self, request):
        qs = Event.objects.filter(user=request.user, deleted_at__isnull=False).order_by('-deleted_at')
        return Response(EventSerializer(qs, many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def trash(self, request, pk=None):
        event = self.get_object()
        if event.user != request.user:
            return Response({"error": "Chỉ người tạo mới có quyền xoá"}, status=status.HTTP_403_FORBIDDEN)
        
        # Notify participants before deleting
        local_start = timezone.localtime(event.start_time)
        st_str = local_start.strftime('%H:%M')
        dt_str = local_start.strftime('%d/%m/%Y')

        # Dọn dẹp tất cả thông báo cũ liên quan đến sự kiện này (invite, accepted, v.v.)
        Notification.objects.filter(event=event).delete()

        invitations = event.invitations.all()
        for inv in invitations:
            Notification.objects.create(
                user=inv.invitee,
                ntype='canceled',
                event=event,
                content=f"Sự kiện '{event.title}' (vào lúc {st_str} ngày {dt_str}) đã bị hủy bởi người tạo."
            )
            
        event.deleted_at = timezone.now()
        event.save()
        return Response({"status": "deleted"})

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        event = self.get_object()
        if event.user != request.user:
            return Response({"error": "Chỉ người tạo mới có quyền khôi phục"}, status=status.HTTP_403_FORBIDDEN)
        event.deleted_at = None
        event.save()
        return Response({"status": "restored"})

    @action(detail=True, methods=['post'], url_path='permanent_delete')
    def permanent_delete(self, request, pk=None):
        event = self.get_object()
        if event.user != request.user:
            return Response({"error": "Chỉ người tạo mới có quyền xoá"}, status=status.HTTP_403_FORBIDDEN)
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        event = self.get_object()
        invitation = event.invitations.filter(invitee=request.user).first()
        if invitation:
            invitation.delete()
            # Clear notifications related to this event for this user
            Notification.objects.filter(user=request.user, event=event).delete()
            
            # Thông báo cho chủ sự kiện
            if event.user != request.user:
                Notification.objects.create(
                    user=event.user,
                    ntype='declined',
                    event=event,
                    content=f"{request.user.username} đã rời khỏi sự kiện: {event.title}"
                )
                
            return Response({"status": "left"})
        return Response({"error": "Not a participant"}, status=400)

class InvitationViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, pk=None):
        try:
            invite = EventInvitation.objects.get(event_id=pk, invitee=request.user)
            return Response(EventInvitationSerializer(invite).data)
        except EventInvitation.DoesNotExist:
            return Response({"error": "Invitation not found"}, status=404)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        try:
            # pk is event_id from frontend
            invite = EventInvitation.objects.get(event_id=pk, invitee=request.user)
            
            conflicts = Event.objects.filter(
                (Q(user=request.user) | Q(invitations__invitee=request.user, invitations__status='accepted')),
                start_time__lt=invite.event.end_time,
                end_time__gt=invite.event.start_time,
                deleted_at__isnull=True
            ).exclude(id=invite.event.id).distinct()

            if conflicts.exists():
                conflict_details = []
                for c in conflicts[:3]: # Trả về tối đa 3 vụ trùng
                    st = timezone.localtime(c.start_time).strftime('%H:%M')
                    et = timezone.localtime(c.end_time).strftime('%H:%M')
                    day = timezone.localtime(c.start_time).strftime('%d/%m')
                    conflict_details.append(f"{c.title} ({st}-{et} {day})")
                
                return Response({
                    "error": "collision", 
                    "detail": "Lịch bị trùng với: " + ", ".join(conflict_details),
                    "conflicts": conflict_details
                }, status=409)

            was_already_accepted = invite.status == 'accepted'
            invite.status = 'accepted'
            invite.save()
            
            # Chỉ tạo notification nếu lần đầu accept (tránh duplicate)
            if not was_already_accepted:
                Notification.objects.create(
                    user=invite.event.user,
                    ntype='accepted',
                    event=invite.event,
                    content=f"{request.user.username} đã chấp nhận lời mời tham gia: {invite.event.title}"
                )
            return Response({"status": "accepted"})
        except EventInvitation.DoesNotExist:
            return Response({"error": "Invitation not found"}, status=404)

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        try:
            # pk is event_id from frontend
            invite = EventInvitation.objects.get(event_id=pk, invitee=request.user)
            invite.status = 'declined'
            invite.save()

            # Thông báo cho chủ nhà
            if invite.event.user != request.user:
                Notification.objects.create(
                    user=invite.event.user,
                    ntype='declined',
                    event=invite.event,
                    content=f"{request.user.username} đã từ chối lời mời tham gia: {invite.event.title}"
                )

            return Response({"status": "declined"})
        except EventInvitation.DoesNotExist:
            return Response({"error": "Invitation not found"}, status=404)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        return Response({"error": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def update(self, request, *args, **kwargs):
        return Response({"error": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def partial_update(self, request, *args, **kwargs):
        return Response({"error": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        return Response({"error": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({"status": "success"})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "success"})

    @action(detail=False, methods=['delete'])
    def delete_all(self, request):
        Notification.objects.filter(user=request.user).delete()
        return Response({"status": "success"}, status=status.HTTP_204_NO_CONTENT)

class CalendarGroupViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarGroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Own calendars and calendars shared with user
        return CalendarGroup.objects.filter(
            Q(owner=user) | Q(shares__user=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.owner != request.user:
            return Response({"error": "Chỉ chủ sở hữu mới được chỉnh sửa lịch."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.owner != request.user:
            return Response({"error": "Chỉ chủ sở hữu mới được xoá lịch."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
class ReminderPreferenceViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get', 'put'], url_path='my-preference')
    def my_preference(self, request):
        """Get or update current user's reminder preference"""
        user = request.user
        
        if request.method == 'GET':
            try:
                pref = ReminderPreference.objects.get(user=user)
            except ReminderPreference.DoesNotExist:
                pref = ReminderPreference.objects.create(user=user, preference='both')
            
            serializer = ReminderPreferenceSerializer(pref)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            try:
                pref = ReminderPreference.objects.get(user=user)
            except ReminderPreference.DoesNotExist:
                pref = ReminderPreference.objects.create(user=user)
            
            serializer = ReminderPreferenceSerializer(pref, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)