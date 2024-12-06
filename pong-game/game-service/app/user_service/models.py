from django.contrib.auth.models import AbstractUser
from django.db import models

def user_dir_path(instance, filename):
    return 'user_{0}/{1}'.format(instance.user.id, filename)

class CustomUser(AbstractUser):
    alias = models.CharField(max_length=20, blank=False, unique=True)
    mmr = models.FloatField(default=1000)
    is_banned = models.BooleanField(default=False)
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
    # profilePic = models.ImageField(upload_to = user_dir_path)

    def __str__(self):
        return self.username
    
    def is_friend(self, user):
        return user in self.friendList.all()
    
    def has_blocked(self, user):
        return user in self.blockList.all()
    
    def is_blocked_by(self, user):
        return user in self.is_blocked_by.all()

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