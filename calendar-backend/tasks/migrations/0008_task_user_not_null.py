# Generated manually to enforce owner required for Task

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def delete_orphan_tasks(apps, schema_editor):
    Task = apps.get_model('tasks', 'Task')
    Task.objects.filter(user__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0007_task_color_task_reminder_time'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(delete_orphan_tasks, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='task',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
    ]
