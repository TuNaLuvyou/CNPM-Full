from django.apps import AppConfig
import os

class EventsConfig(AppConfig):
    name = 'events'

    def ready(self):
        # Tránh việc scheduler chạy 2 lần nếu sử dụng Django runserver (có reload_run)
        if os.environ.get('RUN_MAIN', None) != 'true':
            from . import scheduler
            scheduler.start()
