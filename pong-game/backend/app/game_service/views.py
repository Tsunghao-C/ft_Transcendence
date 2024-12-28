from django.shortcuts import render
from django.http import JsonResponse
from django.http import HttpResponse
from django.conf import settings
import os
import json
from django.utils.safestring import mark_safe
from .models import MatchResults, LeaderBoard
from user_service.models import CustomUser
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import LeaderBoardSerializer, matchResultsSerializer, TournamentSerializer
from datetime import datetime
from django.core.paginator import Paginator
from rest_framework.exceptions import ValidationError
from .models import Tournament, TournamentPlayer, Bracket, TournamentPlayer
from django.views import View
from django.shortcuts import render, get_object_or_404
from rest_framework import status

## Game testing render views
def game_test(request):
	return render(request, 'game_service/game_test.html', {
	})

#Game Alpha view
def get_game(request):
	return render(request, 'game_service/game.html', {
		})

#solo mode for the game
def get_solo_game(request):
	return render(request, 'game_service/solo_game.html', {
            })

def game_test_ssr(request):
	# Initial game state that will be pre-rendered
	initial_state = {
		'status': 'waiting',
		'ball': {
			'x': 400,
			'y': 300,
			'radius': 10
		},
		'paddles': {
			'p1': {
				'y': 250,
				'x': 50,
				'height': 100,
				'width': 10
			},
			'p2': {
				'y': 250,
				'x': 740,
				'height': 100,
				'width': 10
			}
		},
		'score': {
			'p1': 0,
			'p2': 0
		}
	}
	context = {
		'initial_state': initial_state,
		'initial_state_json': mark_safe(json.dumps(initial_state)),
		'game_id': 'test_game_ssr'
	}
	return render(request, 'game_service/game_test_ssr.html', context)

## Ranknig dashboard view.

def recordMatch(p1, p2, matchOutcome):
	match = MatchResults.objects.create(
		p1=p1,
		p2=p2,
		matchOutcome=matchOutcome
	)
	return match

class getMatchHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        matches = MatchResults.objects.all()
        if not matches.exists():
            return Response({"detail":"no match record."}, status=200)
        serializer = matchResultsSerializer(matches, many=True)
        return Response(serializer.data, status=200)


class getLeaderBoardView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		search_query = request.query_params.get("search", "").strip()
		page = int(request.query_params.get("page", 1))

		leaderboard = LeaderBoard.objects.all()
		if search_query:
			leaderboard = leaderboard.filter(player__alias__icontains=search_query)

		if not leaderboard.exists():
			return Response({"detail": "no leaderboard exists."}, status=200)
		paginator = Paginator(leaderboard, 10)
		try:
			current_page = paginator.page(page)
		except Exception:
			raise ValidationError({"detail": "Invalid page number."})

		leaderboardData = [
			{
				"rank": gamer.rank,
				"alias": gamer.player.alias,
				"mmr": gamer.player.mmr,
				"avatar": gamer.player.avatar.url,
				"wins": gamer.player.winCount,
			}
			for gamer in current_page
		]

		response_data = {
			"leaderboard": leaderboardData,
			"totalPages": paginator.num_pages,
		}

		return Response(response_data, status=200)

class CreateTournamentView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		tournament = get_object_or_404(Tournament, user=user)

		serialized_tournament = TournamentSerializer(tournament)
		return Response(serialized_tournament.data, status=200)


	def post(self, request):
		try:
			data = json.loads(request.body)
			user = request.user
			tournament_name = data.get("name", "Untitled Tournament")
			players_data = data.get("players", [])

			if len(players_data) < 2:
				return Response({"error": "At least 2 players are required."}, status=400)

			existing_tournament = Tournament.objects.filter(user=user).first()
			if existing_tournament:
				existing_tournament.delete()

			tournament = Tournament.objects.create(user=user, name=tournament_name)

			players = [
				TournamentPlayer.objects.create(
					alias=player_data["alias"],
					is_ai=player_data["is_ai"],
				)
				for player_data in players_data
			]

			tournament.create_first_bracket(players)

			serialized_tournament = TournamentSerializer(tournament)
			return Response(serialized_tournament.data, status=201)

		except Exception as e:
			return Response({"error": str(e)}, status=500)

class NextGameTournamentView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		tournament = get_object_or_404(Tournament, user=user)

		serialized_tournament = TournamentSerializer(tournament)
		next_game = tournament.get_next_match_or_create_bracket()
		response_data = {
			"tournament": serialized_tournament.data,
			"next_game": next_game,
		}
		return Response(response_data, status=200)

class UpdateMatchResultView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		tournament = get_object_or_404(Tournament, user=request.user)

		user1_id = request.data.get("user1_id")
		user2_id = request.data.get("user2_id")
		match_outcome = request.data.get("match_outcome")

		if not all([user1_id, user2_id, match_outcome]):
			return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

		try:
			user1 = get_object_or_404(TournamentPlayer, id=user1_id)
			user2 = get_object_or_404(TournamentPlayer, id=user2_id)

			tournament.update_match_result(user1, user2, int(match_outcome))

			return Response({"message": "Match result updated successfully."}, status=status.HTTP_200_OK)
		except ValueError as e:
			return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
		except Exception as e:
			return Response({"error": str(e)}, status=500)