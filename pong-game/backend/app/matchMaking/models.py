from django.db import models,transaction
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
	bracket_skips = models.JSONField(default=dict)
	is_private = models.BooleanField()

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

	def init_bracket_skips(self):
		self.bracket_skips = {i: 0 for i in range(6)}
		self.save()

	def increment_bracket_skip(self, bracket):
		if 0 <= bracket <= 5:
			with transaction.atomic():
				participant = TourneyParticipant.objects.select_for_update().get(id=self.id)
				if participant.bracket_skips.get(str(bracket)) == 0:
					participant.bracket_skips[str(bracket)] = 1
					participant.save()
				else:
					raise ValueError(f"Bracket {bracket} has already been skipped by another participant.")
		else:
			raise ValueError("Bracket number must be between 0 and 5.")
	
	def has_bracket_been_skipped(self, bracket):
		if 0 <= bracket <= 5:
			return self.bracket_skips.get(str(bracket)) == 1
		else:
			raise ValueError("Bracket number must be between 0 and 5.")


	def start_tournament(self):
		if self.is_active:
			print("Tournament already started, can't be started again") # replace this with error log
			return
		self.is_active = True;
		self.num_brackets = self.get_num_brackets()
		self.init_bracket_skips()
		self.save()
		self.refresh_from_db()

	def end_tournament(self):
		if not self.is_active:
			print(f"Tournament {self.name} has already ended")
			return
		# insert something here to redirect all the players to the chat
		print(f"Tournament {self.name} has been deleted.")
		self.delete()

	class Meta:
		ordering = ["-created_at"]
	

class TourneyParticipant(models.Model):
	class Status(models.TextChoices):
		in_game = "In Game"
		in_queue = "In Queue"

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
	status = models.CharField(
		choices = Status.choices,
		default = Status.in_queue,
	)

	class Meta:
		unique_together = ("user", "tournament")

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
		related_name="match_p1",
		on_delete=models.CASCADE
	)
	p2 = models.ForeignKey(
		TourneyParticipant,
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
		unique_together = (("p1", "gameUID"), ("p2", "gameUID"))