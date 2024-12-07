from django.apps import AppConfig
from .models import LeaderBoard
from user_service.models import CustomUser

class GameServiceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'game_service'