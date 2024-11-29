# Generated by Django 5.1.3 on 2024-11-22 17:23

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='MatchResults',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('matchoutcome', models.IntegerField(choices=[(0, 'Player 2 Wins'), (1, 'Player 1 Wins')])),
                ('p1', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches_as_p1', to=settings.AUTH_USER_MODEL)),
                ('p2', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches_as_p2', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]