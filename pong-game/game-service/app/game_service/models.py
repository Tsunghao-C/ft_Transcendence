from django.db import models
from user_service.models import CustomUser

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

class LeaderBoard(models.Model):
	player = models.ForeignKey(
		CustomUser,
		on_delete=models.CASCADE,
		related_name="player_rank"
	)
	class Meta:
		ordering = []

	@property
	def mmr(self):
		return self.player.mmr
	
	@property
	def wins(self):
		return self.player.winCount

	@property
	def losses(self):
		return self.player.lossCount