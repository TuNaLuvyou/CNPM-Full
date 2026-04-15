from rest_framework import serializers
from .models import Contact


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = [
            'id', 'name', 'email', 'phone',
            'avatar_url', 'avatar_char', 'avatar_color',
            'created_at'
        ]
        read_only_fields = ['created_at']