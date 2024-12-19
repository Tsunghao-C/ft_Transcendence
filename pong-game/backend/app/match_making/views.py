from django.shortcuts import render
from asgiref.sync import sync_to_async
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from django.core.paginator import Paginator
from asgiref.sync import sync_to_async
from .serializers import *
from chat.models import ChatRoom
from django.db.models import Q
import datetime
from .models import *

class CreateTournamentView(APIView):
	permission_classes = [IsAuthenticated]
	def post(self, request):
		serializer = CreateTournamentSerializer(data=request.data, admin=request.user)
		if not serializer.is_valid():
			return Response(serializer.errors, status=400)
		try:
			with transaction.atomic(): # if something fails, no objects are created
				tournament = serializer.save()
				participant = TourneyParticipant.objects.create(
					user=request.user,
					tournament=tournment,
				)
				chatroom = ChatRoom.create_tournament_room(tournament)
				chatroom.members.add(participant)
		except ValueError as e:
			return Response({"error":f"could not create tournament: {e}"}, status=400)
		return Response(TournamentSerializer(tournament).data, status=201)

class JoinTournamentView(APIView):
	permission_classes = [IsAuthenticated]
	def post(self, request):
		user = request.user
		data = request.data
		tourney_id = data.get("tournamentID")
		tournament = get_object_or_404(Tournament, id=tourney_id)
		if tournament.num_curr_players == tournament.max_players:
			return Response({"detail":"This tournament is currently full"}, status=409)
		if tournament.is_active == True:
			return Response({"detail":"This tournament has already started"}, status=409)
		try:
			with transaction.atomic():
				participant = TourneyParticipant.objects.create(
					user=user,
					tournament=tournament,
				)
				tournament.increment_players()
				room = ChatRoom.objects.filter(name=f"{tourney_id}").select_related("members").first()
				room.members.add(user)
				room.save()
		except Exception as e:
			return Response({"error":f"Could not add player to tournament: {e}"}, status=400)
		return Response(participant, status=200)

class StartTournamentView(APIView):
	permission_classes = [IsAuthenticated]
	def post(self, request):
		user = request.user
		tourney_id = request.data.get("tournamentID")
		tournament = get_object_or_404(Tournament, id=tourney_id)
		if tournament.is_active:
			return Response({"error":"You can only start tournaments that are not finished or currently active"}, status=400)
		if tournament.tournament_admin != user:
			return Response({"error":"only the tournament creator can start the tournament"}, status=400)
		try:
			tournament.start_tournament()
		except Exception as e:
			return Response({"error":f"could not start tournament: {e}"}, status=400)
		return Response({"detail":"tournament successfully started"}, status=200)

class GetOpenTournamentsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		# search_query = request.query_params.get("search","").strip()
		page = int(request.query_params.get("page", 1))
		tournaments = Tournament.objects.filter(is_private=False, is_active=False)
		if not tournaments:
			return Response({"detail":"no open tournaments exist."}, status=200)
		paginator = Paginator(tournaments, 5) # can change this to view more or fewer tourneys
		try:
			current_page = paginator.page(page)
		except Exception:
			raise Response({"error": "Invalid page number."}, status=400)
		TournamentData = [
			{
				"Tournament Name": tourney.name,
				"Tourney Owner": tourney.tournament_admin.alias,
				"Max Players": tourney.max_players,
				"Current Players": tourney.num_curr_players,
				"Created At": tourney.created_at
			} for tourney in tournaments
		]
		response_data = {
			"tournaments": TournamentData,
			"totalPages": paginator.num_pages,
		}
		return Response(response_data, status=200)

class CurrentTournamentView(APIView): 
	permission_classes = [IsAuthenticated]
	def get(self, request):
		user = request.user
		tourney_participant = TourneyParticipant.objects.filter(user=user).select_related('tournament').first()
		if not tourney_participant:
			return Response({"detail":"User is not in tournament"}, status=400)
		if not tourney_participant.tournament:
			return Response({"error":"Could not retrieve tournament data"}, status=400)
		serializer = TournamentSerializer(tourney_participant.tournament)
		return Response(serializer.data, status=201)

class CurrentGameView(APIView):
	permission_classes = [IsAuthenticated]
	def get(self, request):
		user = request.user
		participant = TourneyParticipant.objects.filter(user=user).first()
		if not participant:
			return Response({"detail":"This user is not in a tournament"}, status=400)
		game = LiveGames.objects.filter(Q(p1=participant) | Q(p2=participant)).select_related("gameUID").first()
		if not game:
			return Response({"detail":"This participant is not currently in a game"}, status=400)
		return Response(game.gameUID, status=201) # can change this later
