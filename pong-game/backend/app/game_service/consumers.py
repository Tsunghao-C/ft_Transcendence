import json
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import random
import math
import time

class GameHealthConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_group_name = 'game_health_check'
        await self.channel_layer.group_add(
            self.game_group_name,
            self.channel_name
        )
        await self.accept()
        await self.send(text_data=json.dumps({
            'type': 'player_assignment',
            'player_id': 'p1',
            'game_id': 'health_check'
        }))
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.game_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data['type'] == 'player_ready':
                print("Received player ready, sending game state")  # Debug log
                # Send game state update directly, no need for channel layer in health check
                await self.send(text_data=json.dumps({
                    'type': 'game_state_update',
                    'game_state': {
                        'status': 'playing',
                        'ball': {'x': 400, 'y': 300, 'radius': 10},
                        'paddles': {
                            'p1': {'x': 50, 'y': 250, 'width': 10, 'height': 100},
                            'p2': {'x': 740, 'y': 250, 'width': 10, 'height': 100}
                        },
                        'score': {'p1': 0, 'p2': 0}
                    }
                }))
        except json.JSONDecodeError as e:
            print(f"Error decoding message: {e}")

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
            # Initialize with random ball direction
            speed = 5.0 # Set initial ball speed
            angle = random.uniform(-math.pi/4, math.pi/4)

            cls.active_games[game_id] = {
                'status': 'waiting',  # states: waiting, ready, playing, finished
                'players': {},
                'ready_players': set(),
                'last_update': time.time(),
                'ball': {
                    'x': 400.0,
                    'y': 300.0,
                    'dx': speed * math.cos(angle),
                    'dy': speed * math.sin(angle),
                    'radius': 10
                },
                'paddles': {
                    'p1': {
                        'y': 250,
                        'x': 50,
                        'height': 100,
                        'width': 10,
                        'speed': 10
                    },
                    'p2': {
                        'y': 250,
                        'x': 740,
                        'height': 100,
                        'width': 10,
                        'speed': 10
                    }
                },
                'score': {'p1': 0, 'p2': 0}
            }
        return cls.active_games[game_id]
    
    async def send_game_state(self):
        """Helper method to send game state after converting non-serializable types"""
        game_state = self.game_state.copy()  # Make a copy to modify
        game_state['ready_players'] = list(self.game_state['ready_players'])  # Convert set to list
        await self.send(json.dumps({
            'type': 'game_state_update',
            'game_state': game_state
        }))

    async def connect(self):
        print("\n=== New Connection ===")
        print(f"Active games: {list(self.active_games.keys())}")
        print(f"Current game states: {[game['status'] for game in self.active_games.values()]}")
        print("=====================\n")
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
        print(f"Current player count: {player_count}")

        if player_count < 2:
            player_id = 'p1' if 'p1' not in self.game_state['players'].values() else 'p2'
            self.game_state['players'][self.channel_name] = player_id
            print(f"Assigned player ID: {player_id}")

            await self.send(json.dumps({
                'type': 'player_assignment',
                'player_id': player_id,
                'game_id': self.game_id
            }))

            await self.send_game_state()

            # Notify all players
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'player_status',
                    'count': len(self.game_state['players']),
                    'message': f'Player {player_id} joined'
                }
            )
            # # Immediately send current game state
            # await self.send(json.dumps({
            #     'type': 'game_state_update',
            #     'game_state': self.game_state
            # }))

            # # Notify new player joining
            # await self.channel_layer.group_send(
            #     self.room_group_name,
            #     {
            #         'type': 'player_status',
            #         'count': len(self.game_state['players']),
            #         'message': f'Player {player_id} joined the game',
            #     }
            # )

            # if len(self.game_state['players']) == 2:
            #     print("\n=== STARTING GAME ===")
            #     print(f"Player count: {len(self.game_state['players'])}")
            #     print(f"Current player: {player_id}")

            #     self.game_state['status'] = 'playing'
            #     self.reset_ball()
    
            #     p1_channel = None
            #     for channel, pid in self.game_state['players'].items():
            #         if pid == 'p1':
            #             p1_channel = channel
            #             break
                
            #     if p1_channel == self.channel_name:
            #         print("I am player 1, starting game loop...")
            #         try:
            #             self.game_loop_task = asyncio.create_task(self.game_loop())
            #             print("Game loop task created successfully")
            #         except Exception as e:
            #             print(f"Error creating game loop task: {str(e)}")
            #             import traceback
            #             traceback.print_exc()
            #     else:
            #         print(f"I am player {player_id}, wating for player 1 to start game loop")
                
            #     print("===================\n")

            #     await self.channel_layer.group_send(
            #         self.room_group_name,
            #         {
            #             'type': 'game_start',
            #             'message': 'Game is starting!'
            #         }
            #     )
        else:
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Game is full'
            }))
            await self.close()

    async def player_status(self, event):
        await self.send(text_data=json.dumps(event))
            
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
        try:            
            data = json.loads(text_data)
            print(f"Received data: {data}")

            if data['type'] == 'paddle_move':
                player_id = self.game_state['players'].get(self.channel_name)
                if not player_id:
                    print(f"No player_id found for {self.channel_name}")
                    return
                
                direction = data['direction']
                paddle = self.game_state['paddles'][player_id]
                old_y = paddle['y'] # Store old position for debugging

                if direction == 'up':
                    paddle['y'] = max(0, paddle['y'] - paddle['speed'])
                elif direction == 'down':
                    paddle['y'] = min(500, paddle['y'] + paddle['speed'])
    
                print(f"Moved {player_id} paddle from y={old_y} to y={paddle['y']}")

                # Send immediate update
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_state_update',
                        'game_state': {
                            **self.game_state,
                            'ready_players': list(self.game_state['ready_players'])
                        }
                    }
                )

            elif data['type'] == 'player_ready':
                # Handle player ready state
                player_id = self.game_state['players'].get(self.channel_name)
                if player_id and player_id not in self.game_state['ready_players']:
                    self.game_state['ready_players'].add(player_id)
                    print(f"Player {player_id} is ready. Ready players: {self.game_state['ready_players']}")

                    # Notify all players about ready status
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'player_ready_status',
                            'ready_players': list(self.game_state['ready_players'])
                        }
                    )

                    # If all players are ready, start the game
                    if len(self.game_state['ready_players']) == 2:
                        print("All players ready, starting game!")
                        self.game_state['status'] = 'playing'
                        self.reset_ball()

                        # Start game loop
                        if not self.game_loop_task or self.game_loop_task.done():
                            self.game_loop_task = asyncio.create_task(self.game_loop())
                            print("Game loop started")
                        # Send immediate update for responsive controls
                        await self.channel_layer.group_send(
                            self.room_group_name,
                            {
                                'type': 'game_state_update',
                                'game_state': self.game_state
                            }
                        )
            # await self.channel_layer.group_send(
            #     self.room_group_name,
            #     {
            #         'type': 'game_state_update',
            #         'game_state': self.game_state
            #     }
            # )
        except Exception as e:
            print(f"Error in receive: {e}")
            import traceback
            traceback.print_exc()
    
    def reset_ball(self):
        # Set random direction but with fixed speed
        speed = 5.0
        angle = random.uniform(-math.pi/4, math.pi/4)
        if random.choice([True, False]):
            angle += math.pi # Reverse direction
        
        self.game_state['ball'].update({
            'x': 400.0,
            'y': 300.0,
            'dx': speed * math.cos(angle),
            'dy': speed * math.sin(angle)
        })
        print(f"Ball reset - pos: ({self.game_state['ball']['x']}, {self.game_state['ball']['y']}), "
            f"velocity: ({self.game_state['ball']['dx']}, {self.game_state['ball']['dy']})")

    def update_game_state(self):
        if self.game_state['status'] != 'playing':
            print("Game not in playing state")
            self.dump_game_state()
            return

        ball = self.game_state['ball']
        old_x = ball['x']
        old_y = ball['y']
        paddles = self.game_state['paddles']

        print(f"Before update - Ball pos: ({old_x}, {old_y}), velocity: ({ball['dx']}, {ball['dy']})")
        # Update ball position with explicit float conversion
        ball['x'] = float(ball['x'] + ball['dx'])
        ball['y'] = float(ball['y'] + ball['dy'])

        print(f"After update - Ball pos: ({ball['x']}, {ball['y']})")

        # Ball collision with top and bottom
        if ball['y'] - ball['radius'] <=0 or ball['y'] + ball['radius'] >= 600:
            ball['dy'] *= -1
            print("Ball bounced off top/bottom wall")

        # Ball collision with paddles
        for player_id, paddle in paddles.items():
            if (ball['x'] - ball['radius'] <= paddle['x'] + paddle['width'] and
                ball['x'] + ball['radius'] >= paddle['x'] and
                ball['y'] >= paddle['y'] and
                ball['y'] <= paddle['y'] + paddle['height']):

                ball['dx'] *= -1.1 # Increase speed slightly
                # Add some randomness to y direction
                ball['dy'] = random.uniform(-7, 7)
                print(f"Ball hit {player_id}'s paddle")

        # Score points
        if ball['x'] <= 0:
            self.game_state['score']['p2'] += 1
            print("Player 2 scored!")
            self.reset_ball()
        elif ball['x'] >= 800:
            self.game_state['score']['p1'] += 1
            print("Player 1 scored!")
            self.reset_ball()

        # Check win condition
        if self.game_state['score']['p1'] >= 5 or self.game_state['score']['p2'] >= 5:
            self.game_state['status'] = 'finished'
    
    async def game_loop(self):
        try:
            print("\n=== GAME LOOP STARTING ===")
            iteration = 0
            last_time = time.time()

            # Immediately verify game state
            print(f"Initial game status: {self.game_state['status']}")
            print(f"Initial ball position: ({self.game_state['ball']['x']}, {self.game_state['ball']['y']})")
            print("==========================\n")
            
            while self.game_state['status'] == 'playing':
                iteration += 1
                current_time = time.time()
                
                # Print debug info every second
                if current_time - last_time >= 1:
                    print(f"\nLoop iteration {iteration}")
                    print(f"Game status: {self.game_state['status']}")
                    print(f"Ball position: ({self.game_state['ball']['x']}, {self.game_state['ball']['y']})")
                    print(f"Ball velocity: ({self.game_state['ball']['dx']}, {self.game_state['ball']['dy']})")
                    print("------------------------\n")
                    last_time = current_time
                
                self.update_game_state()
                await self.send_game_state()
                # await self.channel_layer.group_send(
                #     self.room_group_name,
                #     {
                #         'type': 'game_state_update',
                #         'game_state': self.game_state
                #     }
                # )
                await asyncio.sleep(1/60) # FPS 60
        except asyncio.CancelledError:
            print("Game loop cancelled")
        except Exception as e:
            print(f"Error in game loop: {e}")
            import traceback
            traceback.print_exc()

    async def game_state_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def game_start(self, event):
        await self.send(text_data=json.dumps(event))
    
    async def game_end(self, event):
        await self.send(text_data=json.dumps(event))
    
    async def player_ready_status(self, event):
        await self.send(text_data=json.dumps(event))
    
    def dump_game_state(self):
        ball = self.game_state['ball']
        print("\n=== Game State Dump ===")
        print(f"Status: {self.game_state['status']}")
        print(f"Ball - pos: ({ball['x']}, {ball['y']}), vel: ({ball['dx']}, {ball['dy']})")
        print(f"Players: {self.game_state['players']}")
        print(f"Score: {self.game_state['score']}")
        print("=====================\n")


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
