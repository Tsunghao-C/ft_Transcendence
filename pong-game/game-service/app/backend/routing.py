from django.urls import re_path
from chat.consumers import ChatConsumer
from game_service.consumers import GameConsumer

chat_urlpatterns = [
        re_path(r"ws/chat/(?P<room_name>\w+)/$", ChatConsumer.as_asgi()),
        ]

game_urlpatterns = [
        re_path(r'ws/game/(?P<room_name>\w+)/$', GameConsumer.as_asgi()),
        ]

websocket_urlpatterns = chat_urlpatterns + game_urlpatterns
