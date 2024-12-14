from django.urls import path
from . import views

urlpatterns = [
    # path("", views.game_home, name="access_home"),
    # path('privateMatch.js', views.serve_js, {'file_path': 'privateMatch.js'}),
    # path('joinMatch.js', views.serve_js, {'file_path': 'joinMatch.js'}),
    path('test/', views.game_test, name='game_test'),
    path('room/', views.get_game, name='game'),
    ## ranking and leaderboard stuff
    path("matchHistory/", views.getMatchHistoryView.as_view(), name="match_history"),
    path("leaderboard/", views.getLeaderBoardView.as_view(), name="leaderboard"),
]
