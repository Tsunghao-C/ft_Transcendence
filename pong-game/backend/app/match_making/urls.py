from django.urls import path
from . import views

urlpatterns = [
	path("create-tournament/", views.CreateTournamentView.as_view(), name="create_tournament"),
	path("join-tournament/", views.JoinTournamentView.as_view(), name="join_tournament"),
	path("view-tournaments/", views.GetOpenTournamentsView.as_view(), name="open_tournaments"),
	path("current-tournament/", views.CurrentTournamentView.as_view(), name="current_tournament"),
	path("current-game/", views.CurrentGameView.as_view(), name="current_game"),
]
