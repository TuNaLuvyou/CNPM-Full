from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Note
from .serializers import NoteSerializer


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        is_deleted_qs = self.request.query_params.get('trash', 'false') == 'true'
        if self.action in ['restore', 'permanent_delete']:
            is_deleted_qs = True
        return Note.objects.filter(user=self.request.user, deleted_at__isnull=not is_deleted_qs).order_by('-is_pinned', '-updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='toggle_pin')
    def toggle_pin(self, request, pk=None):
        """Toggle trạng thái ghim của note"""
        note = self.get_object()
        note.is_pinned = not note.is_pinned
        note.save()
        return Response(NoteSerializer(note).data)

    @action(detail=True, methods=['post'], url_path='trash')
    def trash(self, request, pk=None):
        from django.utils import timezone
        note = self.get_object()
        note.deleted_at = timezone.now()
        note.is_pinned = False
        note.save()
        return Response({'status': 'deleted'})

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        note = self.get_object()
        note.deleted_at = None
        note.save()
        return Response(NoteSerializer(note).data)

    @action(detail=False, methods=['get'], url_path='trashed')
    def list_trash(self, request):
        qs = Note.objects.filter(user=request.user, deleted_at__isnull=False).order_by('-deleted_at')
        return Response(NoteSerializer(qs, many=True).data)

    @action(detail=True, methods=['post'], url_path='permanent_delete')
    def permanent_delete(self, request, pk=None):
        note = self.get_object()
        note.delete()
        return Response(status=204)