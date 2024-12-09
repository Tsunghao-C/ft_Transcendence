from django.urls import path
from . import views

urlpatterns = [
    # WS testing path
    path('test/<str:game_id>/', views.game_test, name='game_test'),
    path("matchHistory/", views.getMatchHistoryView.as_view(), name="match_history"),
    path("leaderboard/", views.getLeaderBoardView.as_view(), name="leaderboard"),
]