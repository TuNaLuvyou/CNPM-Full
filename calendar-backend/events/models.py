from django.db import models
from django.contrib.auth.models import User

class Event(models.Model):
    # Phân loại giữa Sự kiện (Event) và Lịch hẹn (Appointment)
    TYPE_CHOICES = [
        ('event', 'Sự kiện'), 
        ('appointment', 'Lịch hẹn')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    event_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='event')
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    link = models.URLField(blank=True, null=True)
    color = models.CharField(max_length=50, default='blue')
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_all_day = models.BooleanField(default=False)

    # Soft delete — dùng cho Thùng rác
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.get_event_type_display()}] {self.title}"