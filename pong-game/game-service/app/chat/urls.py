from django.urls import path, include
from . import views
from django.contrib.auth.views import LoginView, LogoutView
from .views import ChatRoomMessages, CreateChatRoomView
from .views import start_private_chat

urlpatterns = [
	path("rooms/<str:room_name>/messages/", ChatRoomMessages.as_view(), name="room_messages"),
	path("private/<str:username>/", start_private_chat, name="start_private_chat"),
	path("", views.index, name="index"),
	path("<str:room_name>/", views.room, name="room_test"),
	path('rooms/create/', CreateChatRoomView.as_view(), name="create_chat_room"),
]
