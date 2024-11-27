import json
import uuid
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.sessions import SessionMiddlewareStack
from room_manager import RoomManager
from game_room import GameRoom

room_manager = RoomManager()
active_game_rooms = {}

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
        elif action == "create_private_match":
            room_name = uuid.uuid4() 
            await self.create_private_lobby(room_name)
        elif action == "ready_up":
            await self.notify_ready(data["room_name"])
        elif data['type'] == "player_event":
            roomID = data['game_roomID']
            if roomID in active_game_rooms:
                game_room = active_game_rooms[roomID]
                await game_room.receive_player_event(data['player_id'], data['event'])
            else:
                await self.send(json.dumps({
                       "error": f"Game room {data['game_roomID']} not found"
                       }))

    
    async def create_private_lobby(self, room_name):
        if not hasattr(self, 'room_data'):
            self.room_data = {}
        self.room_data[room_name] = {"players": []}
        self.current_group = f"lobby_{room_name}"
        await self.channel_layer.group_add(self.current_group, self.channel_name)
        await self.send(json.dumps({
            "message": f"Created Lobby {room_name}",
            "room_name": room_name
            }))

    async def join_lobby(self, room_name):
        self.current_group = f"lobby_{room_name}"
        if not hasattr(self, 'room_data') or room_name not in self.room_data:
            await self.send(json.dumps({"error": f"lobby {room_name} does not exist"}))
            return
        if len(self.room_data[room_name]["players"]) >= 2:
            await self.send(json.dumps({"error": f"lobby {room_name} is full"}))
            return
        self.room_data[room_name]["players"].append(self.channel_name)
        await self.channel_layer.group_add(self.current_group, self.channel_name)
        await self.send(json.dumps({"message": f"Joined lobby {room_name}"}))

    async def update_ready_status(self, room_name, player_id):
        if room_name in self.room_data and player_id in self.rooms[room_name]["players"]:
            self.rooms[room_name]["ready"].append(player_id)
        if self.all_ready(room_name):
            player_channels = [self.channel_name]
            game_room = GameRoom(room_name, player_channels)
            active_game_rooms[room_name] = game_room #make sure to clean that shit up
            asyncio.create_task(game_room.run())

    def all_ready(self, room_name):
        return set(self.rooms[room_name]["players"]) == set(self.rooms[room_name]["ready"])

    async def player_ready(self, event):
        await self.send(json.dumps({
            "event": "player_ready",
            "player_id": event["player_id"]
        }))
