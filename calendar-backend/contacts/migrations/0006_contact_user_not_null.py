# Generated manually to enforce owner required for Contact

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def delete_orphan_contacts(apps, schema_editor):
    Contact = apps.get_model('contacts', 'Contact')
    Contact.objects.filter(user__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('contacts', '0005_message'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(delete_orphan_contacts, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='contact',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
    ]
