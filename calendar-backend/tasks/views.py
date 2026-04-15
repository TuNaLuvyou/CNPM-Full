from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        qs = Task.objects.filter(is_deleted=False).order_by('created_at')

        # Filter theo trạng thái: ?done=true hoặc ?done=false
        done_param = self.request.query_params.get('done')
        if done_param == 'true':
            qs = qs.filter(is_completed=True)
        elif done_param == 'false':
            qs = qs.filter(is_completed=False)

        return qs

    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle_done(self, request, pk=None):
        """Toggle trạng thái hoàn thành của task"""
        task = self.get_object()
        task.is_completed = not task.is_completed
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'], url_path='trash')
    def trash(self, request, pk=None):
        task = self.get_object()
        task.is_deleted = True
        task.deleted_at = timezone.now()
        task.save()
        return Response({'status': 'moved to trash'})

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        task = Task.objects.get(pk=pk)
        task.is_deleted = False
        task.deleted_at = None
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=False, methods=['get'], url_path='trash')
    def list_trash(self, request):
        qs = Task.objects.filter(is_deleted=True).order_by('-deleted_at')
        return Response(TaskSerializer(qs, many=True).data)

    @action(detail=True, methods=['delete'], url_path='permanent')
    def permanent_delete(self, request, pk=None):
        task = Task.objects.get(pk=pk)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)