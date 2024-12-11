from django.shortcuts import render
from django.http import JsonResponse
from django.http import HttpResponse
from django.conf import settings
import os

from .models import MatchResults, LeaderBoard
from user_service.models import CustomUser
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import LeaderBoardSerializer, matchResultsSerializer
from datetime import datetime

## Jeans old stuff

# def serve_js(request, filename):
#     filepath = os.path.join(settings.BASE_DIR, 'game_service/templates', filename)
#     if os.path.exists(filepath):
#         with open(filepath, 'r') as file:
#             content = file.read()
#         return HttpResponse(content, content_type="application/javascript")
#     else:
#         return HttpResponse(status=404)

# def game_home(request):
#     """
#     Render a landing page for the game (optional).
#     """
#     print("Game_home called")
#     return render(request, "home.html")


# def api_status(request):
#     """
#     Simple endpoint to verify the API is running.
#     """
#     return JsonResponse({"success": True, "message": "Game API is active"})



# # Create your views here.
# def game_test(request, game_id):
#     return render(request, 'game_service/game_test.html', {
#         'game_id': game_id
#     })

## Game testing render views

def game_test(request):
    return render(request, 'game_service/game_test.html', {
    })

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

    # def get(self, request):
    #     matches = MatchResults.objects.all()
    #     if not matches.exists():
    #         return Response({"detail":"no match record."}, status=200)
    #     matchData = [
    #         {
    #             "p1Alias": match.p1.alias,
    #             "p2Alias": match.p2.alias,
    #             "outcome": match.matchOutcome,
    #             "time": match.time
    #         }
    #         for match in matches
    #     ]
    #     return Response({
    #         "count": matches.count(),
    #         "matchData": matchData
    #     }, status=200)
    def get(self, request):
        matches = MatchResults.objects.all()
        if not matches.exists():
            return Response({"detail":"no match record."}, status=200)
        serializer = matchResultsSerializer(matches, many=True)
        return Response(serializer.data, status=200)


class getLeaderBoardView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		leaderboard = LeaderBoard.objects.all()
		if not leaderboard.exists():
			return Response({"detail":"no leaderboard exists."}, status=200)
		leaderboardData = [
			{
				"rank": gamer.rank,
				"alias": gamer.player.alias,
				"mmr": gamer.player.mmr,
				"avatar": gamer.player.avatar.url,
				"wins": gamer.player.winCount,
			}
			for gamer in leaderboard
		]
		serializer = LeaderBoardSerializer(leaderboard, many=True)
		return Response(leaderboardData, status=200)