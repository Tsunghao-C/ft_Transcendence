from django.contrib.auth.models import AbstractUser
# from game_service.models import MatchResults, LeaderBoard
from django.apps import apps
from django.db import models
from datetime import timedelta
from django.utils import timezone
from uuid import uuid4
import os

def pfpUploadPath(instance, fname):
	ext = fname.split('.')[-1]
	fname = f"{uuid4().hex}.{ext}" # 1 / 1bn chance of getting a duplicate
	full_path = os.path.join('profile_images', fname)
	print(full_path)
	return full_path

class CustomUser(AbstractUser):
	class Language(models.TextChoices):
		FR = "fr", "French"
		EN = "en", "English"
		PT = "pt", "Portuguese"

	is_admin = models.BooleanField(default=False)
	email = models.EmailField(max_length=100, blank=False, unique=True)
	alias = models.CharField(max_length=20, blank=False, unique=True, db_index=True)
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
		return self.alias

	def is_friend(self, user):
		return self.friendList.filter(id=user.id).exists()

	def has_blocked(self, user):
		return self.blockList.filter(id=user.id).exists()

	def is_sent(self, user):
		return FriendRequest.objects.filter(from_user=self, to_user=user).exists()

	def is_pending(self, user):
		return FriendRequest.objects.filter(from_user=user, to_user=self).exists()

	# def player_match_history(self, user):
	#     MatchResults = apps.get_model("game_service","MatchResults")
	#     return MatchResults.objects.filter(Q(p1=user) | Q(p2=user))

	# def player_rank(self, user):
	#     LeaderBoard = apps.get_model("game_service", "Leaderboard")
	#     return Leaderboard.objects.filter(player=user)


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

	class Meta:
		indexes = [
			models.Index(fields=["from_user"]),
			models.Index(fields=["to_user"]),
		]

class OnlineUserActivity(models.Model):
	user = models.OneToOneField(
		CustomUser,
		related_name="online_activity",
		on_delete=models.CASCADE,
		db_index=True
	)
	path = models.CharField(max_length=255)
	last_activity = models.DateTimeField(auto_now=True)

	@classmethod
	def update_user_activity(cls, user, path):
		OnlineUserActivity.objects.update_or_create(
			user=user,
			defaults={"path": path, "last_activity": timezone.now()}
		)

	@classmethod
	def get_user_status(cls, user):
		try:
			user_record = OnlineUserActivity.objects.get(
				user=user
			)
			if user_record.last_activity >= timezone.now() - timedelta(minutes=2):
				if "/api/game/game" in user_record.path: # can change this later after game added
					return "ingame"
				return "online"
		except:
			return "offline"

	def __str__(self):
		return f"{self.user.alias} - Last Activity: {self.last_activity}"

class TemporaryOTP(models.Model):
	user_id = models.IntegerField()
	otp = models.CharField(max_length=6)
	created_at = models.DateTimeField(auto_now_add=True)
	expires_at = models.DateTimeField()
