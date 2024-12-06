from django.apps import AppConfig
from .models import LeaderBoard
from user_service.models import CustomUser
from django.db.models import F
from django.utils.timezone import now

class GameServiceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'game_service'

def updateLeaderBoard():
    players = CustomUser.objects.annotate(
        mmr=F('mmr'),
        wins=F('winCount'),
    ).order_by('-mmr', '-wins') # first by mmr and then by wins

    LeaderBoard.objects.all().delete() # delete old entries

    for rank, player in enumerate(players, start=1):
        LeaderBoard.objects.create(
            rank=rank,
            player=player,
        )
    return now()