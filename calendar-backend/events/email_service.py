from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from datetime import datetime, timedelta
from django.utils import timezone
from .models import Event, Notification, ReminderPreference
from accounts.models import UserSettings
import logging

logger = logging.getLogger(__name__)

def get_user_reminder_preference(user):
    """Get or create user reminder preference"""
    try:
        pref = ReminderPreference.objects.get(user=user)
        return pref.preference
    except ReminderPreference.DoesNotExist:
        # Create default preference (both)
        pref = ReminderPreference.objects.create(user=user, preference='both')
        return pref.preference

def should_send_app_notification(user):
    """Check if user wants app notifications"""
    pref = get_user_reminder_preference(user)
    return pref in ['app', 'both']

def should_send_email_notification(user):
    """Check if user wants email notifications"""
    pref = get_user_reminder_preference(user)
    return pref in ['email', 'both']

def get_user_notification_minutes(user):
    """Get user's notification_minutes from UserSettings (defaults to 15 if not set)"""
    try:
        return user.settings.notification_minutes
    except UserSettings.DoesNotExist:
        return 15

def create_reminder_notification(event):
    """Create a reminder notification in the system"""
    try:
        user = event.user
        
        # Check if user wants app notifications
        if not should_send_app_notification(user):
            logger.info(f"App notification disabled for user {user.username}")
            return None
        
        # Format event time using local timezone (not raw UTC)
        local_start = timezone.localtime(event.start_time)
        event_time = local_start.strftime('%H:%M ngày %d/%m/%Y')
        
        # Create notification content
        content = f"Sắp đến giờ của sự kiện '{event.title}' lúc {event_time}"
        
        # Create notification
        notification = Notification.objects.create(
            user=user,
            ntype='reminder',
            event=event,
            content=content,
            is_read=False,
            email_sent=False
        )
        
        logger.info(f"Reminder notification created for event '{event.title}' for user {user.username}")
        return notification
    
    except Exception as e:
        logger.error(f"Failed to create reminder notification for event {event.id}: {str(e)}")
        return None

def send_event_reminder_email(event):
    """Send reminder email for upcoming event"""
    try:
        user = event.user
        
        # Check if user wants email notifications
        if not should_send_email_notification(user):
            logger.info(f"Email notification disabled for user {user.username}")
            return False
        
        if not user.email:
            logger.warning(f"User {user.username} has no email address")
            return False
        
        # Format event time using local timezone (not raw UTC)
        local_start = timezone.localtime(event.start_time)
        event_time = local_start.strftime('%H:%M ngày %d/%m/%Y')
        
        # Get reminder minutes from user settings (not from event model default)
        reminder_minutes = get_user_notification_minutes(user)

        # Email context
        context = {
            'username': user.first_name or user.username,
            'event_title': event.title,
            'event_time': event_time,
            'event_location': event.location or 'Không xác định',
            'event_description': event.description or 'Không có mô tả',
            'reminder_minutes': reminder_minutes,
        }
        
        # Create email content
        subject = f'📅 Nhắc nhở: {event.title} sắp bắt đầu'
        html_message = render_to_string('emails/event_reminder.html', context)
        plain_message = strip_tags(html_message)
        
        # Send email
        send_mail(
            subject,
            plain_message,
            None,  # Uses DEFAULT_FROM_EMAIL from settings
            [user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Reminder email sent for event '{event.title}' to {user.email}")
        return True
    
    except Exception as e:
        logger.error(f"Failed to send reminder email for event {event.id}: {str(e)}")
        return False

def check_and_send_reminders():
    """Check for events that need reminders and send emails + in-app notifications"""
    try:
        # Get current time
        now = timezone.now()
        
        # Find events that:
        # 1. Have not had reminder sent yet
        # 2. Are about to start (within the reminder window)
        # 3. Haven't started yet
        events_to_remind = Event.objects.filter(
            reminder_sent=False,
            start_time__gt=now,
            start_time__lte=now + timedelta(minutes=120),  # Check up to 2 hours ahead
            deleted_at__isnull=True,
        )
        
        sent_count = 0
        for event in events_to_remind:
            # Calculate time until event
            time_until_event = event.start_time - now
            minutes_until = time_until_event.total_seconds() / 60
            
            # Use user's notification_minutes from UserSettings (not event-level default)
            user_reminder_minutes = get_user_notification_minutes(event.user)

            # Send reminder if we're within the reminder window
            if minutes_until <= user_reminder_minutes + 1:  # +1 for timing tolerance
                user_pref = get_user_reminder_preference(event.user)
                
                # Skip if preference is 'off'
                if user_pref == 'off':
                    logger.info(f"Reminders disabled for user {event.user.username}")
                    event.reminder_sent = True
                    event.save()
                    continue
                
                notification = None
                email_sent = False
                
                # 1. Create in-app notification if needed
                if user_pref in ['app', 'both']:
                    notification = create_reminder_notification(event)
                
                # 2. Send email notification if needed
                if user_pref in ['email', 'both']:
                    email_sent = send_event_reminder_email(event)
                
                # 3. Mark email_sent in notification if exists
                if notification and email_sent:
                    notification.email_sent = True
                    notification.save()
                
                # 4. Mark event reminder as sent
                event.reminder_sent = True
                event.save()
                
                sent_count += 1
        
        logger.info(f"Sent {sent_count} reminder notifications")
        return sent_count
    
    except Exception as e:
        logger.error(f"Error in check_and_send_reminders: {str(e)}")
        return 0


