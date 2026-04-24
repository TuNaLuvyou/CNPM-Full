from django.db import models
from django.contrib.auth.models import User

class CalendarGroup(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_calendars')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=50, default='blue')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.owner.username})"

class CalendarShare(models.Model):
    PERMISSION_CHOICES = [
        ('view', 'View Only'),
        ('edit', 'Can Edit'),
    ]
    calendar = models.ForeignKey(CalendarGroup, related_name='shares', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='shared_calendars', on_delete=models.CASCADE)
    permission = models.CharField(max_length=10, choices=PERMISSION_CHOICES, default='view')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('calendar', 'user')

    def __str__(self):
        return f"{self.calendar.name} shared with {self.user.username}"

class Event(models.Model):
    TYPE_CHOICES = [
        ('event', 'Sự kiện'), 
        ('appointment', 'Lịch hẹn')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    event_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='event')
    calendar_group = models.ForeignKey(CalendarGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    link = models.URLField(blank=True, null=True)
    color = models.CharField(max_length=50, default='blue')
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_all_day = models.BooleanField(default=False)
    recurrence_rule = models.CharField(max_length=255, blank=True, null=True)

    deleted_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.get_event_type_display()}] {self.title}"

class EventInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    PERMISSION_CHOICES = [
        ('view', 'View Only'),
        ('edit', 'Can Edit'),
    ]
    
    event = models.ForeignKey(Event, related_name='invitations', on_delete=models.CASCADE)
    invitee = models.ForeignKey(User, related_name='event_invitations', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    permission = models.CharField(max_length=10, choices=PERMISSION_CHOICES, default='view')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('event', 'invitee')

    def __str__(self):
        return f"{self.invitee.username} invited to {self.event.title} ({self.status})"

class Notification(models.Model):
    NTYPE_CHOICES = [
        ('invite', 'Event Invitation'),
        ('accepted', 'Invitation Accepted'),
        ('declined', 'Invitation Declined'),
        ('canceled', 'Event Canceled'),
        ('friend_request', 'Friend Request'),
        ('friend_accepted', 'Friend Request Accepted'),
        ('security', 'Security Alert'),
        ('system', 'System Announcement'),
    ]
    
    user = models.ForeignKey(User, related_name='notifications', on_delete=models.CASCADE)
    ntype = models.CharField(max_length=20, choices=NTYPE_CHOICES, default='invite')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, null=True, blank=True)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.content[:30]}"