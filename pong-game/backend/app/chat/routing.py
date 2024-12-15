from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
	re_path(r"^ws/chat-server/(?P<room_name>\w+)/$", consumers.ChatConsumer.as_asgi()),
    re_path(r"^ws/health/chat/$", consumers.ChatHealthConsumer.as_asgi()), # Health check endpoint
]
