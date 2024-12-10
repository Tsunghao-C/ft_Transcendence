from django.shortcuts import render
from .models import MatchResults
from user_service.models import CustomUser
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# Create your views here.
def recordMatch(p1, p2, matchOutcome):
    match = MatchResults.objects.create(
        p1=p1,
        p2=p2,
        matchOutcome=matchOutcome
    )
    return match

def game_test(request, game_id):
    return render(request, 'game_service/game_test.html', {
        'game_id': game_id
    })

class getMatchHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        matches = MatchResults.objects.all()
        if not matches.exists():
            return Response({"detail":"no match record."}, status=200)
        matchData = [
            {
                "p1Alias": match.p1.alias,
                "p2Alias": match.p2.alias,
                "outcome": match.matchOutcome
            }
            for match in matches
        ]
        return Response({
            "count": matches.count(),
            "matchData": matchData
        }, status=200)