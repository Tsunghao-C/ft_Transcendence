from django.db import models,transaction
from user_service.models import CustomUser
from django.db.models import F, Q
import math, uuid, logging

logger = logging.getLogger(__name__)

class TournamentManager:
	@staticmethod
	def get_players_in_round(bracket: int, num_players: int) -> int:
		return math.ceil(num_players / (2 ** bracket))

	@classmethod
	def process_tournament_players(cls):
		players = TourneyParticipant.objects.filter(
			status="In Queue",
			eliminated=False
		).select_related('tournament')
		
		players_to_update = []
		
		for player in players:
			try:
				updated_player = cls._process_individual_player(player)
				if updated_player:
					players_to_update.append(updated_player)
			except Exception as e:
				logger.error(f"Error processing player {player.id}: {e}")
		
		# Bulk update players if there are changes
		if players_to_update:
			TourneyParticipant.objects.bulk_update(
				players_to_update, 
				['status', 'bracket']
			)

	@classmethod
	def _process_individual_player(cls, player):
		tourney = player.tournament
		if player.bracket == tourney.num_brackets:
			tourney.end_tournament()
			return None
		num_in_bracket = cls.get_players_in_round(
			player.bracket, 
			tourney.num_curr_players
		)
		if num_in_bracket % 2 and not tourney.has_bracket_been_skipped(player.bracket):
			player = cls._handle_bracket_skip(player, tourney)
		cls._match_players(player)
		return player

	@classmethod
	def _handle_bracket_skip(cls, player, tourney):
		try:
			with transaction.atomic():
				tourney.increment_bracket_skip(player.bracket)
				player.bracket += 1
				player.save()
		except ValueError:
			logger.warning(f"Bracket skip race condition for player {player.id}")
		return player

	@classmethod
	def _match_players(cls, player):
		bracket_players = TourneyParticipant.objects.filter(
			tournament=player.tournament,
			bracket=player.bracket,
			status="In Queue"
		)
		if bracket_players.count() < 2:
			return
		paired_players = list(bracket_players)
		for i in range(0, len(paired_players), 2):
			if i + 1 >= len(paired_players):
				break
			p1 = paired_players[i]
			p2 = paired_players[i + 1]
			if p1.status != "In Game" and p2.status != "In Game":
				cls._create_live_game(p1, p2)

	@classmethod
	def _create_live_game(cls, p1, p2):
		try:
			with transaction.atomic():
				p1 = TourneyParticipant.objects.select_for_update().get(id=p1.id)
				p2 = TourneyParticipant.objects.select_for_update().get(id=p2.id)
				game = LiveGames.objects.create(
					p1=p1,
					p2=p2,
					status=LiveGames.Status.not_started
				)
				p1.status = "In Game"
				p2.status = "In Game"
				p1.save()
				p2.save()
				p1.refresh_from_db()
				p2.refresh_from_db()
		except Exception as e:
			logger.error(f"Error creating live game: {e}")

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
	max_players = models.PositiveSmallIntegerField()
	num_curr_players = models.PositiveSmallIntegerField(default=0)
	num_brackets = models.PositiveSmallIntegerField(default=0)
	bracket_skips = models.JSONField(default=dict)
	is_private = models.BooleanField()

	objects = TournamentManager()

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
			raise Exception("Tournament already started, can't be started again")
		players = TourneyParticipant.objects.filter(tournament=self)
		if players.count() < 2:
			raise Exception("At least 2 players needed to start tournament")
		self.is_active = True;
		self.num_brackets = self.get_num_brackets()
		self.init_bracket_skips()
		self.save()
		for player in players:
			player.status = "In Queue"
			player.save()
		self.refresh_from_db()

	def end_tournament(self):
		# insert something here to redirect all the players to the chat
		logger.info(f"Tournament {self.name} has been deleted.")
		self.delete()

	class Meta:
		ordering = ["-created_at"]
	

class TourneyParticipant(models.Model):
	class Status(models.TextChoices):
		in_game = "In Game"
		in_queue = "In Queue"
		in_lobby = "In Lobby"

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
		default = Status.in_lobby,
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