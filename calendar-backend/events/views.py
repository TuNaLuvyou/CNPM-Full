from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Event, EventInvitation, Notification
from .serializers import EventSerializer, NotificationSerializer, EventInvitationSerializer

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Mặc định lấy các sự kiện chưa xóa, trừ khi action là restore/permanent_delete hoặc có param trash=true
        is_deleted_qs = self.request.query_params.get('trash', 'false') == 'true'
        if self.action in ['restore', 'permanent_delete']:
            is_deleted_qs = True

        qs = Event.objects.filter(
            (Q(user=user) | Q(invitations__invitee=user, invitations__status__in=['accepted', 'pending'])) &
            Q(is_deleted=is_deleted_qs)
        ).distinct()
        
        # Filter theo thời gian nếu có
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from: qs = qs.filter(end_time__date__gte=date_from)
        if date_to: qs = qs.filter(start_time__date__lte=date_to)
        
        return qs.order_by('start_time')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'], url_path='trashed')
    def list_trash(self, request):
        qs = Event.objects.filter(user=request.user, is_deleted=True).order_by('-deleted_at')
        return Response(EventSerializer(qs, many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def trash(self, request, pk=None):
        event = self.get_object()
        event.is_deleted = True
        event.deleted_at = timezone.now()
        event.save()
        return Response({"status": "trashed"})

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        event = self.get_object()
        event.is_deleted = False
        event.deleted_at = None
        event.save()
        return Response({"status": "restored"})

    @action(detail=True, methods=['post'], url_path='permanent_delete')
    def permanent_delete(self, request, pk=None):
        event = self.get_object()
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
            # COMPREHENSIVE DEBUG
            print(f"--- START ACCEPT DEBUG ---")
            print(f"Request User: ID={request.user.id}, Username={request.user.username}")
            print(f"Incoming PK (Event ID): {pk}")
            
            all_invs = EventInvitation.objects.all()
            print(f"Total invitations in DB: {all_invs.count()}")
            for i in all_invs:
                print(f"  - Invitation ID={i.id}, EventID={i.event_id}, InviteeID={i.invitee_id}, Status={i.status}")
            
            # pk is event_id from frontend
            invite = EventInvitation.objects.get(event_id=pk, invitee=request.user)
            print(f"Found invitation! ID={invite.id}")
            
            # Check collision
            overlaps = Event.objects.filter(
                (Q(user=request.user) | Q(invitations__invitee=request.user, invitations__status='accepted')),
                start_time__lt=invite.event.end_time,
                end_time__gt=invite.event.start_time,
                is_deleted=False
            ).exclude(id=invite.event.id).distinct().exists()

            if overlaps and request.data.get('force') != True:
                return Response({
                    "error": "collision", 
                    "message": "Sự kiện này trùng lịch với các mục khác của bạn."
                }, status=409)

            invite.status = 'accepted'
            invite.save()
            
            # Xóa thông báo mời khi đã chấp nhận
            Notification.objects.filter(user=request.user, event=invite.event, ntype='invite').delete()

            # Thông báo cho chủ nhà
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

            # Xóa thông báo mời khi từ chối
            Notification.objects.filter(user=request.user, event=invite.event, ntype='invite').delete()

            return Response({"status": "declined"})
        except EventInvitation.DoesNotExist:
            return Response({"error": "Invitation not found"}, status=404)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

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