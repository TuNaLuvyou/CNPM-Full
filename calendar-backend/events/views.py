from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Event
from .serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer

    def get_queryset(self):
        """Mặc định chỉ trả về events chưa xoá. Filter theo ngày nếu cần."""
        qs = Event.objects.filter(is_deleted=False).order_by('start_time')

        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if date_from:
            qs = qs.filter(start_time__date__gte=date_from)
        if date_to:
            qs = qs.filter(start_time__date__lte=date_to)

        return qs

    def get_deleted_queryset(self):
        return Event.objects.filter(is_deleted=True).order_by('-deleted_at')

    @action(detail=True, methods=['post'], url_path='trash')
    def trash(self, request, pk=None):
        """Soft-delete: chuyển vào thùng rác"""
        event = self.get_object()
        event.is_deleted = True
        event.deleted_at = timezone.now()
        event.save()
        return Response({'status': 'moved to trash'})

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        """Khôi phục từ thùng rác"""
        # Cần tìm kể cả đã xoá
        event = Event.objects.get(pk=pk)
        event.is_deleted = False
        event.deleted_at = None
        event.save()
        return Response(EventSerializer(event).data)

    @action(detail=False, methods=['get'], url_path='trash')
    def list_trash(self, request):
        """Lấy danh sách items trong thùng rác"""
        qs = self.get_deleted_queryset()
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'], url_path='permanent')
    def permanent_delete(self, request, pk=None):
        """Xoá vĩnh viễn khỏi DB"""
        event = Event.objects.get(pk=pk)
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)