# Generated migration for adding ReminderPreference model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('events', '0003_notification_reminder_and_email_sent'),
    ]

    operations = [
        migrations.CreateModel(
            name='ReminderPreference',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('preference', models.CharField(choices=[('off', 'Tắt'), ('app', 'Thông báo trong ứng dụng'), ('email', 'Thông báo qua email'), ('both', 'Cả hai')], default='both', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='reminder_preference', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
