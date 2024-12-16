from django.db import models
from user_service import models

# # Delete each user after each game
# class LiveGames(models.Model):
# 	class Status(models.TextChoices):
# 		not_started = "Not Started"
# 		in_progress = "In Progress"
# 		paused = "Paused"
# 		completed = "Completed"

# 	gameUID = models.UUIDField(
# 		primary_key=True,
# 		default=uuid.uuid4,
# 		editable=False,
# 		unique=True
# 	)
# 	p1 = models.ForeignKey(
# 		CustomUser,
# 		unique=True,
# 		related_name="match_p1",
# 		on_delete=models.CASCADE
# 	)
# 	p2 = models.ForeignKey(
# 		CustomUser,
# 		unique=True,
# 		related_name="match_p2",
# 		on_delete=models.CASCADE
# 	)
# 	status = models.CharField(
# 		choices = Status.choices,
# 		default = Status.not_started
# 	)

# 	class Meta:
# 		indexes = [
#             models.Index(fields=["p1"]),
#             models.Index(fields=["p2"]),
# 			models.Index(fields=["status"])
#         ]

class Tournament(models.Model):
	id = models.UUIDField(
		primary_key=True,
		default=uuid.uuid4,
		editable=False
	)
	name = models.CharField(max_length=100)
	start_time = models.DateTimeField(null=True, blank=True)
	is_active = models.BooleanField(default=True)

	def __str__(self):
		return self.name

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