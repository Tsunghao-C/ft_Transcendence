from django.db import models, transaction
from user_service.models import CustomUser
from chat.models import ChatRoom, Message
from django.db.models import F
from django.utils.timezone import now
from datetime import timedelta
from django.db.models import Q
import uuid
import os
import random


LDB_UPDATE_TIMER = int(os.environ.get("LDB_UPDATE_TIMER", 15))

class TournamentIsAI(models.TextChoices):
	HUMAN = 'human', 'Human'
	EASY = 'easy', 'Easy'
	MEDIUM = 'medium', 'Medium'
	HARD = 'hard', 'Hard'

class TournamentPlayer(models.Model):
	alias = models.CharField(max_length=255)
	is_ai =	models.CharField(
		max_length=10,
		choices=TournamentIsAI.choices,
		default=TournamentIsAI.HUMAN
	)
	score = models.IntegerField(default=0)

	def __str__(self):
		return f"{self.alias} ({'AI' if self.is_ai else 'Human'}) - Score: {self.score}"

class TournamentGameResult(models.TextChoices):
	WIN = 'win', 'Win'
	LOSE = 'lose', 'Lose'
	NOT_PLAYED = 'notPlayed', 'Not Played'

class Tournament(models.Model):
	user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="tournament")
	name = models.CharField(max_length=255)
	chat_room = models.OneToOneField(ChatRoom, on_delete=models.CASCADE, null=True, blank=True, related_name="tournament")

	def __str__(self):
		return f"Tournament: {self.name} - Owner: {self.user.username}"

	def create_first_bracket(self, players):
		shuffled_players = players[:]
		random.shuffle(shuffled_players)
		num_players = len(shuffled_players)
		next_power_of_two = 2 ** (num_players - 1).bit_length()
		num_to_advance = next_power_of_two - num_players

		first_bracket = Bracket.objects.create(tournament=self)

		for i, player in enumerate(shuffled_players):
			result = TournamentGameResult.WIN if i < num_to_advance else TournamentGameResult.NOT_PLAYED
			BracketPlayer.objects.create(
				bracket=first_bracket,
				player=player,
				result=result
			)

		chat_room = ChatRoom.get_or_create_tournament_chat_room(self.name, self.user)
		self.chat_room = chat_room
		self.save()
		next_match = self.get_next_match_or_create_bracket()
		Message.objects.create(
			room=self.chat_room,
			sender=self.user,
			is_tournament = True,
			content=f'{next_match["next_match"]["player1"]["alias"]}/{next_match["next_match"]["player2"]["alias"]}'
		)
		return first_bracket
	
	def get_next_match_or_create_bracket(self):
		last_bracket = self.brackets.all().order_by('-id').first()

		if last_bracket:
			not_played_players = list(last_bracket.bracket_players.filter(result=TournamentGameResult.NOT_PLAYED).order_by('id'))

			if len(not_played_players) >= 2:
				return {
					"next_match": {
						"player1": {
							"id": not_played_players[0].player.id,
							"alias": not_played_players[0].player.alias,
							"is_ai": not_played_players[0].player.is_ai,
						},
						"player2": {
							"id": not_played_players[1].player.id,
							"alias": not_played_players[1].player.alias,
							"is_ai": not_played_players[1].player.is_ai,
						},
					}
				}

			winners = last_bracket.bracket_players.filter(result=TournamentGameResult.WIN).select_related('player')

			if winners.count() > 1:
				with transaction.atomic():
					new_bracket = Bracket.objects.create(tournament=self)
					for winner in winners:
						BracketPlayer.objects.create(bracket=new_bracket, player=winner.player, result=TournamentGameResult.NOT_PLAYED)
				return self.get_next_match_or_create_bracket()

			if winners.count() == 1:
				return {
					"message": f"{winners[0].player.alias}"
				}

		return {"message": "The Tournament has no more matches or players to determine a winner."}


	def update_match_result(self, user1, user2, match_outcome):
		last_bracket = self.brackets.all().order_by('-id').first()
		if not last_bracket:
			raise ValueError("No brackets available in the tournament.")

		player1_entry = last_bracket.bracket_players.filter(player=user1).first()
		player2_entry = last_bracket.bracket_players.filter(player=user2).first()

		if not player1_entry or not player2_entry:
			raise ValueError("Both players must be part of the last bracket.")

		if match_outcome == 1:
			player1_entry.result = TournamentGameResult.WIN
			player2_entry.result = TournamentGameResult.LOSE
		elif match_outcome == 2:
			player1_entry.result = TournamentGameResult.LOSE
			player2_entry.result = TournamentGameResult.WIN
		else:
			raise ValueError("Invalid match_outcome. Use 1 for user1 win and 2 for user2 win.")

		player1_entry.save()
		player2_entry.save()
		next_match = self.get_next_match_or_create_bracket()
		if next_match.get("next_match"):
			Message.objects.create(
				room=self.chat_room,
				sender=self.user,
				is_tournament = True,
				content=f'{next_match["next_match"]["player1"]["alias"]}/{next_match["next_match"]["player2"]["alias"]}'
			)
		else :
			Message.objects.create(
				room=self.chat_room,
				sender=self.user,
				is_tournament = True,
				content=f'{next_match["message"]}'
			)




class Bracket(models.Model):
	tournament = models.ForeignKey(
		Tournament,
		on_delete=models.CASCADE,
		related_name='brackets'
	)

	def __str__(self):
		return f"Bracket in {self.tournament.name}"


class BracketPlayer(models.Model):
	bracket = models.ForeignKey(
		Bracket,
		on_delete=models.CASCADE,
		related_name='bracket_players'
	)
	player = models.ForeignKey(
		TournamentPlayer,
		on_delete=models.CASCADE,
		related_name='bracket_players'
	)
	result = models.CharField(
		max_length=10,
		choices=TournamentGameResult.choices,
		default=TournamentGameResult.NOT_PLAYED
	)

	def __str__(self):
		return f"{self.player.alias} in Bracket {self.bracket.id} - Result: {self.result}"


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
		players = CustomUser.objects.filter(is_admin=False).order_by('-mmr', '-winCount') # first by mmr and then by wins

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

