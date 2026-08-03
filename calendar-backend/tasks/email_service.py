import logging
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from tasks.models import Task
from events.models import Notification
from events.email_service import get_user_reminder_preference

logger = logging.getLogger('events')

def create_task_reminder_notification(task):
    """Create a reminder notification for a task"""
    try:
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
        
        display_name = user.first_name or user.username or "Bạn"
        html_message = f"""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light only">
            <meta name="supported-color-schemes" content="light only">
            <style>
                :root {{
                    color-scheme: light only;
                    supported-color-schemes: light only;
                }}
                .force-white, .force-white * {{ color: #ffffff !important; }}
                .force-sub, .force-sub * {{ color: #e0f2fe !important; }}
                [data-ogsc] .force-white {{ color: #ffffff !important; }}
                [data-ogsc] .force-sub {{ color: #e0f2fe !important; }}
                u + #body .force-white {{ color: #ffffff !important; }}
            </style>
        </head>
        <body id="body" style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border-collapse: separate; border-spacing: 0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                            <!-- Header -->
                            <tr>
                                <td style="background-color: #0284c7; background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%); padding: 36px 32px; text-align: center; border-top-left-radius: 19px; border-top-right-radius: 19px;">
                                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); padding: 12px 14px; border-radius: 16px; margin-bottom: 12px;">
                                        <span style="font-size: 28px; line-height: 1; color: #ffffff !important;">📌</span>
                                    </div>
                                    <h1 class="force-white" style="color: #ffffff !important; margin: 0; font-size: 24px; font-weight: 800; font-family: inherit;">
                                        <span style="color: #ffffff !important;">Nhắc Nhở Công Việc</span>
                                    </h1>
                                    <p class="force-sub" style="color: #e0f2fe !important; margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">
                                        <span style="color: #e0f2fe !important;">Lịch thông minh &amp; Cuộc sống gọn gàng</span>
                                    </p>
                                </td>
                            </tr>
                            <!-- Body -->
                            <tr>
                                <td style="padding: 36px 32px; color: #334155;">
                                    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">{task.title}</h2>
                                    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;">Xin chào <strong>{display_name}</strong>,</p>
                                    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">Đã đến giờ thực hiện công việc của bạn. Dưới đây là thông tin chi tiết:</p>
                                    
                                    <!-- Detail Card -->
                                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #334155;">
                                            <tr>
                                                <td style="padding: 6px 0; font-weight: 600; color: #64748b; width: 110px;">Công việc:</td>
                                                <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">{task.title}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Thời gian:</td>
                                                <td style="padding: 6px 0; font-weight: 700; color: #0284c7;">{context['time_str']}</td>
                                            </tr>
                                        </table>
                                    </div>

                                    <!-- Notice box -->
                                    <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 14px 18px; border-radius: 8px; margin-bottom: 28px;">
                                        <p style="margin: 0; font-size: 13.5px; color: #0369a1; line-height: 1.5; font-weight: 500;">
                                            📌 Đừng quên hoàn thành công việc đúng tiến độ bạn nhé!
                                        </p>
                                    </div>
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #f1f5f9; text-align: center; border-bottom-left-radius: 19px; border-bottom-right-radius: 19px;">
                                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                                        Đây là thông báo tự động từ hệ thống Lịch Cá Nhân. Vui lòng không phản hồi email này.
                                    </p>
                                    <p style="margin: 0; font-size: 12px; color: #cbd5e1; font-weight: 600;">
                                        © 2026 Lịch Cá Nhân. Tất cả các quyền được bảo lưu.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        subject = f"📌 Nhắc nhở công việc: {task.title}"
        
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
