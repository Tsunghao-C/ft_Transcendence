from django.urls import path
from . import views

urlpatterns = [
    ## ranking and leaderboard stuff
    path("matchHistory/", views.getMatchHistoryView.as_view(), name="match_history"),
    path("leaderboard/", views.getLeaderBoardView.as_view(), name="leaderboard"),
    ##tournamentStuff
    path("create-tournament/", views.CreateTournamentView.as_view(), name="create-tournament"),
    path("next-game/", views.NextGameTournamentView.as_view(), name="next-game"),
    path("update-match-result/", views.UpdateMatchResultView.as_view(), name="update-match-result"),
]
