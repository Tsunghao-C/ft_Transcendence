from django.urls import path
from . import views

urlpatterns = [
	path("create-tournament/", views.CreateTournamentView.as_view(), name="create_tournament"),
	path("join-tournament/", views.AddPlayerToTournamentView.as_view(), name="join_tournament"),
]
