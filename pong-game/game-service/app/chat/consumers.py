import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import ChatRoom, Message

# You need to run this when using dev server: docker run --rm -p 6379:6379 redis:7
class ChatConsumer(AsyncWebsocketConsumer):
async def connect(self):
	self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
	self.room_group_name = f"chat_{self.room_name}"
	print(f"Attempting connection to room: {self.room_name}")
	room = await database_sync_to_async(ChatRoom.objects.get)(name=self.room_name)
	members = await database_sync_to_async(lambda: list(room.members.all()))()
	if room.is_private and self.scope["user"] not in members:
		await self.close()
		return

	await self.channel_layer.group_add(
		self.room_group_name,
		self.channel_name
	)
	await self.accept()

	async def disconnect(self, close_code):
		# leave room group
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)

	# receive message from WebSocket
	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json["message"]
		alias = text_data_json.get("alias", self.scope["user"].username)

		# Sauvegarder le message dans la base de données
		room = await database_sync_to_async(ChatRoom.objects.get)(name=self.room_name)
		sender = self.scope["user"]
		await database_sync_to_async(Message.objects.create)(
			room=room,
			sender=sender,
			content=message
		)

		await self.channel_layer.group_send(
			self.room_group_name, {
				"type": "chat.message",
				"message": message,
				"alias": alias,
			}
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
