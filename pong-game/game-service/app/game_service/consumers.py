import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.sessions import SessionMiddlewareStack

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.player_id = self.scope['session'].session_key
        await self.accept()
        await self.send(json.dumps({"message": "Connection established"}))

    async def disconnect(self, close_code):
        if hasattr(self, 'current_group'):
            await self.channel_layer.group

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")

        if action == "join_private_match":
            await self.join_lobby(data["room_name"])
        elif action == "ready_up":
            await self.notify_ready(data["room_name"])
    
    async def join_lobby(self, room_name):
        self.current_group = f"lobby_{room_name}"
        await self.channel_layer.group_add(self.current_group, self.channel_name)
        await self.send(json.dumps({"message": f"Joined Lobby {room_name}"}))

    async def notify_ready(self, room_name):
        group_name = f"lobby_{room_name}"
        await self.channel_layer.group_send(
                group_name,
                {
                    "type": "player_ready",
                    "player_id": self.player_id
                }
            )

    async def player_ready(self, event):
        await self.send(json.dumps({
            "event": "player_ready",
            "player_id": event["player_id"]
        }))
