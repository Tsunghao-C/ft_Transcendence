from django.db import models, transaction
from user_service.models import CustomUser
from django.db.models import F
from django.utils.timezone import now
from datetime import timedelta
from django.db.models import Q
import uuid
import os

LDB_UPDATE_TIMER = int(os.environ.get("LDB_UPDATE_TIMER", 15))

class MatchResults(models.Model):
	p1 = models.ForeignKey(
		CustomUser,
		on_delete=models.CASCADE,
		related_name="matches_as_p1"
	)

	p2 = models.ForeignKey(
		CustomUser,
		on_delete=models.CASCADE,
		related_name="matches_as_p2"
	)

	matchOutcome = models.IntegerField(choices=[(0, 'Player 2 Wins'), (1, 'Player 1 Wins')])
	time = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.p1.alias} vs {self.p2.alias} - Outcome: {self.matchOutcome}"

	class Meta:
		indexes = [
			models.Index(fields=["p1", "p2"])
		]

	@classmethod
	def getPlayerGames(cls, player):
		matches = cls.objects.filter(Q(p1=player) | Q(p2=player))

		return [
			{
				"p1": match.p1.alias,
				"p2": match.p2.alias,
				"matchOutcome": match.get_matchOutcome_display(),  # Friendly display of match outcome
				"time": match.time.isoformat(),
			}
			for match in matches
		]


class LeaderBoardManager(models.Manager):
	def _hasGameOccured(self):
		try:
			latestMatch = MatchResults.objects.latest('time')
			return latestMatch.time >= now() - timedelta(minutes=LDB_UPDATE_TIMER)
		except MatchResults.DoesNotExist:
			return False

	def updateLeaderBoard(self):
		if not self._hasGameOccured():
			return
		players = CustomUser.objects.order_by('-mmr', '-winCount') # first by mmr and then by wins

		with transaction.atomic(): # blocks all other write operations for db & if this code block fails, rewinds to before function call
			self.model.objects.all().delete()
			leaderboard_entries = [
				self.model(rank=rank, player=player)
				for rank, player in enumerate(players, start=1)
			]
			self.bulk_create(leaderboard_entries)

class LeaderBoard(models.Model):
	player = models.ForeignKey(
		CustomUser,
		on_delete=models.CASCADE,
		related_name="player_rank",
		db_index=True
	)
	rank = models.PositiveIntegerField()

	objects = LeaderBoardManager()

	class Meta:
		ordering = ['rank']

	@classmethod
	def getPlayerRank(cls, player):
		rank_obj = cls.objects.filter(player=player).first()
		return rank_obj.rank if rank_obj else None

#-------- Matchmaking ------------------

# We need to store this info in models, rather than in the consumer 
# in-case the user disconnects

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
	tourny_tier = models.PositiveIntegerField(default=0)

	class Meta:
		unique_together = ("tournament", "player")