from django.urls import path, include
# from . import views
from django.contrib.auth.views import LoginView, LogoutView
from .views import ChatRoomMessages, CreateChatRoom, CreatePrivateRoomView


urlpatterns = [
	# path("", views.lobby),
	# path("index/", views.index, name="index"),
	# path("<str:room_name>/", views.room, name="room"),
	path('rooms/<str:room_name>/messages/', ChatRoomMessages.as_view(), name='chat_room_messages'),
	path('rooms/create/', CreateChatRoom.as_view(), name='create_chat_room'),
	path('rooms/create-private/', CreatePrivateRoomView.as_view(), name='create_private_chat_room'),
]

