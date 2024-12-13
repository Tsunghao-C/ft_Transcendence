# import json
# import jwt
# from channels.generic.websocket import AsyncWebsocketConsumer
# from django.conf import settings
# from django.contrib.auth import get_user_model
# from .models import ChatRoom, Message
# from channels.db import database_sync_to_async
# from urllib.parse import parse_qs
# from user_service.models import CustomUser
# from django.db.models import Q
# from datetime import datetime

# class ChatConsumer(AsyncWebsocketConsumer):

# async def connect(self):
# 	self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
# 	self.room_group_name = f"chat_{self.room_name}"

# 	user = await self.authenticate_user()
# 	if user is None:
# 		await self.close()
# 		return

# 	self.user = user

# 	try:
# 		room = await database_sync_to_async(ChatRoom.objects.get)(name=self.room_name)
# 	except ChatRoom.DoesNotExist:
# 		print("The room", self.room_name, "does not exist")
# 		await self.close()
# 		return

# 	if room.is_private and not room.members.filter(id=self.user.id).exists():
# 		print("You don't have access to the room")
# 		await self.close()
# 		return

# 	self.room = room

# 	await self.channel_layer.group_add(
# 		self.room_group_name,
# 		self.channel_name
# 	)
# 	await self.accept()

# 	join_message = f"{self.user.username} has joined the live chat in {self.room.name}."
# 	await self.channel_layer.group_send(
# 		self.room_group_name,
# 		{
# 			"type": "chat.message",
# 			"message": join_message,
# 			"alias": "System",
# 			"time": datetime.now().strftime("%H:%M:%S"),
# 		}
# 	)

# async def disconnect(self, close_code):
# 	await self.channel_layer.group_discard(
# 		self.room_group_name,
# 		self.channel_name
# 	)

# async def receive(self, text_data):
# 	text_data_json = json.loads(text_data)
# 	message = text_data_json["message"]
# 	username = text_data_json.get("username", "anon")
# 	time = text_data_json.get("time", "unknown time")

# 	await self.save_message(message, username)

# 	await self.channel_layer.group_send(
# 		self.room_group_name, {
# 			"type": "chat.message",
# 			"message": message,
# 			"alias": self.user.alias,  # Sending alias for display, but backend uses username
# 			"time": time,
# 		}
# 	)

# @database_sync_to_async
# def save_message(self, message, username):  # Changed alias to username
# 	user = CustomUser.objects.get(username=username)  # Retrieve user by username
# 	Message.objects.create(
# 		room=self.room,
# 		sender=user,
# 		content=message
# 	)

# async def chat_message(self, event):
# 	message = event["message"]
# 	alias = event["alias"]
# 	time = event["time"]

# 	await self.send(text_data=json.dumps({
# 		"message": message,
# 		"alias": alias,
# 		"time": time,
# 	}))

# def get_chat_room(self, room_name):
# 	try:
# 		return ChatRoom.objects.get(name=room_name)
# 	except ChatRoom.DoesNotExist:
# 		return None

# async def authenticate_user(self):
# 	query_string = self.scope["query_string"].decode("utf-8")
# 	query_params = parse_qs(query_string)

# 	token = query_params.get("token", [None])[0]
# 	if not token:
# 		return None

# 	try:
# 		payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
# 		user = await self.get_user_from_payload(payload)
# 		return user
# 	except jwt.ExpiredSignatureError:
# 		print("JWT token has expired.")
# 		return None
# 	except jwt.InvalidTokenError:
# 		print("Invalid JWT token.")
# 		return None

# @database_sync_to_async
# def get_user_from_payload(self, payload):
# 	user_id = payload.get('user_id')
# 	if user_id:
# 		try:
# 			return CustomUser.objects.get(id=user_id)
# 		except CustomUser.DoesNotExist:
# 			return None
# 	return None

import json
import jwt
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message
from channels.db import database_sync_to_async
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


		self.room = room

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)
		await self.accept()

		join_message = f"{self.user.username} has joined the live chat in {self.room.name}."
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				"type": "chat.message",
				"message": join_message,
				"alias": "System",
				"time": datetime.now().strftime("%H:%M:%S"),
			}
		)

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json["message"]
		alias = text_data_json.get("alias", "anon")
		time = text_data_json.get("time", "unknown time")

		await self.save_message(message, alias)

		await self.channel_layer.group_send(
			self.room_group_name, {
				"type": "chat.message",
				"message": message,
				"alias": alias,
				"time": time,
			}
		)

	@database_sync_to_async
	def save_message(self, message, alias):
		user = CustomUser.objects.get(username=alias)
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


