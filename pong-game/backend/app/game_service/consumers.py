import os
import jwt
import logging
from dotenv import load_dotenv
import json
import uuid
import asyncio
import time
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from .game_room import GameRoom
from user_service.models import CustomUser
from match_making.models import MatchMakingQueue, LiveGames
from match_making.models import MatchMakingQueue, LiveGames
from channels.db import database_sync_to_async
from urllib.parse import parse_qs
from django.conf import settings
from chat.models import Message
from django.db.models import Q
from asgiref.sync import sync_to_async
from django.db.utils import IntegrityError
from django.db.models import Q

from django.db.utils import IntegrityError
from django.db.models import Q



load_dotenv()
active_online_games = dict()
paused_games = dict()
active_local_games = dict()
active_lobbies = {}
logger = logging.getLogger(__name__)
TIMEOUT = 1
ABORTED = 2

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
		self.channel_layer = get_channel_layer() #Unused? Marked for deletion
		self.assigned_room = -1
		self.in_game = False
		self.player_alias = -1
		self.last_receive_time = time.perf_counter()
		self.receive_methods = {
				"join_private_match":self.join_lobby,
				"create_local_match":self.create_local_match,
				"create_private_match": self.create_private_lobby,
				"join_queue": self.join_queue,
				"create_ai_match": self.create_ai_lobby,
				"player_ready": self.update_ready_status,
				"player_input": self.receive_player_input,
				"rejoin_room": self.rejoin_room,
		}

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
			await self.send(json.dumps({
				"type": "notice",
				"message": "Connection established"
			}))
			logger.info("gameConsumer: accepted connection")
			for paused_room_id, room_data in paused_games.items():
				player_ids = room_data["player_data"]["ids"]
				logger.info(f"gameConsumer: searching for user in paused_games: {paused_games}")
				if user.alias in player_ids:
					logger.info(f"gameConsumer: Match found in paused game for user: {user.alias}")
					index = player_ids.index(user.alias)
					room_data["player_data"]["connection"][index] = self
					self.assigned_room = paused_room_id
					await self.send(json.dumps({
								"type": "rejoin_room_query",
								"message": "Paused game room found, rejoin?",
								"room_name": paused_room_id
								}))
					logger.info("gameConsumer: sent rejoin notice to client")
		except Exception as e:
			logger.error(f"WebSocket connection error: {e}")


	async def disconnect(self, code):
		logger.info("Websocket connection closed")
		if self.in_game:
			if self.assigned_room in paused_games.keys():
				room = paused_games[self.assigned_room]
				await room["notification_queue"].put({
					"order": "abort game",
					})
				del paused_games[self.assigned_room]
			else:
				room = active_online_games.pop(self.assigned_room)
				paused_games[self.assigned_room] = room
				await room["notification_queue"].put({
					"order": "pause game",
					"id": self.user.alias
					})

		if hasattr(self, 'current_group'):
			await self.channel_layer.group_discard(self.current_group, self.channel_name)

	# TODO:
	# Tournaments
	# Random match
	# leave a lobby

	async def receive(self, text_data=None, bytes_data=None):
		if text_data is None:
			return
		data = json.loads(text_data)
		logger.info(f"Message received: {text_data}")
		action = data.get("action")
		logger.info(f"Action: {action}")
		if action in self.receive_methods.keys():
			logger.info(f"Found receive_methods key, calling function {self.receive_methods[action]}")
			await self.receive_methods[action](data)
		else:
			await self.send(json.dumps({
				"type": "error",
				"message": f"Unrecognized action {action}"
				}))

	async def receive_player_input(self, data):
		roomID = data['game_roomID']
		local_game = data['local']
		logger.info("Receive_player_input called")
		player_alias = self.user.alias
		if local_game is False:
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
		else:
			if roomID in active_local_games:
				game_room = active_local_games[roomID]["room_data"]
				player_id = data['player_id']
				logger.info("Consumer: Received player input")
				await game_room.receive_player_input(player_id, data['input'])
				logger.info("Consumer: Forwarded player input")
			else:
				await self.send(json.dumps({
					"type": "error",
					"message": f"Game room {data['game_roomID']} not found"
					}))

	async def rejoin_room(self, data):
		if data["response"] is True:
			room = paused_games.pop(self.assigned_room)
			active_online_games[self.assigned_room] = room
			room["room_data"].player_rejoin(self.user.alias, self)
		else:
			self.in_game = False
			room = paused_games.pop(self.assigned_room)
			await room["notification_queue"].put({
				"order": "abort game",
				})

		#check for yes or no response from client
		#if no, kill game, send abort-game to the gameRoom
		#if yes, pop the room from paused_games, add it back to active_online_games, then call player_back on gameRoom
		pass

	async def create_ai_lobby(self, data):
		room_name = str(uuid.uuid4())
		self.assigned_room = room_name
		player_alias = self.user.alias
		difficulty = data.get('difficulty', 'medium')
		game_type = {
			"is_online": False,
			"is_local": False,
			"is_ai": True
		}
		active_lobbies[room_name] = {
			"players": [player_alias],
			"ready": [],
			"connection": [self],
			"local": False,
			"is_ai_game": True,
			"difficulty": difficulty,
			"game_type": game_type
		}
		self.current_group = f"lobby_{room_name}"
		await self.channel_layer.group_add(self.current_group, self.channel_name)
		game_type = "AI Game"
		await self.send(json.dumps({
			"type": "room_creation",
			"message": f"Created {game_type} Lobby {room_name}",
			"room_name": room_name,
			"is_ai_game": True
		}))

	async def join_queue(self, data):
		logger.info("Joining quick match")
		try:
			await sync_to_async(MatchMakingQueue.objects.filter(player=self.user).delete)() # we will have to delete this later jsut to test
			queue_entry = await sync_to_async(MatchMakingQueue.objects.create)(player=self.user)
			await self.send(json.dumps({
				"type":"notice",
				"message":f"User {self.user.alias} added to queue"
			}))
			await self.get_matched(queue_entry)
		except IntegrityError:
			await self.send(json.dumps({
				"type":"error",
				"message":"User is already in the queue"
			}))

	async def get_matched(self, queue_entry):
		print(f"Starting get_matched for user {self.user.alias}")
		await sync_to_async(LiveGames.objects.filter(Q(p1=self.user) | Q(p2=self.user)).delete)() # we will have to delete that too
		while True:
			is_matched = await sync_to_async(queue_entry.match_players)()
			existing_game = await sync_to_async(
				LiveGames.objects.filter(
					Q(p1=self.user) | Q(p2=self.user),
					status=LiveGames.Status.not_started
				).exists
			)()
			matched = is_matched or existing_game
			print(f"Matched result: {matched} for user {self.user.alias} ")  # Debug 1

			if matched:
				game = await sync_to_async(
					LiveGames.objects.filter(
						Q(p1=self.user) | Q(p2=self.user)
					).first
				)()
				print(f"Game found: {game}")  # Debug 2

				if not game:
					continue

				print(f"Game status: {game.status}")  # Debug 3

				if game.status != LiveGames.Status.not_started:
					await self.send(json.dumps({
						"type":"error",
						"message":"this user is already in an active game"
					}))
					break

				is_p1 = await sync_to_async(lambda: game.p1 == self.user)()
				print(f"Is P1: {is_p1}")  # Debug 4
				if is_p1:
					print("user one is creating the game ")
					await self.create_quick_match_lobby(game)
					return
				await asyncio.sleep(5) # need to think of a better way to stagger p2
				room_name = str(game.gameUID)
				print("user two is joining the game")
				await self.send(json.dumps({
					"type": "room_creation",
					"message": f"Created Lobby {room_name}",
					"room_name": room_name,
					"is_ai_game": False
					}))
				break
			await asyncio.sleep(15)

	async def create_quick_match_lobby(self, game):
		logger.info("Creating quickmatch lobby")
		room_name = str(game.gameUID)
		self.assigned_room = room_name
		self.assigned_player_alias = self.user.alias
		players = [self.user.alias]
		game_type = {
			"is_online": True,
			"is_local": False,
			"is_ai": False
		}
		active_lobbies[room_name] = {
				"players": [],
				"ready": [],
				"connection": [],
				"local": False,
				"is_ai_game": False,
				"difficulty": None,
				"game_type": game_type
				}
		await self.send(json.dumps({
			"type": "room_creation",
			"message": f"Created Lobby {room_name}",
			"room_name": room_name,
			"is_ai_game": False
		}))


	async def create_private_lobby(self, data):
		logger.info("Creating private lobby")
		room_name = str(uuid.uuid4())
		self.assigned_room = room_name
		player_alias = self.user.alias

		game_type = {
			"is_online": True,
			"is_local": False,
			"is_ai": False
		}
		active_lobbies[room_name] = {
				"players": [],
				"ready": [],
				"connection": [],
				"local": False,
				"is_ai_game": False,
				"difficulty": None,
				"game_type": game_type
				}
		await self.send(json.dumps({
			"type": "room_creation",
			"message": f"Created Lobby {room_name}",
			"room_name": room_name,
			"is_ai_game": False
			}))

	async def create_local_match(self, data):
		room_name = str(uuid.uuid4())
		self.assigned_room = room_name
		player_alias = self.user.alias
		player_2 = str(uuid.uuid4())
		game_type = {
			"is_online": False,
			"is_local": True,
			"is_ai": False
		}
		active_lobbies[room_name] = {
			"players": [player_alias],
			"connection": [self],
			"local": True,
			"is_ai_game": False,
			"difficulty": None,
			"game_type": game_type
		}
		await self.send(json.dumps({
			"type": "local_room_creation",
			"message": f"Created local match Lobby {room_name}",
			"room_name": room_name,
			"player2_id": player_alias + "_2"
			}))

	async def join_lobby(self, data):
		room_name = data["room_name"]
		player_alias = self.user.alias
		if room_name not in active_lobbies:
			await self.send(json.dumps({
				"type": "error",
				"message": f"lobby {room_name} does not exist"
				}))
			return
		self.current_group = f"lobby_{room_name}"
		if player_alias in active_lobbies[room_name]["players"]:
			await self.send(json.dumps({
				"type": "rejoin",
				"message": "player is already in lobby",
				"player1": f"{active_lobbies[room_name]['players'][0]}",
				"player2": f"{active_lobbies[room_name]['players'][1]}"
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

	async def update_ready_status(self, data):
		print("************************")
		print(data)
		print("************************")
		room_name = data["room_name"]
		player_alias = self.user.alias
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
		if (
			(len(active_lobbies[room_name]["players"]) == 2 and active_lobbies[room_name]["game_type"]["is_online"])
			or
			(len(active_lobbies[room_name]["players"]) == 1)
		) and self.all_ready(room_name):
			try:
				await self.launch_game(room_name)
			except:
				logger.error(f"Exception caught when launching game room: {room_name}")
				raise

	async def launch_game(self, room_name):
		try:
			for connection in active_lobbies[room_name]["connection"]:
				connection.last_receive_time = time.perf_counter()
				await connection.send(json.dumps({
					"type": "notice",
					"message": "Game is starting"
					}))
			logger.info(f"Starting game id: lobby_{room_name}")
#			if  active_lobbies[room_name]["is_ai_game"] == True:
#				game_room = GameRoom(room_name, active_lobbies[room_name]["players"], active_lobbies[room_name]["connection"], active_lobbies[room_name]["local"], active_lobbies[room_name]["difficulty"])
#			else:
			notification_queue = asyncio.Queue()
			game_room = GameRoom(room_name,
						active_lobbies[room_name]["players"],
						active_lobbies[room_name]["connection"],
						notification_queue,
						active_lobbies[room_name]["game_type"],
						active_lobbies[room_name]["difficulty"]
						)
			logger.info("GameRoom created")
			logger.info("Checking for local")
			if active_lobbies[room_name]["local"]:
				logger.info("Local is true")
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
					"ids": active_lobbies[room_name]["players"],
					"notification_queue": notification_queue
					}}
			game_task = asyncio.create_task(game_room.run())
			self.in_game = True
			asyncio.create_task(self.monitor_gameRoom(notification_queue))
			del active_lobbies[room_name]
			deleted_count = await sync_to_async(Message.objects.filter(game_room=room_name).delete)()
			logger.info(f"Deleted {deleted_count} invitation(s) for game_room {room_name}")
			logger.info("GameRoom task added")
			game_task.add_done_callback(lambda task: self.handle_game_task_completion(task, room_name))
		except Exception as e:
			logger.error(f"Failed to start the gameroom: {str(e)}")
			self.in_game = False
			await self.send(json.dumps({
				"type": "error",
				"error": f"Failed to start game: {str(e)}"
				}))
				# add something to delete all invitation to this game

	async def monitor_gameRoom(self, notification_queue):
		while True:
			message = await notification_queue.get()
			if message["type"] == "player_missing":
				await self.handle_missing_player(message)

	async def handle_missing_player(self, message):
		logger.info(f"gameConsumer: Player {message['player_id']} reported missing by gameRoom")
		room_name = message['room_name']
		room = active_online_games.pop(room_name)
		paused_games[room_name] = room
		logger.info(f"gameConsumer: added room {room_name} to paused_games")
		await self.send(json.dumps({
			"type": "player_missing",
			}))

	def handle_game_task_completion(self, task, room_name):
		try:
			logger.info("Game Room complete")
		except asyncio.CancelledError:
			print("Game task was cancelled")
		except Exception as e:
			print(f"Game task encountered error: {e}")
			raise
		finally:
			result = task.result()
			self.assigned_room = -1
			self.in_game = False
			if room_name in active_local_games.keys():
				logger.info(f"Removing gameRoom {room_name} from active_local_games")
				del active_local_games[room_name]
			elif result is TIMEOUT:
				logger.info(f"Removing gameRoom {room_name} from paused_games")
				del paused_games[room_name]
			elif result is not ABORTED:
				logger.info(f"Removing gameRoom {room_name} from active_online_games")
				del active_online_games[room_name]

	def all_ready(self, room_name):
		if room_name not in active_lobbies:
			return False
		players = active_lobbies[room_name].get("players", [])
		ready_players = active_lobbies[room_name].get("ready", [])
		return set(players) == set(ready_players)

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
