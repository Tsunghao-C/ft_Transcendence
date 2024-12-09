from django.contrib.auth.models import AbstractUser
from django.db import models
from uuid import uuid4
import os

def user_dir_path(instance, filename):
    return 'user_{0}/{1}'.format(instance.user.id, filename)

def pfpUploadPath(instance, fname):
    ext = fname.split('.')[-1]
    fname = f"{uuid4().hex}.{ext}" # 1 / 1bn chance of getting a duplicate
    return os.path.join('profile_images', fname)

class CustomUser(AbstractUser):
    class Language(models.TextChoices):
        FR = "fr", "French"
        EN = "en", "English"

    alias = models.CharField(max_length=20, blank=False, unique=True)
    mmr = models.FloatField(default=1000)
    is_banned = models.BooleanField(default=False)
    avatar = models.ImageField(default='default.jpg', upload_to=pfpUploadPath)
    friendList = models.ManyToManyField(
        "self", 
        blank=True, 
        related_name="friends_with",
        verbose_name="friends",
        symmetrical=False
    )
    blockList = models.ManyToManyField(
        "self", 
        blank=True, 
        related_name="blocked_by", 
        symmetrical=False,
        verbose_name="blocked_users"
    )
    winCount = models.PositiveIntegerField(default=0)
    lossCount = models.PositiveIntegerField(default=0)
    language = models.CharField(
        max_length=2,
        choices=Language.choices,
        default=Language.EN
    )

    def __str__(self):
        return self.username

    def is_friend(self, user):
        return self.friendList.filter(id=user.id).exists()

    def has_blocked(self, user):
        return self.blockList.filter(id=user.id).exists()
    
    def is_sent(self, user):
        return FriendRequest.objects.filter(from_user=self, to_user=user).exists()
    
    def is_pending(self, user):
         return FriendRequest.objects.filter(from_user=user, to_user=self).exists()

class FriendRequest(models.Model):
    from_user = models.ForeignKey(
        CustomUser, related_name="from_user", on_delete=models.CASCADE
    )
    to_user = models.ForeignKey(
        CustomUser, related_name="to_user", on_delete=models.CASCADE
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "From {}, to {}".format(self.from_user.alias, self.to_user.alias)