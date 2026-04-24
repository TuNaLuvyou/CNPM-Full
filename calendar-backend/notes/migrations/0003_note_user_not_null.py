# Generated manually to enforce owner required for Note

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def delete_orphan_notes(apps, schema_editor):
    Note = apps.get_model('notes', 'Note')
    Note.objects.filter(user__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0002_note_deleted_at'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(delete_orphan_notes, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='note',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
    ]
