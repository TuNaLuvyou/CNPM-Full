# Generated migration for adding reminder fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0001_initial'),  # Adjust this to match your latest migration
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='reminder_minutes',
            field=models.IntegerField(default=15, help_text='Minutes before event to send reminder'),
        ),
        migrations.AddField(
            model_name='event',
            name='reminder_sent',
            field=models.BooleanField(default=False),
        ),
    ]
