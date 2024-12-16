from django.db import models
from user_service.models import CustomUser
from django.db.models import F
import math
import uuid

class Tournament(models.Model):
	id = models.UUIDField(
		primary_key=True,
		default=uuid.uuid4,
		editable=False
	)
	tournament_admin = models.ForeignKey( # person who created tournament
		CustomUser,
		on_delete=models.CASCADE,
		related_name="created_tournaments"
	)
	name = models.CharField(max_length=100)
	is_active = models.BooleanField(default=False)
	is_finished = models.BooleanField(default=False)
	max_players = models.PositiveSmallIntegerField()
	num_curr_players = models.PositiveSmallIntegerField(default=0)
	num_brackets = models.PositiveSmallIntegerField(default=0)

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return self.name

	def increment_players(self):
		self.num_curr_players = F("num_curr_players") + 1
		self.save()
		self.refresh_from_db()

	def get_num_brackets(self):
		return math.ceil(math.log2(self.num_curr_players))

	def start_tournament(self):
		if self.is_active:
			print("Tournament already started, can't be started again") # replace this with error log
			return
		self.is_active = True;
		self.num_brackets = self.get_num_brackets()
		self.save()
		self.refresh_from_db()

	class Meta:
		ordering = ["-created_at"]
	

class TourneyParticipant(models.Model):
	user = models.ForeignKey(
		CustomUser,
		on_delete=models.CASCADE
	)
	tournament = models.ForeignKey(
		Tournament,
		on_delete=models.CASCADE,
		related_name="participants"
	)
	eliminated = models.BooleanField(default=False)
	bracket = models.PositiveIntegerField(default=0)

	class Meta:
		unique_together = ("user", "tournament") # user can only participate in one tourny

	def __str__(self):
		return f"{self.user.alias} in {self.tournament.name}"
	
class LiveGames(models.Model):
	class Status(models.TextChoices):
		not_started = "Not Started"
		in_progress = "In Progress"
		paused = "Paused"
		completed = "Completed"

	gameUID = models.UUIDField(
		primary_key=True,
		default=uuid.uuid4,
		editable=False,
		unique=True
	)
	p1 = models.ForeignKey(
		TourneyParticipant,
		unique=True,
		related_name="match_p1",
		on_delete=models.CASCADE
	)
	p2 = models.ForeignKey(
		TourneyParticipant,
		unique=True,
		related_name="match_p2",
		on_delete=models.CASCADE
	)
	status = models.CharField(
		choices = Status.choices,
		default = Status.not_started
	)

	class Meta:
		indexes = [
            models.Index(fields=["p1"]),
            models.Index(fields=["p2"]),
			models.Index(fields=["status"])
        ]