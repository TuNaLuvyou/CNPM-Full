import threading
from datetime import timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from django.conf import settings
from django.utils import timezone

scheduler = None
_start_lock = threading.Lock()
_started = False


def get_scheduler():
    global scheduler
    if scheduler is None:
        scheduler = BackgroundScheduler(timezone="Asia/Ho_Chi_Minh")
    return scheduler


def cleanup_expired_unverified_users():
    """Xoá các tài khoản chưa xác thực email có token đã hết hạn."""
    from django.contrib.auth.models import User
    from accounts.models import EmailVerificationToken

    expired_at = timezone.now() - timedelta(seconds=EmailVerificationToken.EXPIRE_SECONDS)
    expired_tokens = EmailVerificationToken.objects.filter(created_at__lte=expired_at)
    for token in expired_tokens.select_related('user'):
        user = token.user
        if not user.is_active:
            user.delete()
        else:
            token.delete()


def schedule_cleanup(user_id):
    """Lên lịch xoá tài khoản chưa xác thực sau khi token hết hạn."""
    if getattr(settings, 'TESTING', False):
        return

    from accounts.models import EmailVerificationToken

    run_at = timezone.now() + timedelta(seconds=EmailVerificationToken.EXPIRE_SECONDS + 5)
    s = get_scheduler()
    s.add_job(
        cleanup_expired_unverified_users,
        'date',
        run_date=run_at,
        id=f'cleanup_user_{user_id}',
        replace_existing=True,
        coalesce=True,
        max_instances=1,
    )


def start_scheduler():
    """Khởi động scheduler nếu chưa chạy. An toàn khi gọi nhiều lần (autoreload, multi-worker)."""
    if getattr(settings, 'TESTING', False):
        return

    global _started
    with _start_lock:
        if _started:
            return
        try:
            s = get_scheduler()
            s.add_job(
                cleanup_expired_unverified_users,
                'interval',
                minutes=1,
                id='sweep_expired_users',
                replace_existing=True,
                coalesce=True,
                max_instances=1,
            )
            s.start()
            _started = True
        except Exception:
            _started = False


