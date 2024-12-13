from django.shortcuts import render, redirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import ChatRoom, Message
from .serializers import MessageSerializer
from user_service.models import CustomUser

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

		messages = room.messages.all().order_by('timestamp')
		serializer = MessageSerializer(messages, many=True)
		return Response(serializer.data)

	def post(self, request, room_name):
		try:
			room = ChatRoom.objects.get(name=room_name)
		except ChatRoom.DoesNotExist:
			return Response({"detail": "Room not found."}, status=status.HTTP_404_NOT_FOUND)

		if request.user not in room.members.all():
			return Response({"detail": "You are not a member of this room."}, status=status.HTTP_403_FORBIDDEN)

		message = request.data.get("message", "")
		if message == "":
			return Response({"detail": "Message content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

		new_message = Message.objects.create(
			room=room,
			sender=request.user,
			content=message,
		)

		serializer = MessageSerializer(new_message)
		return Response(serializer.data, status=status.HTTP_201_CREATED)

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
		other_username = request.data.get("username")

		if not other_username:
			return Response({"error": "Username is required."}, status=400)

		try:
			other_user = CustomUser.objects.get(username=other_username)
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
