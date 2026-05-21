from django.core.management.base import BaseCommand
from events.email_service import check_and_send_reminders
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Send email reminders for upcoming events'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Print detailed information',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Starting event reminder check...'))
        
        try:
            count = check_and_send_reminders()
            self.stdout.write(
                self.style.SUCCESS(f'✅ Successfully sent {count} reminder emails')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error: {str(e)}')
            )
            logger.error(f"Management command error: {str(e)}")
