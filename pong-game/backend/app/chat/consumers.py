import json
import jwt
from channels.generic.websocket import AsyncWebsocketConsumer

## Dedicated consumer for WS Health Check
class ChatHealthConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'health_test'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Health check successful'
        }))
        # await self.close()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'health_message',
                'message': 'Channel layer test successful'
            }
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def health_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'group_message',
            'message': event['message']
        }))

# Temparay testing on lobby.html, jsut to check WS is working
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from urllib.parse import parse_qs
from user_service.models import CustomUser
from django.db.models import Q
from datetime import datetime

class ChatConsumer(AsyncWebsocketConsumer):

	async def connect(self):
		self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
		self.room_group_name = f"chat_{self.room_name}"

		user = await self.authenticate_user()
		if user is None:
			await self.close()
			return

		self.user = user

		try:
			room = await database_sync_to_async(ChatRoom.objects.get)(name=self.room_name)
		except ChatRoom.DoesNotExist:
			print("chat room", self.room_name, "doesnt exist")
			await self.close()
			return

		if room.is_private and not await database_sync_to_async(room.members.filter(id=self.user.id).exists)():
			member_ids = await database_sync_to_async(list)(room.members.values_list('id', flat=True))
			print("id", self.user.id, "not in", member_ids)
			await self.close()
			return

		else:
			if not await database_sync_to_async(room.members.filter(id=self.user.id).exists)():
				await database_sync_to_async(room.members.add)(self.user)


		self.room = room

		await self.channel_layer.group_add(
		f"chat_{self.room.name}_{self.user.id}",
		self.channel_name
		)

		await self.accept()

	async def disconnect(self, close_code):

		await self.channel_layer.group_discard(
			f"chat_{self.room.name}_{self.user.id}",
			self.channel_name
		)

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json["message"]
		alias = text_data_json.get("alias", "anon")
		time = text_data_json.get("time", "unknown time")

		await self.save_message(message, alias)

		members = await database_sync_to_async(list)(self.room.members.all())
		print(f"Members in the room: {[member.alias for member in members]}")

		blocked_users = []
		for member in members:
			if await self.is_blocked_by_user(self.user, member):
				blocked_users.append(member)
				print(f"{member.alias} is blocked by {self.user.alias}")

		for member in members:
			if member not in blocked_users:
				print(f"Sending message to {member.alias}")
				await self.channel_layer.group_send(
					f"chat_{self.room.name}_{member.id}",
					{
						"type": "chat.message",
						"message": message,
						"alias": alias,
						"time": time,
					}
				)
			else:
				print(f"Not sending message to {member.alias} because they are blocked.")

	@database_sync_to_async
	def save_message(self, message, alias):
		user = CustomUser.objects.get(alias=alias)
		Message.objects.create(
			room=self.room,
			sender=user,
			content=message
		)

	async def chat_message(self, event):
		message = event["message"]
		alias = event["alias"]
		time = event["time"]

		await self.send(text_data=json.dumps({
			"message": message,
			"alias": alias,
			"time": time,
		}))

	def get_chat_room(self, room_name):
		try:
			return ChatRoom.objects.get(name=room_name)
		except ChatRoom.DoesNotExist:
			return None

	async def authenticate_user(self):
		query_string = self.scope["query_string"].decode("utf-8")
		query_params = parse_qs(query_string)

		token = query_params.get("token", [None])[0]
		if not token:
			return None

		try:
			payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
			user = await self.get_user_from_payload(payload)
			return user
		except jwt.ExpiredSignatureError:
			print("JWT token has expired.")
			return None
		except jwt.InvalidTokenError:
			print("Invalid JWT token.")
			return None

	@database_sync_to_async
	def get_user_from_payload(self, payload):
		user_id = payload.get('user_id')
		if user_id:
			try:
				return CustomUser.objects.get(id=user_id)
			except CustomUser.DoesNotExist:
				return None
		return None

	@sync_to_async
	def is_blocked_by_user(self, user1, user2):
		result = user1.has_blocked(user2) or user2.has_blocked(user1)
		print(f"Is {user1.alias} blocked by {user2.alias}: {result}")
		return result




