from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Contact, Connection
from .serializers import ContactSerializer, ConnectionSerializer, UserSearchSerializer

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Contact.objects.filter(user=self.request.user)

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

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user, status='pending')

    @action(detail=False, methods=['get'])
    def friends(self, request):
        user = request.user
        conns = Connection.objects.filter(
            (Q(sender=user) | Q(receiver=user)) & Q(status='accepted')
        ).order_by('-is_pinned', '-created_at')
        
        friends_list = []
        for c in conns:
            friend = c.receiver if c.sender == user else c.sender
            friends_list.append(friend)
            
        serializer = UserSearchSerializer(friends_list, many=True)
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
        return Response(self.get_serializer(connection).data)

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        connection = self.get_object()
        if connection.receiver != request.user and connection.sender != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
        connection.status = 'declined'
        connection.save()
        return Response(self.get_serializer(connection).data)

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