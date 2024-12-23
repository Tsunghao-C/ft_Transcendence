from django.urls import path
from . import views

urlpatterns = [
	path("create-tournament/", views.CreateTournamentView.as_view(), name="create_tournament"),
	path("join-tournament/", views.AddPlayerToTournamentView.as_view(), name="join_tournament"),
	path("view-tournaments/", views.GetOpenTournamentsView.as_view(), name="open_tournaments"),
	path("join-queue/",views.JoinQueueView.as_view(), name="join_queue"),
]
