from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Note
from .serializers import NoteSerializer


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user).order_by('-is_pinned', '-updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='toggle_pin')
    def toggle_pin(self, request, pk=None):
        """Toggle trạng thái ghim của note"""
        note = self.get_object()
        note.is_pinned = not note.is_pinned
        note.save()
        return Response(NoteSerializer(note).data)