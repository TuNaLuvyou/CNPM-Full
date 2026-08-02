from django.apps import AppConfig
from django.conf import settings
import os

class EventsConfig(AppConfig):
    name = 'events'

    def ready(self):
        if getattr(settings, 'TESTING', False):
            return
        # Tránh việc scheduler chạy 2 lần nếu sử dụng Django runserver (có reload_run)
        if os.environ.get('RUN_MAIN', None) != 'true':
            from . import scheduler
            scheduler.start()

