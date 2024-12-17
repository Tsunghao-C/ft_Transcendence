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
import datetime
from .models import *

class CreateTournamentView(APIView):
	permission_classes = [IsAuthenticated]
	def post(self, request):
		serializer = CreateTournamentSerializer(data=request.data)
		if not serializer.is_valid():
			return Response(serializer.errors, status=400)
		tournament = serializer.save()
		return Response(TournamentSerializer(tournament).data, status=201)

class AddPlayerToTournamentView(APIView):
	permission_classes = [IsAuthenticated]
	def post(self, request):
		user = request.user
		data = request.data
		tourney_id = data.get("tournamentID")
		tournament = get_object_or_404(Tournament, id=tourney_id)
		if tournament.num_curr_players == tournament.max_players:
			return Response({"detail":"This tournament is currently full"}, status=409)
		try:
			participant = TourneyParticipant.objects.create(
				user=user,
				tournament=tournament,
			)
			tournament.increment_players()
		except Exception as e:
			return Response({"error":f"Could not create participant object: {e}"}, status=400)
		return Response(participant, status=200)
	
class StartTournamentView(APIView):
	permission_classes = [IsAuthenticated]
	def post(self, request):
		user = request.user
		tourney_id = request.data.get("tournamentID")
		tournament = get_object_or_404(Tournament, id=tourney_id)
		if tournament.is_active or tournament.is_finished:
			return Response({"error":"You can only start tournaments that are not finished or currently active"}, status=400)
		if tournament.tournament_admin != user:
			return Response({"error":"only the tournament creator can start the tournament"}, status=400)
		tournament.start_tournament()
		return Response({"detail":"tournament successfully started"}, status=200)

class GetOpenTournamentsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		# search_query = request.query_params.get("search","").strip()
		page = int(request.query_params.get("page", 1))
		tournaments = Tournament.objects.filter(is_private=False, is_active=False, is_finished=False)
		if not tournaments:
			return Response({"detail":"no open tournaments exist."}, status=200)
		paginator = Paginator(tournaments, 5) # can change this to view more or fewer tourneys
		try:
			current_page = paginator.page(page)
		except Exception:
			raise ValidationError({"detail": "Invalid page number."})
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