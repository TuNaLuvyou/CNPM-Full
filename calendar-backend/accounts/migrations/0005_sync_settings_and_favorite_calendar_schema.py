# Generated manually to sync DB schema with accounts models

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_remove_usersettings_category_management_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='userfavoritecalendar',
            options={'ordering': ['sort_order', 'created_at']},
        ),
        migrations.RemoveField(
            model_name='usersettings',
            name='custom_categories',
        ),
        migrations.AddField(
            model_name='userfavoritecalendar',
            name='sort_order',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='userfavoritecalendar',
            name='type',
            field=models.CharField(
                choices=[
                    ('internal', 'Internal Calendar (CalendarGroup)'),
                    ('external', 'External/Preset (Holidays, etc.)'),
                ],
                default='external',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='usersettings',
            name='show_declined',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='usersettings',
            name='theme',
            field=models.CharField(
                choices=[('light', 'Light'), ('dark', 'Dark'), ('system', 'System Default')],
                default='light',
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name='usersettings',
            name='secondary_timezone',
            field=models.CharField(blank=True, default='America/New_York', max_length=60, null=True),
        ),
    ]
