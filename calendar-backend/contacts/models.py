from django.db import models
from django.contrib.auth.models import User

class Contact(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)
    
    # Dùng để hiển thị avatar kiểu chữ cái + màu nền (như FE đang làm)
    avatar_char = models.CharField(max_length=2, blank=True, null=True)
    avatar_color = models.CharField(max_length=50, default='bg-blue-500')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Tự động set avatar_char từ tên nếu chưa có
        if not self.avatar_char and self.name:
            self.avatar_char = self.name[0].upper()
        super().save(*args, **kwargs)