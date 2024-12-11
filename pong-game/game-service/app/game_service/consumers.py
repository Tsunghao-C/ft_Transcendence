import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
import asyncio
import random

class GameConsumer(AsyncWebsocketConsumer):
    # Class variable to store all active games
    active_games = {}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.game_id = None
        self.room_group_name = None
        self.game_loop_task = None

    @classmethod
    def get_or_create_game(cls, game_id):
        if game_id not in cls.active_games:
            cls.active_games[game_id] = {
                'status': 'waiting',
                'players': {},
                'ball': {
                    'x': 400,
                    'y': 300,
                    'dx': 5,
                    'dy': 5,
                    'radius': 10
                },
                'paddles': {
                    'p1': {
                        'y': 300,
                        'x': 50,
                        'height': 100,
                        'width': 10,
                        'speed': 10
                    },
                    'p2': {
                        'y': 300,
                        'x': 750,
                        'height': 100,
                        'width': 10,
                        'speed': 10
                    }
                },
                'score': {'p1': 0, 'p2': 0}
            }
        return cls.active_games[game_id]
    
    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.room_group_name = f'game_{self.game_id}'
        self.game_state = self.get_or_create_game(self.game_id)

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Add player to game
        player_count = len(self.game_state['players'])
        if player_count < 2:
            player_id = 'p1' if 'p1' not in self.game_state['players'].values() else 'p2'
            self.game_state['players'][self.channel_name] = player_id

            await self.send(json.dumps({
                'type': 'player_assignment',
                'player_id': player_id,
                'game_id': self.game_id
            }))

            if len(self.game_state['players']) == 2:
                self.game_state['status'] = 'playing'
                # Only start game loop for the first player
                if player_id == 'p1':
                    self.game_loop_task = asyncio.create_task(self.game_loop())
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_start',
                        'message': 'Game is starting!'
                    }
                )
        else:
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Game is full'
            }))
            await self.close()
            
    async def disconnect(self, close_code):
        if self.game_loop_task:
            self.game_loop_task.cancel()

        if self.channel_name in self.game_state['players']:
            player_id = self.game_state['players'][self.channel_name]
            del self.game_state['players'][self.channel_name]

        if len(self.game_state['players']) == 0:
            # Remove the game if no players are left
            if self.game_id in self.active_games:
                del self.active_games[self.game_id]

        self.game_state['status'] = 'finished'

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_end',
                'message': 'Player disconnected'
            }
        )

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'paddle_move':
            player_id = self.game_state['players'][self.channel_name]
            direction = data['direction']
            paddle = self.game_state['paddles'][player_id]

            if direction == 'up':
                paddle['y'] = max(0, paddle['y'] - paddle['speed'])
            elif direction == 'down':
                paddle['y'] = min(500, paddle['y'] + paddle['speed'])
    
    async def game_loop(self):
        try:
            while self.game_state['status'] == 'playing':
                self.update_game_status()
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_state_update',
                        'game_state': self.game_state
                    }
                )
                await asyncio.sleep(1/60) # FPS 60
        except asyncio.CancelledError:
            pass
    
    def update_game_state(self):
        ball = self.game_state['ball']
        paddles = self.game_state['paddles']

        # Update ball position
        ball['x'] += ball['dx']
        ball['y'] += ball['dy']

        # Ball collision with top and bottom
        if ball['y'] - ball['radius'] <=0 or ball['y'] + ball['radius'] >= 600:
            ball['dy'] *= -1

        # Ball collision with paddles
        for player_id, paddle in paddles.items():
            if (ball['x'] - ball['radius'] <= paddle['x'] + paddle['width'] and
                ball['x'] + ball['radius'] >= paddle['x'] and
                ball['y'] >= paddle['y'] and
                ball['y'] <= paddle['y'] + paddle['height']):

                ball['dx'] *= -1.1 # Increase speed slightly
                # Add some randomness to y direction
                ball['dy'] = random.uniform(-7, 7)

        # Score points
        if ball['x'] <= 0:
            self.game_state['score']['p2'] += 1
            self.reset_ball()
        elif ball['x'] >= 800:
            self.game_state['score']['p1'] += 1
            self.reset_ball()

        # Check win condition
        if self.game_state['score']['p1'] >= 5 or self.game_state['score']['p1'] >= 5:
            self.game_state['status'] = 'finished'
    
    def reset_ball(self):
        self.game_state['ball'].update({
            'x': 400,
            'y': 300,
            'dy': random.choice([-5, 5]),
            'dy': random.uniform(-3, 3)
        })
    
    async def game_state_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def game_start(self, event):
        await self.send(text_data=json.dumps(event))
    
    async def game_end(self, event):
        await self.send(text_data=json.dumps(event))


# import os
# import logging
# from dotenv import load_dotenv
# import json
# import uuid
# import asyncio
# from channels.generic.websocket import AsyncWebsocketConsumer
# from channels.sessions import SessionMiddlewareStack
# from channels.layers import get_channel_layer
# from channels.testing import WebsocketCommunicator
# from .game_room import GameRoom

# load_dotenv()
# active_game_rooms = {}
# active_lobbies = {} #This has no methods cleaning it up yet. Need to clean when gamerooms terminate or if players leave a lobby
# logger = logging.getLogger(__name__)

# class GameConsumer(AsyncWebsocketConsumer):
#     def __init__(self, *args, **kwargs):
#         super().__init__(*args, **kwargs)
#         self.channel_layer = get_channel_layer()

#     async def connect(self):
#         logger.info(f"WebSocket connection attempt: {self.scope['path']}")
#         try:
#             await self.accept()
#         except Exception as e:
#             logger.error(f"WebSocket connection error: {e}")
#         await self.send(json.dumps({
#             "type": "notice",
#             "message": "Connection established"
#             }))

#     async def disconnect(self, code): #beef it up with socket closing and such
#         if hasattr(self, 'current_group'):
#             await self.channel_layer.group_discard(self.current_group, self.channel_name)

#     async def receive(self, text_data=None, bytes_data=None):
#         if text_data is None:
#             return
#         data = json.loads(text_data)
#         action = data.get("action")
#         player_id = data.get("id")

#         if action == "join_private_match":
#             await self.join_lobby(data["room_name"], player_id)
#         elif action == "create_private_match":
#             room_name = str(uuid.uuid4())
#             await self.create_private_lobby(room_name, player_id)
#         elif action == "ready_up":
#             await self.update_ready_status(data["room_name"], data["player_id"])
#         elif data['type'] == "player_input":
#             roomID = data['game_roomID']
#             if roomID in active_game_rooms:
#                 game_room = active_game_rooms[roomID]
#                 logger.info("Consumer: Received player input")
#                 await game_room.receive_player_input(data['player_id'], data['input'])
#                 logger.info("Consumer: Forwarded player input")
#             else:
#                 await self.send(json.dumps({
#                        "type": "error",
#                        "message": f"Game room {data['game_roomID']} not found"
#                        }))

#     async def create_private_lobby(self, room_name, player_id):
#         active_lobbies[room_name] = {"players": [player_id]}
#         self.current_group = f"lobby_{room_name}"
#         await self.channel_layer.group_add(self.current_group, self.channel_name)
#         await self.send(json.dumps({
#             "type": "room_creation",
#             "message": f"Created Lobby {room_name}",
#             "room_name": room_name
#             }))

#     async def join_lobby(self, room_name, player_id):
#         if room_name not in active_lobbies:
#             await self.send(json.dumps({
#                 "type": "error",
#                 "message": f"lobby {room_name} does not exist"
#                 }))
#         self.current_group = f"lobby_{room_name}"
#         if player_id in active_lobbies[room_name]["players"]:
#             await self.send(json.dumps({
#                 "type": "error",
#                 "message": "player is already in lobby"
#                 }))
#             return
#         if len(active_lobbies[room_name]["players"]) >= 2:
#             await self.send(json.dumps({"error": f"lobby {room_name} is full"}))
#             return
#         active_lobbies[room_name]["players"].append(player_id)
#         await self.channel_layer.group_add(self.current_group, self.channel_name)
#         await self.send(json.dumps({
#             "type": "notice",
#             "message": f"Joined lobby {room_name}"
#             }))

#     async def group_message(self, event):
#         await self.send(json.dumps({
#             'type': 'notice',
#             'message': event["message"]
#             }))

#     async def game_message(self, event):
#         await self.send(json.dumps({
#             'type': event['update_type'],
#             'payload': event['payload'],
#             'message': event['message']
#             }))

#     async def update_ready_status(self, room_name, player_id):
#         if room_name not in active_lobbies:
#             await self.send(json.dumps({
#                 "type": "error",
#                 "error": f"lobby {room_name} not found"
#                 }))
#             return
#         if "ready" not in active_lobbies[room_name]:
#             active_lobbies[room_name]["ready"] = []
#         if room_name in active_lobbies:
#             if player_id not in active_lobbies[room_name].get("ready", []):
#                 active_lobbies[room_name]["ready"].append(player_id)
#                 logger.info(f"Player has readied up, id: {player_id}")
#                 group_name = f"lobby_{room_name}"
#                 await self.channel_layer.group_send(
#                     group_name,
#                     {
#                         "type": "group_message",
#                         "message": f"Player {player_id} is ready"
#                     })
#         if self.all_ready(room_name):
#             try:
#                 group_name = f"lobby_{room_name}"
#                 await self.channel_layer.group_send(
#                     group_name,
#                     {
#                         "type": "group_message",
#                         "message": "Game is starting"
#                     })
#                 logger.info(f"Starting game id: lobby_{room_name}")
#                 player_channels = get_channel_layer()
#                 game_room = GameRoom(room_name, player_channels, active_lobbies[room_name]["players"])
#                 logger.info("GameRoom created")
#                 active_game_rooms[group_name] = game_room
#                 game_task = asyncio.create_task(game_room.run())
#                 del active_lobbies[room_name]
#                 logger.info("GameRoom task added")
#                 game_task.add_done_callback(self.handle_game_task_completion) #this is fucking wack, shouldn't the task be passed as parameter?
#             except Exception as e:
#                 logger.error(f"Failed to start the gameroom: {str(e)}")
#                 await self.send(json.dumps({
#                     "type": "error",
#                     "error": f"Failed to start game: {str(e)}"
#                     }))

#     def handle_game_task_completion(self, task):
#         try:
#             logger.info("Game Room complete")
#             task.result()
#         except asyncio.CancelledError:
#             print("Game task was cancelled")
#         except Exception as e:
#             print(f"Game task encountered error: {e}")
#             raise
#         finally:
#             room_name = task.get_name() #shouldn't this be self.get_name() instead??
#             if room_name in active_game_rooms:
#                 del active_game_rooms[room_name]

#     def all_ready(self, room_name):
#         if room_name not in active_lobbies:
#             return False
#         players = active_lobbies[room_name].get("players", [])
#         ready_players = active_lobbies[room_name].get("ready", [])
#         return set(players) == set(ready_players)

#     #not implemented ahah
#     def cleanup_timed_out_rooms(self): #Potentially could be handled in handle_game_task_completion
#         rooms_to_remove = [
#                 room_id for room_id, game_room in active_game_rooms.items()
#                 if game_room.has_timed_out() #decide whether the consumer or the game_room will track the time
#                 ]
#         for room_id in rooms_to_remove:
#             del active_game_rooms[room_id]

## for test room
# class GameConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.game_id = self.scope['url_route']['kwargs']['game_id']
#         self.game_group_name = f'game_{self.game_id}'
        
#         await self.channel_layer.group_add(
#             self.game_group_name,
#             self.channel_name
#         )
#         await self.accept()

#     async def disconnect(self, close_code):
#         await self.channel_layer.group_discard(
#             self.game_group_name,
#             self.channel_name
#         )

#     async def receive(self, text_data):
#         data = json.loads(text_data)
#         await self.channel_layer.group_send(
#             self.game_group_name,
#             {
#                 'type': 'game_message',
#                 'message': data['message']
#             }
#         )

#     async def game_message(self, event):
#         await self.send(text_data=json.dumps({
#             'message': event['message']
#         }))
