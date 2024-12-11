from django.shortcuts import render, redirect
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.http import JsonResponse
from rest_framework.permissions import IsAuthenticated, AllowAny


class ChatRoomMessages(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, room_name):
		try:
			room = ChatRoom.objects.get(name=room_name)
			messages = room.messages.order_by('timestamp')
			serializer = MessageSerializer(messages, many=True)
			return Response(serializer.data, status=status.HTTP_200_OK)
		except ChatRoom.DoesNotExist:
			return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)

	def post(self, request, room_name):
		try:
			room = ChatRoom.objects.get(name=room_name)
			message = Message(
				room=room,
				sender=request.user,
				content=request.data.get("content")
			)
			message.save()
			return Response({"success": "Message sent"}, status=status.HTTP_201_CREATED)
		except ChatRoom.DoesNotExist:
			return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)

class CreateChatRoomView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		room_name = request.data.get("name")
		if not room_name:
			return Response({"error": "Room name is required"}, status=status.HTTP_400_BAD_REQUEST)

		if ChatRoom.objects.filter(name=room_name).exists():
			return Response({"error": "Room name already exists"}, status=status.HTTP_400_BAD_REQUEST)

		room = ChatRoom.objects.create(name=room_name, is_private=False)
		room.members.add(request.user)  # Optionnel : ajouter l'utilisateur qui a créé la salle comme membre
		return Response({"success": "Room created", "room_name": room.name}, status=status.HTTP_201_CREATED)

def index(request):
	return render(request, "chat/index.html")

def room(request, room_name):
	## temporary bypass log in, need to put it back later
	# if not request.user.is_authenticated:
	#     return redirect("/api/user/login/")
	return render(request, 'chat/chatroom.html', {
		'room_name': room_name
	})

def get_or_create_private_room(user1, user2):
	# Check if a private room exists between two users
	room_name = f"private_{min(user1.username, user2.username)}_{max(user1.username, user2.username)}"
	room, created = ChatRoom.objects.get_or_create(
		name=room_name,
		is_private=True
	)
	if created:
		room.members.add(user1, user2)
	return room

def start_private_chat(request, username):
	permission_classes = [IsAuthenticated]

	if not request.user.is_authenticated:
		return JsonResponse({'error': 'Authentication required'}, status=401)

	try:
		other_user = User.objects.get(username=username)
		room = get_or_create_private_room(request.user, other_user)
		return JsonResponse({'room_name': room.name})
	except User.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404)
