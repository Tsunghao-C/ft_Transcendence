from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    alias = models.CharField(max_length=20, blank=False)
    mmr = models.FloatField(default=1000)

    def __str__(self):
        return self.username
