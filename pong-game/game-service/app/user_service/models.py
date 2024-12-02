from django.contrib.auth.models import AbstractUser
from django.db import models

def user_dir_path(instance, filename):
    return 'user_{0}/{1}'.format(instance.user.id, filename)

class CustomUser(AbstractUser):
    alias = models.CharField(max_length=20, blank=False, unique=True)
    mmr = models.FloatField(default=1000)
    is_banned = models.BooleanField(default=False)
    friendList = models.ManyToManyField(CustomUser, blank=True)
    blockList = models.ManyToManyField(CustomUser, blank=True)
    # profilePic = models.ImageField(upload_to = user_dir_path)

    def __str__(self):
        return self.username

class FriendRequest(models.model):
    from_user = models.ForeignKey(
        CustomUser, related_name="from_user", on_delete=models.CASCADE
    )
    to_user = models.ForeignKey(
        CustomUser, related_name="to_user", on_delete=models.CASCADE
    )