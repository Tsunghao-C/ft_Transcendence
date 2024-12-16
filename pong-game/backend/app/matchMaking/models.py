from django.db import models
from user_service import models

# Delete each user after each game
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
		CustomUser,
		unique=True,
		related_name="match_p1",
		on_delete=models.CASCADE
	)
	p2 = models.ForeignKey(
		CustomUser,
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

class Tournament(models.Model):
	id = models.UUIDField(
		primary_key=True,
		default=uuid.uuid4,
		editable=False
	)
	name = models.CharField(max_length=100)
	start_time = models.DateTimeField(null=True, blank=True)

# delete this after each tournament finishes
class TourneyGameQueue(models.Model):
	tournament = models.ForeignKey(
		Tournament,
		on_delete=models.CASCADE,
		related_name="players"
	)
	player = models.ForeignKey(
		CustomUser,
		on_delete=models.CASCADE,
		db_index=True
	)
	eliminated = models.BooleanField(default=False)
	tourny_bracket = models.PositiveIntegerField(default=0)

	class Meta:
		unique_together = ("tournament", "player")