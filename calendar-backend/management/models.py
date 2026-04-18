from django.db import models
from django.contrib.auth.models import User

class SupportRequest(models.Model):
    REQUEST_TYPES = [
        ('password_reset', 'Quên mật khẩu'),
        ('bug_report', 'Báo lỗi hệ thống'),
        ('feedback', 'Góp ý / Phản hồi'),
        ('feature_request', 'Yêu cầu tính năng'),
        ('other', 'Khác'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Đang chờ'),
        ('in_progress', 'Đang xử lý'),
        ('resolved', 'Đã giải quyết'),
        ('closed', 'Đã đóng'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='support_requests')
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPES, default='other')
    subject = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_note = models.TextField(blank=True, null=True, help_text="Ghi chú của admin khi xử lý yêu cầu")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Yêu cầu hỗ trợ"
        verbose_name_plural = "Yêu cầu hỗ trợ"

    def __str__(self):
        return f"{self.get_request_type_display()} - {self.user.username} ({self.status})"
