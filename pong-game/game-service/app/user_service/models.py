from django.contrib.auth.models import AbstractUser
from django.db import models
from uuid import uuid4
import os

def pfpUploadPath(instance, fname):
    ext = fname.split('.')[-1]
    fname = f"{uuid4().hex}.{ext}" # 1 / 1bn chance of getting a duplicate
    return os.path.join('profile_images', fname)

class CustomUser(AbstractUser):
    alias = models.CharField(max_length=20, blank=False, unique=True)
    mmr = models.FloatField(default=1000)
    is_banned = models.BooleanField(default=False)
    avatar = models.ImageField(default='default.jpg', upload_to=pfpUploadPath)

    def __str__(self):
        return self.username