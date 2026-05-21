# Generated migration for adding reminder type to Notification and email_sent field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0002_event_reminder_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='email_sent',
            field=models.BooleanField(default=False),
        ),
    ]
