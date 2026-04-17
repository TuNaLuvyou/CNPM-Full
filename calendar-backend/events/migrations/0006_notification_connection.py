from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('events', '0005_notification_eventinvitation'),
        ('contacts', '0003_connection'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='connection',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='contacts.connection'),
        ),
        migrations.AlterField(
            model_name='notification',
            name='ntype',
            field=models.CharField(choices=[('invite', 'Event Invitation'), ('accepted', 'Invitation Accepted'), ('declined', 'Invitation Declined'), ('friend_request', 'Friend Request'), ('friend_accepted', 'Friend Request Accepted')], default='invite', max_length=20),
        ),
    ]
