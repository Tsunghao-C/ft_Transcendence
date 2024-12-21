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
from .models import Lobby
from asgiref.sync import sync_to_async



load_dotenv()
active_game_rooms = dict()
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
		if action == "join_private_match":
			await self.join_lobby(data["room_name"])
		elif action == "create_local_match":
			room_name = str(uuid.uuid4())
			await self.create_local_match(room_name)
		elif action == "create_private_match":
			room_name = str(uuid.uuid4())
			await self.create_private_lobby(room_name)
		elif action == "create_ai_match":
			room_name = str(uuid.uuid4())
			difficulty = data.get('difficulty', 'medium')
			await self.create_ai_lobby(room_name, difficulty)
		elif action == "player_ready":
			await self.update_ready_status(data["room_name"])
		elif data.get('type') == "player_input":
			roomID = data['game_roomID']
			if roomID in active_game_rooms:
				game_room = active_game_rooms[roomID]["room_data"]
				logger.info("Consumer: Received player input")
				await game_room.receive_player_input(self.user.alias, data['input'])
				logger.info("Consumer: Forwarded player input")
			else:
				await self.send(json.dumps({
					"type": "error",
					"message": f"Game room {data['game_roomID']} not found"
					}))

	async def create_ai_lobby(self, room_name, difficulty):

		lobby = await Lobby.objects.acreate(room_name=room_name, is_ai_game=True, difficulty=difficulty)
		await lobby.players.aadd(self.user)
		await lobby.asave()
		game_type = "AI Game"
		await self.send(json.dumps({
			"type": "room_creation",
			"message": f"Created {game_type} Lobby {room_name}",
			"room_name": room_name,
			"is_ai_game": True
		}))


	async def create_private_lobby(self, room_name):

		lobby = await Lobby.objects.acreate(room_name=room_name)
		# self.current_group = f"lobby_{room_name}" are we using this ?
		game_type = "Private Game"
		await self.send(json.dumps({
			"type": "room_creation",
			"message": f"Created  {game_type} Lobby {room_name}",
			"room_name": room_name,
			"is_ai_game": False
			}))

	async def create_local_match(self, room_name):

		lobby = await Lobby.objects.acreate(room_name=room_name, is_local_game=True)
		await lobby.players.aadd(self.user)
		await lobby.asave()
		await self.send(json.dumps({
			"type": "local_room_creation",
			"message": f"Created local match Lobby {room_name}",
			"room_name": room_name,
			"player2_id": player_2
			}))

	async def join_lobby(self, room_name):
		try:
			lobby = await Lobby.objects.aget(room_name=room_name)
		except Lobby.DoesNotExist:
			await self.send(json.dumps({
				"type": "error",
				"message": f"Lobby {room_name} does not exist"
			}))
			return
		if await lobby.players.filter(id=self.user.id).aexists():
			await self.send(json.dumps({
				"type": "error",
				"message": "Player is already in the lobby"
			}))
			return
		if await lobby.players.acount() >= 2:
			await self.send(json.dumps({
				"type": "error",
				"message": f"Lobby {room_name} is full"
			}))
			return
		await lobby.players.aadd(self.user)
		await lobby.asave()

		lobby.connections.append(self.channel_name)
		await lobby.asave()
		if await lobby.players.acount() == 1:
			await self.send(json.dumps({
				"type": "set_player_1",
				"alias": self.user.alias,
			}))
			return

		players = await sync_to_async(list)(lobby.players.all())
		channel_layer = get_channel_layer()
		player1_alias = players[0].alias if len(players) > 0 else None
		player2_alias = players[1].alias if len(players) > 1 else None

		await self.send_message_to_connections(
			lobby,
			message_type="join",
			message_data={
				"message": f"Player {self.user.alias} joined lobby {room_name}",
				"player1": player1_alias,
				"player2": player2_alias,
			}
		)

	async def update_ready_status(self, room_name):
		try:
			lobby = await Lobby.objects.aget(room_name=room_name)
		except Lobby.DoesNotExist:
			await self.send(json.dumps({
				"type": "error",
				"message": f"Lobby {room_name} does not exist"
			}))
			return
		is_ai_game = lobby.is_ai_game
		is_local_game = lobby.is_local_game
		ready_players = await sync_to_async(list)(lobby.ready_players.all())
		if self.user not in ready_players:
			await lobby.ready_players.aadd(self.user)
			await lobby.asave()
			await self.send_message_to_connections(
				lobby,
				message_type="notice",
				message_data={
					"message": f"Player {self.user.alias} is ready"
				}
			)
		nbr_players_ready = await lobby.ready_players.acount()
		if (is_local_game == True or is_ai_game == True) or nbr_players_ready == 2:
			try:
				await self.launch_game(room_name)
			except:
				logger.error(f"Exception caught when launching game room: {room_name}")
				raise

	async def launch_game(self, room_name):
		
		try:
			lobby = await Lobby.objects.aget(room_name=room_name)
			players_aliases = await sync_to_async(list)(lobby.players.all().values_list('alias', flat=True))
			connections = await sync_to_async(list)(lobby.connections.all())
			await self.send_message_to_connections(
				lobby,
				message_type="notice",
				message_data={
					"message": "Game is starting"
				}
			)
			# game_room = GameRoom(room_name, players, connections, difficulty=lobby.difficulty if lobby.is_ai_game else None)
			game_room = GameRoom(room_name, players_aliases, connections)
			logger.info("GameRoom created")
			active_game_rooms[group_name] = {
				"room_data": game_room,
				"player_data": {
						"connection": connections,
					"ids": players_aliases
				}
			}
			game_task = asyncio.create_task(game_room.run())
			await lobby.adelete()
			logger.info("GameRoom task added")
			game_task.add_done_callback(self.handle_game_task_completion)

		except Exception as e:
			logger.error(f"Failed to start the gameroom: {str(e)}")
			await self.send(json.dumps({
				"type": "error",
				"error": f"Failed to start game: {str(e)}"
				}))

	async def send_message_to_connections(self, lobby, message_type, message_data):
		channel_layer = get_channel_layer()

		for connection in lobby.connections:
			await channel_layer.send(
				connection,
				{
					"type": "chat_message",
					"message_type": message_type, 
					"message_data": message_data, 
				},
			)

	async def chat_message(self, event):
		message_type = event["message_type"]
		message_data = event["message_data"]
		
		await self.send(text_data=json.dumps({
			"type": message_type,
			**message_data
		}))


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
			if room_name in active_game_rooms:
				del active_game_rooms[room_name]

	#not implemented ahah
	def cleanup_timed_out_rooms(self): #Potentially could be handled in handle_game_task_completion
		rooms_to_remove = [
				room_id for room_id, game_room in active_game_rooms.items()
				if game_room.has_timed_out() #decide whether the consumer or the game_room will track the time
				]
		for room_id in rooms_to_remove:
			del active_game_rooms[room_id]

	

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