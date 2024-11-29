import json
import uuid
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.sessions import SessionMiddlewareStack
from room_manager import RoomManager
from game_room import GameRoom

active_game_rooms = {}

class GameConsumer(AsyncWebsocketConsumer): #refactor from relying on the websocket to the db player_id
    async def connect(self):
        self.player_id = self.scope['session'].session_key #ask ben about this key
        await self.accept()
        await self.send(json.dumps({"message": "Connection established"}))

    async def disconnect(self, close_code):
        if hasattr(self, 'current_group'):
            await self.channel_layer.group_discard(self.current_group, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")

        if action == "join_private_match":
            await self.join_lobby(data["room_name"])
        elif action == "create_private_match":
            room_name = uuid.uuid4() 
            await self.create_private_lobby(room_name)
        elif action == "ready_up":
            await self.update_ready_status(data["room_name"], data["player_id"])
        elif data['type'] == "player_input":
            roomID = data['game_roomID']
            if roomID in active_game_rooms:
                game_room = active_game_rooms[roomID]
                await game_room.receive_player_input(data['player_id'], data['input'])
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
        if not hasattr(self, 'room_data'):
            await self.send(json.dumps({"error": f"lobby {room_name} not found"}))
            return
        if "ready" not in self.room_data[room_name]:
            self.room_data[room_name]["ready"] = []
        if room_name in self.room_data:
            if player_id not in self.room_data[room_name].get("ready", []):
                self.room_data[room_name]["ready"].append(player_id)
        if self.all_ready(room_name):
            try:
                player_channels = self.room_data[room_name].get("players", [])
                game_room = GameRoom(room_name, player_channels)
                active_game_rooms[room_name] = game_room
                game_task = asyncio.create_task(game_room.run())
                game_task.add_done_callback(self.handle_game_task_completion) #this is fucking wack, shouldn't the task be passed as parameter?
            except Exception as e:
                await self.send(json.dumps({
                    "error": f"Failed to start game: {str(e)}"
                    }))

    def handle_game_task_completion(self, task):
        try:
            task.result()
        except asyncio.CancelledError:
            print("Game task was cancelled")
        except Exception as e:
            print(f"Game task encountered error: {e}")
        finally:
            room_name = task.get_name()
            if room_name in active_game_rooms:
                del active_game_rooms[room_name]

    def all_ready(self, room_name):
        if room_name not in self.room_data:
            return False
        players = self.room_data[room_name].get("players", [])
        ready_players = self.room_data[room_name].get("ready", [])
        return set(players) == set(ready_players)

    async def player_ready(self, event):
        await self.send(json.dumps({
            "event": "player_ready",
            "player_id": event["player_id"]
        }))

    def cleanup_timed_out_rooms(self): #Potentially could be handled in handle_game_task_completion
        rooms_to_remove = [
                room_id for room_id, game_room in active_game_rooms.items()
                if game_room.has_timed_out() #decide whether the consumer or the game_room will track the time
                ]
        for room_id in rooms_to_remove:
            del active_game_rooms[room_id]
