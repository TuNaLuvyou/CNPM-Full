from apscheduler.schedulers.background import BackgroundScheduler
from events.email_service import check_and_send_reminders
import logging

logger = logging.getLogger(__name__)

def start():
    scheduler = BackgroundScheduler()
    # Chạy mỗi phút (tuỳ chỉnh lại nếu cần)
    scheduler.add_job(check_and_send_reminders, 'interval', minutes=1, id='check_reminders', replace_existing=True)
    try:
        scheduler.start()
        logger.info("Background scheduler started successfully for event reminders.")
    except Exception as e:
        logger.error(f"Error starting background scheduler: {str(e)}")
