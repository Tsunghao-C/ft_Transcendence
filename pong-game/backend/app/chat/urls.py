from django.urls import path, include
from . import views
from django.contrib.auth.views import LoginView, LogoutView
from .views import getChatRoomMessagesView, CreatePublicChatRoomView, CreatePrivateChatRoomView, getChatRoomsOfUserView


urlpatterns = [
	path("test/", views.chat_test),
	path("index/", views.index, name="index"),
	path('<str:room_name>/messages/', getChatRoomMessagesView.as_view(), name='chat_room_messages'),
	path('create/', CreatePublicChatRoomView.as_view(), name='create_chat_room'),
	path('create-private/', CreatePrivateChatRoomView.as_view(), name='create_private_chat_room'),
	path('user_chatrooms/', getChatRoomsOfUserView.as_view(), name='user_chatrooms'),
	path("<str:room_name>/", views.room, name="room"),
]

