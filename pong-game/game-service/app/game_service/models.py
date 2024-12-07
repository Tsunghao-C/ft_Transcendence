from django.db import models, transaction
from user_service.models import CustomUser
from django.db.models import F
from django.utils.timezone import now
from datetime import timedelta

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

	matchoutcome = models.IntegerField(choices=[(0, 'Player 2 Wins'), (1, 'Player 1 Wins')])
	time = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.player1.alias} vs {self.player2.alias} - Outcome: {self.match_outcome}"

class LeaderBoardManager(models.Manager):
	def _hasGameOccured(self):
		try:
			latestMatch = MatchResults.objects.latest('time')
			return latestMatch.time >= now() - timedelta(minutes=30)
		except MatchResults.DoesNotExist:
			return False

	def updateLeaderBoard(self):
		if not self._hasGameOccured():
			return
		players = CustomUser.objects.order_by('-mmr', '-wins') # first by mmr and then by wins

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
		related_name="player_rank"
	)
	rank = models.PositiveIntegerField()

	objects = LeaderBoardManager()

	class Meta:
		ordering = ['rank']