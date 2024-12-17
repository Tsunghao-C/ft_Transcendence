import math
from celery import shared_task
from django.utils import timezone
from .models import *

def getPlayersInRound(bracket: int, num_players: int):
	"""
	num_players: total number of participants in tournament
	bracket: which round in the tournament is it? (0 being the first tier of matches)
	"""
	# if n players are in the current round, n - int(n / 2) will be in the next
	return math.ceil(num_players / (2 ** bracket))

def match_players(player):
	bracket_players = TourneyParticipant.objects.filter(
		tournament=player.tournament,
		bracket=player.bracket,
		status="In Queue",
	)
	if not bracket_players.count() < 2:
		return
	paired_players = list(bracket_players)
	for i in range(0, len(paired_players), 2):
		if i + 1 > len(paired_players):
			return
		p1 = paired_players[i]
		p2 = paired_players[i + 1]

		if p1.status != "In Game" and p2.status != "In Game":
			try:
				with transaction.atomic():
					p1 = TourneyParticipant.objects.select_for_update.get(id=p1.id)
					p2 = TourneyParticipant.objects.select_for_update.get(id=p2.id)
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
				# replace this with a log
				print(f"Error: {e}")

def monitor_players():
	players = TourneyParticipant.objects.filter(
		status="In Queue",
		eliminated=False,
	)
	for player in players:
		tourney = player.tournament
		if player.bracket == tourney.num_brackets:
			tourney.end_tournament()
			continue
		num_in_bracket = getPlayersInRound(player.bracket, tourney.num_curr_players)
		# the first player to enter a bracket with odd players will skip the bracket
		if num_in_bracket % 2 and not tourney.has_bracket_been_skipped(player.bracket):
			try:
				tourney.increment_bracket_skip(player.bracket)
				player.bracket += 1
			except ValueError:
				pass # race condition, been skipped by someone else
		match_players(player)
		
			