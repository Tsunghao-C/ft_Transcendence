import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.sessions import SessionMiddlewareStack
from room_manager import RoomManager

room_manager = RoomManager()

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.player_id = self.scope['session'].session_key #ask ben about this key
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
        elif data['type'] == "player_event":
            self.game_room.receive_player_event(
                    data['player_id'],
                    data['event']
                    )
    
    async def join_lobby(self, room_name):
        self.current_group = f"lobby_{room_name}"
        await self.channel_layer.group_add(self.current_group, self.channel_name)
        await self.send(json.dumps({"message": f"Joined Lobby {room_name}"}))

    async def notify_ready(self, room_name):
        room_manager.mark_ready(room_name, self.player_id)
        if room_manager.all_ready(room_name):
            player_channels = [self.channel_name]
            await room_manager.start_game(room_name)
            asyncio.create_task(start_game_loop(room_name, player_channels))

    async def player_ready(self, event):
        await self.send(json.dumps({
            "event": "player_ready",
            "player_id": event["player_id"]
        }))
