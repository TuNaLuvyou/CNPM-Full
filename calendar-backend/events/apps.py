from django.apps import AppConfig
from django.conf import settings
import os

class EventsConfig(AppConfig):
    name = 'events'

    def ready(self):
        if getattr(settings, 'TESTING', False):
            return
        # Tránh khởi động 2 lần khi dev autoreload (RUN_MAIN chỉ set ở process chính)
        if os.environ.get('RUN_MAIN') == 'true' or not settings.DEBUG:
            from . import scheduler
            scheduler.start()

