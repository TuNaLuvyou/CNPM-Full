from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Contact, Connection, Message
from .serializers import ContactSerializer, ConnectionSerializer, UserSearchSerializer, MessageSerializer

...

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        connection_id = self.request.query_params.get('connection')
        if not connection_id:
            return Message.objects.none()
        
        # Chỉ được xem tin nhắn của kết nối mà mình tham gia
        return Message.objects.filter(
            Q(connection_id=connection_id) & 
            (Q(connection__sender=self.request.user) | Q(connection__receiver=self.request.user))
        ).order_by('created_at')

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        connection_id = request.query_params.get('connection')
        if not connection_id:
            return Response({"error": "Connection parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark all messages in this connection NOT from the current user as read
        Message.objects.filter(
            connection_id=connection_id,
            is_read=False
        ).exclude(sender=request.user).update(is_read=True)
        
        return Response({"message": "OK"})
from events.models import Notification

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Contact.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserSearchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSearchSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def by_email(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({"error": "Email parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if user == request.user:
            return Response({"error": "You cannot connect with yourself"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(user)
        return Response(serializer.data)

class ConnectionViewSet(viewsets.ModelViewSet):
    serializer_class = ConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Connection.objects.filter(Q(sender=user) | Q(receiver=user)).exclude(status='blocked')

    def create(self, request, *args, **kwargs):
        # 1. Kiểm tra receiver_id có hợp lệ không
        receiver_id = request.data.get('receiver')
        if not receiver_id:
            return Response({"error": "Receiver ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Ngăn chặn kết nối với chính mình
        try:
            receiver_id = int(receiver_id)
        except (ValueError, TypeError):
             return Response({"error": "Invalid Receiver ID"}, status=status.HTTP_400_BAD_REQUEST)

        if receiver_id == request.user.id:
            return Response({"error": "You cannot connect with yourself"}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Kiểm tra xem đã có yêu cầu kết nối nào tồn tại chưa (trong cả 2 chiều)
        exists = Connection.objects.filter(
            (Q(sender=request.user) & Q(receiver_id=receiver_id)) |
            (Q(sender_id=receiver_id) & Q(receiver=request.user))
        ).first()

        if exists:
            if exists.status == 'declined':
                # Nếu đã từ chối trước đó, xoá đi để cho phép tạo yêu cầu mới
                exists.delete()
            else:
                msg = "Kết nối đã tồn tại hoặc đang chờ xử lý"
                if exists.status == 'pending':
                    msg = "Lời mời kết nối đang chờ xử lý"
                elif exists.status == 'accepted':
                    msg = "Hai người đã là bạn bè"
                return Response({"error": msg}, status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        connection = serializer.save(sender=self.request.user, status='pending')
        # Notify the receiver
        Notification.objects.create(
            user=connection.receiver,
            ntype='friend_request',
            content=f"{self.request.user.username} đã gửi lời mời kết nối cho bạn."
        )

    @action(detail=False, methods=['get'])
    def friends(self, request):
        user = request.user
        conns = Connection.objects.filter(
            (Q(sender=user) | Q(receiver=user)) & Q(status='accepted')
        ).order_by('-is_pinned', '-created_at')
        
        serializer = self.get_serializer(conns, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def invitations(self, request):
        user = request.user
        invites = Connection.objects.filter(receiver=user, status='pending')
        serializer = self.get_serializer(invites, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        connection = self.get_object()
        if connection.receiver != request.user:
            return Response({"error": "Only the receiver can accept"}, status=status.HTTP_403_FORBIDDEN)
        
        connection.status = 'accepted'
        connection.save()
        
        # Notify the sender that the request was accepted
        Notification.objects.create(
            user=connection.sender,
            ntype='friend_accepted',
            content=f"{request.user.username} đã chấp nhận lời mời kết nối của bạn."
        )
        
        return Response(self.get_serializer(connection).data)

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        connection = self.get_object()
        if connection.receiver != request.user and connection.sender != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
        # Dọn dẹp thông báo liên quan (tìm theo ntype và nội dung có chứa username)
        Notification.objects.filter(
            ntype='friend_request',
            user=connection.receiver,
            content__icontains=connection.sender.username
        ).delete()
        
        connection.delete()
        return Response({"message": "Đã xoá kết nối/Từ chối lời mời"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        connection = self.get_object()
        if connection.receiver != request.user and connection.sender != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
        connection.status = 'blocked'
        connection.save()
        return Response(self.get_serializer(connection).data)

    @action(detail=True, methods=['post'])
    def toggle_pin(self, request, pk=None):
        connection = self.get_object()
        if connection.receiver != request.user and connection.sender != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
        connection.is_pinned = not connection.is_pinned
        connection.save()
        return Response(self.get_serializer(connection).data)