from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Contact, Connection

class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class ConnectionSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')
    receiver_name = serializers.ReadOnlyField(source='receiver.username')
    receiver_email = serializers.ReadOnlyField(source='receiver.email')
    sender_email = serializers.ReadOnlyField(source='sender.email')
    friend_id = serializers.SerializerMethodField()
    friend_name = serializers.SerializerMethodField()
    friend_email = serializers.SerializerMethodField()

    class Meta:
        model = Connection
        fields = [
            'id', 'sender', 'receiver', 'status', 'is_pinned',
            'sender_name', 'receiver_name', 'sender_email', 'receiver_email',
            'friend_id', 'friend_name', 'friend_email', 'created_at', 'updated_at'
        ]
        read_only_fields = ['sender', 'status', 'is_pinned', 'created_at', 'updated_at']

    def get_friend_id(self, obj):
        request = self.context.get('request')
        if not request or not request.user: return None
        return obj.receiver_id if obj.sender_id == request.user.id else obj.sender_id

    def get_friend_name(self, obj):
        request = self.context.get('request')
        if not request or not request.user: return None
        return obj.receiver.username if obj.sender_id == request.user.id else obj.sender.username

    def get_friend_email(self, obj):
        request = self.context.get('request')
        if not request or not request.user: return None
        return obj.receiver.email if obj.sender_id == request.user.id else obj.sender.email

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = [
            'id', 'name', 'email', 'phone',
            'avatar_url', 'avatar_char', 'avatar_color',
            'created_at'
        ]
        read_only_fields = ['created_at']
