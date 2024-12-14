from django.shortcuts import render, redirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import ChatRoom, Message
from .serializers import MessageSerializer, ChatRoomSerializer
from user_service.models import CustomUser
from rest_framework.exceptions import PermissionDenied

def index(request):
    return render(request, "chat/index.html")

def room(request, room_name):
    # if not request.user.is_authenticated:
    #     return redirect("/api/user/login/")
    return render(request, "chat/chatroom.html", {"room_name": room_name})

def lobby(request):
    return render(request, "chat/lobby.html")

class ChatRoomMessages(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, room_name):
		try:
			room = ChatRoom.objects.get(name=room_name)
		except ChatRoom.DoesNotExist:
			return Response({"detail": "Room not found."}, status=status.HTTP_404_NOT_FOUND)
		if room.is_private and not room.members.filter(id=request.user.id).exists():
			raise PermissionDenied("You do not have access to this room's messages.")
		messages = room.messages.all().order_by('timestamp')
		serializer = MessageSerializer(messages, many=True)
		return Response(serializer.data)

class UserChatRoomsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		chatrooms = ChatRoom.objects.filter(members=user)
		serializer = ChatRoomSerializer(chatrooms, many=True)
		return Response(serializer.data)

class CreateChatRoom(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		name = request.data.get("name")
		is_private = request.data.get("is_private", False)
		members_ids = request.data.get("members", [])

		if not name:
			return Response({"error": "Room name is required."}, status=status.HTTP_400_BAD_REQUEST)

		if ChatRoom.objects.filter(name=name).exists():
			return Response({"error": "A room with this name already exists."}, status=status.HTTP_400_BAD_REQUEST)

		room = ChatRoom.objects.create(name=name, is_private=is_private)

		if is_private:
			if not members_ids:
				return Response({"error": "Members are required for a private room."}, status=status.HTTP_400_BAD_REQUEST)

			try:
				members = CustomUser.objects.filter(id__in=members_ids)
				room.members.set(members)
			except CustomUser.DoesNotExist:
				return Response({"error": "One or more members do not exist."}, status=status.HTTP_400_BAD_REQUEST)

		room.members.add(request.user)

		return Response({
			"message": "Chat room created successfully.",
			"room": {
				"id": room.id,
				"name": room.name,
				"is_private": room.is_private,
				"members": [member.id for member in room.members.all()]
			}
		}, status=status.HTTP_201_CREATED)

class CreatePrivateRoomView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		other_alias = request.data.get("alias")

		if not other_alias:
			return Response({"error": "alias is required."}, status=400)

		try:
			other_user = CustomUser.objects.get(alias=other_alias)
		except CustomUser.DoesNotExist:
			return Response({"error": "User not found."}, status=404)

		if user == other_user:
			return Response({"error": "You cannot create a private room with yourself."}, status=400)

		# Get or create the private room
		room = ChatRoom.get_or_create_private_room(user, other_user)
		return Response({
				"id": room.id,
				"name": room.name,
				"is_private": room.is_private,
				"members": [member.alias for member in room.members.all()]
			})
