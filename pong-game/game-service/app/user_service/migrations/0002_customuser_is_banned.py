# Generated by Django 5.1.3 on 2024-11-21 10:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user_service', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='is_banned',
            field=models.BooleanField(default=False),
        ),
    ]