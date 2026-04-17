from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Contact, Connection, Message

class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class ConnectionSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')
    receiver_name = serializers.ReadOnlyField(source='receiver.username')
    receiver_email = serializers.ReadOnlyField(source='receiver.email')
    sender_email = serializers.ReadOnlyField(source='sender.email')
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Connection
        fields = [
            'id', 'sender', 'receiver', 'status', 'is_pinned',
            'sender_name', 'receiver_name', 'sender_email', 'receiver_email',
            'unread_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['sender', 'status', 'is_pinned', 'created_at', 'updated_at']

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = [
            'id', 'name', 'email', 'phone',
            'avatar_url', 'avatar_char', 'avatar_color',
            'created_at'
        ]
        read_only_fields = ['created_at']

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')
    
    class Meta:
        model = Message
        fields = ['id', 'connection', 'sender', 'sender_name', 'text', 'is_read', 'created_at']
        read_only_fields = ['sender', 'created_at']