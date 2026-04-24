# Generated manually to enforce owner required for Event

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def delete_orphan_events(apps, schema_editor):
    Event = apps.get_model('events', 'Event')
    Event.objects.filter(user__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0008_event_recurrence_rule_calendargroup_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(delete_orphan_events, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='event',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
    ]
