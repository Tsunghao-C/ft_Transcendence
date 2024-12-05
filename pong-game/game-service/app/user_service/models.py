from django.contrib.auth.models import AbstractUser
from django.db import models
import os

def pfpUploadPath(instance, fname):
    ext = fname.split('.')[-1]
    fname = f"{instance.id}.{ext}"
    return os.path.join('profile_images', fname)

class CustomUser(AbstractUser):
    alias = models.CharField(max_length=20, blank=False, unique=True)
    mmr = models.FloatField(default=1000)
    is_banned = models.BooleanField(default=False)
    avatar = models.ImageField(default='default.jpg', upload_to=pfpUploadPath)

    def __str__(self):
        return self.username