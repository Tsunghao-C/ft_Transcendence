import os
import logging
from dotenv import load_dotenv
import json
import uuid
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.sessions import SessionMiddlewareStack
from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from .game_room import GameRoom

load_dotenv()
active_game_rooms = {}
active_lobbies = {} #This has no methods cleaning it up yet. Need to clean when gamerooms terminate or if players leave a lobby
logger = logging.getLogger(__name__)

class GameConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.channel_layer = get_channel_layer()

    async def connect(self):
        logger.info(f"WebSocket connection attempt: {self.scope['path']}")
        try:
            await self.accept()
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
        await self.send(json.dumps({
            "type": "notice",
            "message": "Connection established"
            }))

    async def disconnect(self, code): #beef it up with socket closing and such
        if hasattr(self, 'current_group'):
            await self.channel_layer.group_discard(self.current_group, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if text_data is None:
            return
        data = json.loads(text_data)
        action = data.get("action")
        player_id = data.get("id")

        if action == "join_private_match":
            await self.join_lobby(data["room_name"], player_id)
        elif action == "create_private_match":
            room_name = str(uuid.uuid4())
            await self.create_private_lobby(room_name, player_id)
        elif action == "ready_up":
            await self.update_ready_status(data["room_name"], data["player_id"])
        elif data['type'] == "player_input":
            roomID = data['game_roomID']
            if roomID in active_game_rooms:
                game_room = active_game_rooms[roomID]
                await game_room.receive_player_input(data['player_id'], data['input'])
            else:
                await self.send(json.dumps({
                       "type": "error",
                       "message": f"Game room {data['game_roomID']} not found"
                       }))

    async def create_private_lobby(self, room_name, player_id):
        active_lobbies[room_name] = {"players": [player_id]}
        self.current_group = f"lobby_{room_name}"
        await self.channel_layer.group_add(self.current_group, self.channel_name)
        await self.send(json.dumps({
            "type": "room_creation",
            "message": f"Created Lobby {room_name}",
            "room_name": room_name
            }))

    async def join_lobby(self, room_name, player_id):
        if room_name not in active_lobbies:
            await self.send(json.dumps({
                "type": "error",
                "message": f"lobby {room_name} does not exist"
                }))
        self.current_group = f"lobby_{room_name}"
        if player_id in active_lobbies[room_name]["players"]:
            await self.send(json.dumps({
                "type": "error",
                "message": "player is already in lobby"
                }))
            return
        if len(active_lobbies[room_name]["players"]) >= 2:
            await self.send(json.dumps({"error": f"lobby {room_name} is full"}))
            return
        active_lobbies[room_name]["players"].append(player_id)
        await self.channel_layer.group_add(self.current_group, self.channel_name)
        await self.send(json.dumps({
            "type": "notice",
            "message": f"Joined lobby {room_name}"
            }))

    async def group_message(self, event):
        await self.send(json.dumps({
            'type': 'notice',
            'message': event["message"]
            }))

    async def game_message(self, event):
        await self.send(json.dumps({
            'type': event['update_type'],
            'payload': event['payload'],
            'message': event['message']
            }))

    async def update_ready_status(self, room_name, player_id):
        if room_name not in active_lobbies:
            await self.send(json.dumps({
                "type": "error",
                "error": f"lobby {room_name} not found"
                }))
            return
        if "ready" not in active_lobbies[room_name]:
            active_lobbies[room_name]["ready"] = []
        if room_name in active_lobbies:
            if player_id not in active_lobbies[room_name].get("ready", []):
                active_lobbies[room_name]["ready"].append(player_id)
                logger.info(f"Player has readied up, id: {player_id}")
                group_name = f"lobby_{room_name}"
                await self.channel_layer.group_send(
                    group_name,
                    {
                        "type": "group_message",
                        "message": f"Player {player_id} is ready"
                    })
        if self.all_ready(room_name):
            try:
                group_name = f"lobby_{room_name}"
                await self.channel_layer.group_send(
                    group_name,
                    {
                        "type": "group_message",
                        "message": "Game is starting"
                    })
                logger.info(f"Starting game id: lobby_{room_name}")
                player_channels = get_channel_layer()
                game_room = GameRoom(room_name, player_channels, active_lobbies[room_name]["players"])
                logger.info("GameRoom created")
                active_game_rooms[room_name] = game_room
                game_task = asyncio.create_task(game_room.run())
                logger.info("GameRoom task added")
                game_task.add_done_callback(self.handle_game_task_completion) #this is fucking wack, shouldn't the task be passed as parameter?
            except Exception as e:
                logger.error(f"Failed to start the gameroom: {str(e)}")
                await self.send(json.dumps({
                    "type": "error",
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
        if room_name not in active_lobbies:
            return False
        players = active_lobbies[room_name].get("players", [])
        ready_players = active_lobbies[room_name].get("ready", [])
        return set(players) == set(ready_players)

    def cleanup_timed_out_rooms(self): #Potentially could be handled in handle_game_task_completion
        rooms_to_remove = [
                room_id for room_id, game_room in active_game_rooms.items()
                if game_room.has_timed_out() #decide whether the consumer or the game_room will track the time
                ]
        for room_id in rooms_to_remove:
            del active_game_rooms[room_id]

