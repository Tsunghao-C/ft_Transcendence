import os
import jwt
import logging
from dotenv import load_dotenv
import json
import uuid
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from .game_room import GameRoom
from user_service.models import CustomUser
from channels.db import database_sync_to_async
from urllib.parse import parse_qs
from django.conf import settings


load_dotenv()
active_online_games = dict()
active_local_games = dict()
active_lobbies = {}
logger = logging.getLogger(__name__)

## Dedicated consumer for WS Health Check
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
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.channel_layer = get_channel_layer()
		self.assigned_room = -1
		self.player_alias = -1

	async def connect(self):
		logger.info(f"WebSocket connection attempt: {self.scope['path']}")
		user = await self.authenticate_user()
		if user is None:
			await self.close()
			return

		self.user = user
		print(user.id, user.alias, "is connected")
		try:
			await self.accept()
		except Exception as e:
			logger.error(f"WebSocket connection error: {e}")
		await self.send(json.dumps({
			"type": "notice",
			"message": "Connection established"
			}))

	async def disconnect(self, code):
		logger.info("Websocket connection closed")
	#        if self.assigned_room in active_lobbies:
	#            lobby = active_lobbies[self.assigned_room]
	#            try:
	#                lobby["connection"].remove(self)
	#            except ValueError:
	#                logger.warning(f"Consumer not found in connections for room {self.assigned_room}")
	#            try:
	#                player_index = lobby["connection"].index(self)
	#                lobby["players"].pop(player_index)
	#            except (ValueError, IndexError):
	#                logger.warning(f"Could not remove player ID from room {self.assigned_room}")
		if hasattr(self, 'current_group'):
			await self.channel_layer.group_discard(self.current_group, self.channel_name)

	# TODO:
	# Tournaments
	# Random match
	# leave a lobby
	# unready ?
	async def receive(self, text_data=None, bytes_data=None):
		if text_data is None:
			return
		data = json.loads(text_data)
		logger.info(f"Message received: {text_data}")
		action = data.get("action")
		player_alias = self.user.alias
		if action == "join_private_match":
			await self.join_lobby(data["room_name"], player_alias)
		elif action == "create_local_match":
			room_name = str(uuid.uuid4())
			await self.create_local_match(room_name, player_alias)
		elif action == "create_private_match":
			room_name = str(uuid.uuid4())
			await self.create_private_lobby(room_name, player_alias)
		elif action == "create_ai_match":
			room_name = str(uuid.uuid4())
			await self.create_ai_lobby(room_name, player_alias)
		elif action == "player_ready":
			await self.update_ready_status(data["room_name"], player_alias)
		elif data.get('type') == "player_input":
			roomID = data['game_roomID']
			if roomID in active_online_games:
				game_room = active_online_games[roomID]["room_data"]
				logger.info("Consumer: Received player input")
				await game_room.receive_player_input(player_alias, data['input'])
				logger.info("Consumer: Forwarded player input")
			else:
				await self.send(json.dumps({
					"type": "error",
					"message": f"Game room {data['game_roomID']} not found"
					}))

	async def create_ai_lobby(self, room_name, player_alias):
		self.assigned_room = room_name
		self.assigned_player_alias = player_alias

		players = [player_alias]
		players.append("ai_player")

		active_lobbies[room_name] = {
			"players": players,
			"connection": [self],
			"is_ai_game": True
		}
		active_lobbies[room_name]["ready"] = []
		active_lobbies[room_name]["ready"].append("ai_player")
		self.current_group = f"lobby_{room_name}"
		await self.channel_layer.group_add(self.current_group, self.channel_name)
		game_type = "AI Game"
		await self.send(json.dumps({
			"type": "room_creation",
			"message": f"Created {game_type} Lobby {room_name}",
			"room_name": room_name,
			"is_ai_game": True
		}))

	async def create_private_lobby(self, room_name, player_alias):
		self.assigned_room = room_name
		self.assigned_player_alias = player_alias

		players = []
		active_lobbies[room_name] = {
				"players": players,
				"connection": [],
                "local": False,
				}
		await self.send(json.dumps({
			"type": "room_creation",
			"message": f"Created Lobby {room_name}",
			"room_name": room_name,
			"is_ai_game": False
			}))

	async def create_local_match(self, room_name, player_alias):
		self.assigned_room = room_name
		active_lobbies[room_name] = {
				"players": [player_alias],
				"connection": [self]
				}
		player_2 = str(uuid.uuid4())
		active_lobbies[room_name]["players"].append(player_2)
		active_lobbies[room_name]["ready"] = []
		active_lobbies[room_name]["ready"].append(player_2)
		active_lobbies["local"] = True
		await self.send(json.dumps({
			"type": "local_room_creation",
			"message": f"Created local match Lobby {room_name}",
			"room_name": room_name,
			"player2_id": player_2
			}))

	async def join_lobby(self, room_name, player_alias):
		if room_name not in active_lobbies:
			await self.send(json.dumps({
				"type": "error",
				"message": f"lobby {room_name} does not exist"
				}))
		self.current_group = f"lobby_{room_name}"
		if player_alias in active_lobbies[room_name]["players"]:
			await self.send(json.dumps({
				"type": "error",
				"message": "player is already in lobby"
				}))
			return
		if len(active_lobbies[room_name]["players"]) >= 2:
			await self.send(json.dumps({"error": f"lobby {room_name} is full"}))
			return
		elif len(active_lobbies[room_name]["players"]) == 0:
			active_lobbies[room_name]["players"].append(player_alias)
			active_lobbies[room_name]["connection"].append(self)
			await self.channel_layer.group_add(self.current_group, self.channel_name)
			await self.send(json.dumps({
			"type": "set_player_1",
			"alias": player_alias,
			}))
			return
		self.assigned_room = room_name
		self.assigned_player_alias = player_alias
		active_lobbies[room_name]["players"].append(player_alias)
		active_lobbies[room_name]["connection"].append(self)
		await self.channel_layer.group_add(self.current_group, self.channel_name)
		for connection in active_lobbies[room_name]["connection"]:
			await connection.send(json.dumps({
				"type": "join",
				"message": f"Player {player_alias} joined lobby {room_name}",
				"player1": f"{active_lobbies[room_name]['players'][0]}",
				"player2": f"{active_lobbies[room_name]['players'][1]}"
				}))

	async def update_ready_status(self, room_name, player_alias):
		if room_name not in active_lobbies:
			await self.send(json.dumps({
				"type": "error",
				"error": f"lobby {room_name} not found"
				}))
			return
		if "ready" not in active_lobbies[room_name]:
			active_lobbies[room_name]["ready"] = []
		if room_name in active_lobbies:
			if player_alias not in active_lobbies[room_name].get("ready", []):
				active_lobbies[room_name]["ready"].append(player_alias)
				logger.info(f"Player {player_alias} has readied up")
				for connection in active_lobbies[room_name]["connection"]:
					await connection.send(json.dumps({
						"type": "notice",
						"message": f"Player {player_alias} is ready"
						}))
		if len(active_lobbies[room_name]["players"]) == 2 and self.all_ready(room_name):
			try:
				await self.launch_game(room_name)
			except:
				logger.error(f"Exception caught when launching game room: {room_name}")
				raise

	async def launch_game(self, room_name):
		try:
			for connection in active_lobbies[room_name]["connection"]:
				await connection.send(json.dumps({
					"type": "notice",
					"message": "Game is starting"
					}))
			logger.info(f"Starting game id: {room_name}")
			game_room = GameRoom(room_name, active_lobbies[room_name]["players"], active_lobbies[room_name]["connection"])
			logger.info("GameRoom created")
			if active_lobbies[room_name]["local"] == True:
				active_local_games[room_name] = {
					"room_data": game_room,
					"player_data": {
							"connection": active_lobbies[room_name]["connection"],
						"ids": active_lobbies[room_name]["players"]
					}}
			else:
				active_online_games[room_name] = {
					"room_data": game_room,
					"player_data": {
						"connection": active_lobbies[room_name]["connection"],
						"ids": active_lobbies[room_name]["players"]
						}}
			game_task = asyncio.create_task(game_room.run())
			del active_lobbies[room_name]
			logger.info("GameRoom task added")
			game_task.add_done_callback(self.handle_game_task_completion)
		except Exception as e:
			logger.error(f"Failed to start the gameroom: {str(e)}")
			await self.send(json.dumps({
				"type": "error",
				"error": f"Failed to start game: {str(e)}"
				}))
				# add something to delete all invitation to this game

	def handle_game_task_completion(self, task):
		try:
			logger.info("Game Room complete")
			task.result()
		except asyncio.CancelledError:
			print("Game task was cancelled")
		except Exception as e:
			print(f"Game task encountered error: {e}")
			raise
		finally:
			room_name = task.get_name()
			if room_name in active_online_games:
				del active_online_games[room_name]

	def all_ready(self, room_name):
		if room_name not in active_lobbies:
			return False
		players = active_lobbies[room_name].get("players", [])
		ready_players = active_lobbies[room_name].get("ready", [])
		return set(players) == set(ready_players)

	#not implemented ahah
	def cleanup_timed_out_rooms(self): #Potentially could be handled in handle_game_task_completion
		rooms_to_remove = [
				room_id for room_id, game_room in active_online_games.items()
				if game_room.has_timed_out() #decide whether the consumer or the game_room will track the time
				]
		for room_id in rooms_to_remove:
			del active_online_games[room_id]

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

# TO DO:
# once matches are decided, call GameConsumer
# once GameConsumer concludes match, check if the player
# 	is in a tournament and send them back to a lobby page
class TournamentConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.player_count = 0
        self.start_time = kwargs.get("start_time")
        self.max_players = kwargs.get("max_players")

    async def connect(self):
        self.user = self.scope["user"]
        # will re-enable auth after testing
        # if not self.user.is_authenticated:
        #     await self.send_json({"error": "Unauthorized access"})
        #     await self.close()
        #     return
        await self.accept()
        self.send_json({"detail": "accepted client connection"})
        # add in check to see if they're reconnecting
        self.player_count += 1
        return
		# match players
		# update game status
		# send updates

    async def disconnect(self):
        # do some cleanup here.
        return

    async def receive(self, text_data=None):
        if not text_data:
            return
        data = json.loads(text_data)
        # handle game events
        # update model state
        # broadcast updates
        return

    def get_num_rounds(self, num_players):
        return math.ceil(math.log2(num_players))

    def tournament_has_started(self):
        return timezone.now() > self.start_time

# TO DO:
# once matches are decided, call GameConsumer
# once GameConsumer concludes match, check if the player
# 	is in a tournament and send them back to a lobby page
class TournamentConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.player_count = 0
        self.start_time = kwargs.get("start_time")
        self.max_players = kwargs.get("max_players")

    async def connect(self):
        self.user = self.scope["user"]
        # will re-enable auth after testing
        # if not self.user.is_authenticated:
        #     await self.send_json({"error": "Unauthorized access"})
        #     await self.close()
        #     return
        await self.accept()
        self.send_json({"detail": "accepted client connection"})
        # add in check to see if they're reconnecting
        self.player_count += 1
        return
		# match players
		# update game status
		# send updates

    async def disconnect(self):
        # do some cleanup here.
        return

    async def receive(self, text_data=None):
        if not text_data:
            return
        data = json.loads(text_data)
        # handle game events
        # update model state
        # broadcast updates
        return

    def get_num_rounds(self, num_players):
        return math.ceil(math.log2(num_players))

    def tournament_has_started(self):
        return timezone.now() > self.start_time
