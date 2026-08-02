import os

from django.apps import AppConfig
from django.conf import settings


class AccountsConfig(AppConfig):
    name = 'accounts'

    def ready(self):
        # Tránh khởi động 2 lần khi dev autoreload (RUN_MAIN chỉ set ở process chính)
        if os.environ.get('RUN_MAIN') == 'true' or not settings.DEBUG:
            from core.scheduler import start_scheduler
            start_scheduler()
