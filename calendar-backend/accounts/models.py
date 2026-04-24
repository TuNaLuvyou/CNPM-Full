from django.db import models
from django.conf import settings


class UserSettings(models.Model):
    """
    Flat scalar settings per user (1-to-1).
    Nhóm 1-5 từ thiết kế DB.
    """
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System Default'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='settings'
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    # Nhóm 1 — Ngôn ngữ & Khu vực
    language          = models.CharField(max_length=10, default='vi')
    region            = models.CharField(max_length=10, default='VN')
    date_format       = models.CharField(max_length=20, default='DD/MM/YYYY')
    time_format       = models.CharField(max_length=5, default='24h')   # '12h' | '24h'
    first_day_of_week = models.IntegerField(default=1)                  # 0=Sun, 1=Mon

    # Nhóm 2 — Múi giờ
    primary_timezone        = models.CharField(max_length=60, default='Asia/Ho_Chi_Minh')
    secondary_timezone      = models.CharField(max_length=60, default='America/New_York', null=True, blank=True)
    show_secondary_timezone = models.BooleanField(default=False)

    # Nhóm 3 — Cài đặt sự kiện
    default_location  = models.CharField(max_length=255, blank=True, null=True)
    default_meet_link = models.URLField(blank=True, null=True)

    # Nhóm 4 — Thông báo
    notification_type    = models.CharField(max_length=20, default='screen')  # 'screen'|'email'|'push'
    notification_minutes = models.IntegerField(default=10)

    # Nhóm 5 — Tùy chọn xem
    theme                = models.CharField(max_length=10, choices=THEME_CHOICES, default='light')
    show_weekends        = models.BooleanField(default=True)
    show_completed_tasks = models.BooleanField(default=True)
    show_week_numbers    = models.BooleanField(default=False)
    show_declined      = models.BooleanField(default=False)
    dim_past_events      = models.BooleanField(default=True)
    week_start_day       = models.CharField(max_length=10, default='monday')

    def __str__(self):
        return f"Settings for {self.user.email}"


class UserFavoriteCalendar(models.Model):
    """
    Nhóm 6 — Lịch yêu thích (1-to-many per user).
    Hỗ trợ cả:
    - Preset holidays: calendar_key='vn_holidays', calendar_group=None
    - CalendarGroup: calendar_key='', calendar_group=<FK>
    """
    TYPE_CHOICES = [
        ('internal', 'Internal Calendar (CalendarGroup)'),
        ('external', 'External/Preset (Holidays, etc.)'),
    ]

    user           = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorite_calendars'
    )
    type           = models.CharField(max_length=10, choices=TYPE_CHOICES, default='external')
    
    # Preset holiday key (vn_holidays, world_holidays, ...) hoặc custom string
    calendar_key   = models.CharField(max_length=100, blank=True, default='')
    
    # FK tới CalendarGroup nếu là lịch nội bộ
    calendar_group = models.ForeignKey(
        'events.CalendarGroup',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='favorited_by'
    )
    
    name           = models.CharField(max_length=255, blank=True, default='')
    color          = models.CharField(max_length=50, default='blue')
    is_active      = models.BooleanField(default=True)
    sort_order     = models.IntegerField(default=0)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'accounts_userfavoritecalendar'
        ordering = ['sort_order', 'created_at']
        unique_together = [
            ('user', 'calendar_key'),   # Preset unique per user
        ]

    def __str__(self):
        label = self.calendar_key or (self.calendar_group.name if self.calendar_group else self.name)
        return f"{self.user.username} → {label}"
