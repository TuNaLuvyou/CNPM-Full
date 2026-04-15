from rest_framework import serializers
from django.utils import timezone
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    """
    Nhận dữ liệu từ FE TaskForm:
    - title, description
    - date + time  → start_time
    - deadlineDate + deadlineTime → deadline_time
    """
    # Write-only FE fields
    date = serializers.DateField(write_only=True, required=False, allow_null=True)
    time = serializers.TimeField(write_only=True, required=False, allow_null=True)
    deadlineDate = serializers.DateField(write_only=True, required=False, allow_null=True)
    deadlineTime = serializers.TimeField(write_only=True, required=False, allow_null=True)

    # Read-only display fields
    date_display = serializers.SerializerMethodField()
    time_display = serializers.SerializerMethodField()
    deadline_display = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'is_completed',
            'is_deleted', 'deleted_at',
            'start_time', 'deadline_time', 'created_at', 'updated_at',
            # FE-friendly
            'date', 'time', 'deadlineDate', 'deadlineTime',
            'date_display', 'time_display', 'deadline_display',
        ]
        read_only_fields = ['created_at', 'updated_at', 'deleted_at',
                           'date_display', 'time_display', 'deadline_display']
        extra_kwargs = {
            'start_time': {'required': False, 'allow_null': True},
            'deadline_time': {'required': False, 'allow_null': True},
        }

    def get_date_display(self, obj):
        if obj.start_time:
            return timezone.localtime(obj.start_time).strftime('%Y-%m-%d')
        return None

    def get_time_display(self, obj):
        if obj.start_time:
            return timezone.localtime(obj.start_time).strftime('%H:%M')
        return None

    def get_deadline_display(self, obj):
        if obj.deadline_time:
            return timezone.localtime(obj.deadline_time).strftime('%Y-%m-%d %H:%M')
        return None

    def validate(self, data):
        from datetime import datetime

        date = data.pop('date', None)
        time = data.pop('time', None)
        deadline_date = data.pop('deadlineDate', None)
        deadline_time = data.pop('deadlineTime', None)

        if date and time:
            naive = datetime.combine(date, time)
            data['start_time'] = timezone.make_aware(naive)
        elif date:
            from datetime import time as dtime
            naive = datetime.combine(date, dtime(0, 0))
            data['start_time'] = timezone.make_aware(naive)

        if deadline_date and deadline_time:
            naive = datetime.combine(deadline_date, deadline_time)
            data['deadline_time'] = timezone.make_aware(naive)
        elif deadline_date:
            from datetime import time as dtime
            naive = datetime.combine(deadline_date, dtime(23, 59))
            data['deadline_time'] = timezone.make_aware(naive)

        return data