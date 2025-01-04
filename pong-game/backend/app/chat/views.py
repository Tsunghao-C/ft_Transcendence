from django.shortcuts import render, redirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import ChatRoom, Message
from .serializers import MessageSerializer, ChatRoomSerializer
from user_service.models import CustomUser
from rest_framework.exceptions import PermissionDenied
from uuid import UUID
from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

class getChatRoomMessagesView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, room_name):
		try:
			room = ChatRoom.objects.get(name=room_name)
		except ChatRoom.DoesNotExist:
			return Response({"detail": "Room not found."}, status=status.HTTP_404_NOT_FOUND)
		if room.is_private and not room.members.filter(id=request.user.id).exists():
			raise PermissionDenied("You do not have access to this room's messages.")

		messages = room.messages.exclude(
			sender__in=request.user.blockList.all()
		).exclude(
			sender__blockList__id=request.user.id
		).order_by('timestamp')

		serializer = MessageSerializer(messages, many=True)
		return Response(serializer.data)

class getChatRoomsOfUserView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		chatrooms = ChatRoom.objects.filter(members=user)

		filtered_chatrooms = []
		for room in chatrooms:
			if room.is_tournament:
				filtered_chatrooms.append({
					"name": room.name,
					"is_private": True,
					"is_tournament":True,
					"other_member": None
				})
			if room.is_private:
				other_members = room.members.exclude(id=user.id)

				if any(not user.has_blocked(member) and not member.has_blocked(user) for member in other_members):
					other_member_name = other_members.first().alias if other_members.count() == 1 else None
					filtered_chatrooms.append({
						"name": room.name,
						"is_private": True,
						"is_tournament":False,
						"other_member": other_member_name
					})
			else:
				filtered_chatrooms.append({
					"name": room.name,
					"is_private": False,
					"is_tournament":False,
					"other_member": None
				})

		response_data = {
			"userAlias": user.alias,
			"rooms": filtered_chatrooms
		}

		return Response(response_data)

class CreatePublicChatRoomView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		name = request.data.get("name")

		if not name:
			return Response({"error": "Room name is required."}, status=status.HTTP_400_BAD_REQUEST)

		if ChatRoom.objects.filter(name=name).exists():
			return Response({"error": "A room with this name already exists."}, status=status.HTTP_400_BAD_REQUEST)

		room = ChatRoom.objects.create(name=name, is_private= False)

		# if is_private:
		# 	if not members_ids:
		# 		return Response({"error": "Members are required for a private room."}, status=status.HTTP_400_BAD_REQUEST)

		# 	try:
		# 		members = CustomUser.objects.filter(id__in=members_ids)
		# 		room.members.set(members)
		# 	except CustomUser.DoesNotExist:
		# 		return Response({"error": "One or more members do not exist."}, status=status.HTTP_400_BAD_REQUEST)

		# room.members.add(request.user)

		return Response({
			"message": "Chat room created successfully.",
			"room": {
				"name": room.name,
				"is_private": room.is_private,
				"members": [member.id for member in room.members.all()]
			}
		}, status=status.HTTP_201_CREATED)

class CreatePrivateChatRoomView(APIView):
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
			raise PermissionDenied("You cannot create a private room with yourself.")
		elif user.has_blocked(other_user):
			raise PermissionDenied("You are blocking this user")
		elif other_user.has_blocked(user):
			raise PermissionDenied("This user is blocking you")
		# Get or create the private room
		room = ChatRoom.get_or_create_private_room(user, other_user)
		return Response({
				"name": room.name,
				"is_private": room.is_private,
				"members": [member.alias for member in room.members.all()]
			})

class CreateInviteView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		other_alias = request.data.get("alias")
		room_name = request.data.get("roomName")
		game_room = request.data.get("roomId")

		try:
			game_room = UUID(game_room, version=4)
		except ValueError:
			return Response({"error": "Invalid gameId format."}, status=400)
		if other_alias:
			try:
				other_user = CustomUser.objects.get(alias=other_alias)
			except CustomUser.DoesNotExist:
				return Response({"error": "User not found."}, status=404)
			if user == other_user:
				raise PermissionDenied("You cannot invite yourself.")
			elif user.has_blocked(other_user):
				raise PermissionDenied("You are blocking this user.")
			elif other_user.has_blocked(user):
				raise PermissionDenied("This user is blocking you.")
			room = ChatRoom.get_or_create_private_room(user, other_user)
		else:
			room = get_object_or_404(ChatRoom, name=room_name)

		invite_message = Message.objects.create(
			room=room,
			sender=user,
			content=f"{user.alias} invited you to play",
			is_invite=True,
			game_room= game_room 
		)

		return Response({
			"message_id": invite_message.id,
			"content": invite_message.content,
			"timestamp": invite_message.timestamp,
			"is_invite": invite_message.is_invite
		}, status=201)

class DeleteInviteView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		chat_name = request.data.get("chat_name")
		game_room = request.data.get("room_id")

		room = ChatRoom.objects.get(name=chat_name) 

		if not game_room:
			return Response({"error": "inviteId is required."}, status=400)

		try:
			invite_message = Message.objects.get(room=room, game_room=game_room, is_invite=True)
		except Message.DoesNotExist:
			return Response({"error": "Invite not found."}, status=404)

		invite_message.delete()

		return Response({"message": "Invite deleted successfully."}, status=200)