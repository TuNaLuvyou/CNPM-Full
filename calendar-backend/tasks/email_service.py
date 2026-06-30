import logging
from django.utils import timezone
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from tasks.models import Task
from events.models import Notification
from events.email_service import get_user_reminder_preference

logger = logging.getLogger('events')

def create_task_reminder_notification(task):
    """Create a reminder notification for a task"""
    try:
        from django.utils import timezone
        local_time = timezone.localtime(task.reminder_time)
        dt_str = local_time.strftime('%H:%M %d/%m/%Y')
        
        notification = Notification.objects.create(
            user=task.user,
            ntype='task_reminder',
            content=f'Đã đến giờ thực hiện công việc: "{task.title}"',
        )
        return notification
    except Exception as e:
        logger.error(f"Failed to create reminder notification for task {task.id}: {str(e)}")
        return None

def send_task_reminder_email(task):
    """Send reminder email for task"""
    try:
        user = task.user
        if not user.email:
            return False
            
        context = {
            'user': user,
            'title': task.title,
            'time_str': timezone.localtime(task.reminder_time).strftime('%H:%M %d/%m/%Y'),
        }
        
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Nhắc nhở công việc</h2>
            <p>Chào {user.first_name or user.username},</p>
            <p>Đây là lời nhắc cho công việc <strong>{task.title}</strong> của bạn.</p>
            <p>Thời gian nhắc nhở: {context['time_str']}</p>
        </body>
        </html>
        """
        
        subject = f"Nhắc nhở công việc: {task.title}"
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=f"Nhắc nhở công việc: {task.title} vào lúc {context['time_str']}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        msg.attach_alternative(html_message, "text/html")
        msg.send(fail_silently=True)
        return True
        
    except Exception as e:
        logger.error(f"Failed to send reminder email for task {task.id}: {str(e)}")
        return False

def check_and_send_task_reminders():
    """Check for tasks that need reminders and send them"""
    try:
        now = timezone.now()
        
        # Find tasks where reminder_time is in the past, not sent, not deleted, not completed
        tasks_to_remind = Task.objects.filter(
            reminder_sent=False,
            reminder_time__lte=now,
            is_completed=False,
            deleted_at__isnull=True,
        )
        
        sent_count = 0
        for task in tasks_to_remind:
            user_pref = get_user_reminder_preference(task.user)
            
            # Skip if preference is 'off'
            if user_pref == 'off':
                task.reminder_sent = True
                task.save()
                continue
                
            notification = None
            email_sent = False
            
            if user_pref in ['app', 'both']:
                notification = create_task_reminder_notification(task)
            
            if user_pref in ['email', 'both']:
                email_sent = send_task_reminder_email(task)
                
            if notification and email_sent:
                notification.email_sent = True
                notification.save()
                
            task.reminder_sent = True
            task.save()
            sent_count += 1
            
        if sent_count > 0:
            logger.info(f"Sent {sent_count} task reminder notifications")
        return sent_count
        
    except Exception as e:
        logger.error(f"Error in check_and_send_task_reminders: {str(e)}")
        return 0
