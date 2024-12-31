import math
import json
import asyncio
import httpx
import time
import logging
from .ai_player import PongAI
from .models import MatchResults
from asgiref.sync import sync_to_async
from user_service.models import CustomUser

from match_making.models import LiveGames
from user_service.models import CustomUser
from django.db import transaction

CANVAS_WIDTH = 800 #original value is 800, change it in case I fucked it up for tests
CANVAS_HEIGHT = 600
PADDLE_HEIGHT = 100
PADDLE_WIDTH = 15
BALL_RADIUS = 10
LEFT = 0
RIGHT = 1
ABORTED = 1
CONCEDE = 2

logger = logging.getLogger(__name__)

class Player():
	def __init__(self, side, canvas_width, canvas_height):
		if side == 'left':
			self.x = canvas_width * 0.10
		elif side == 'right':
			self.x = canvas_width * 0.90
		self.y = canvas_height * 0.30
		self.speed = 0
		self.score = 0
		self.dropped = False

class Ball():
	def __init__(self, canvas_width, canvas_height):
		self.canvas_width = canvas_width
		self.canvas_height = canvas_height
		self.x = canvas_width * 0.5
		self.y = canvas_height * 0.5
		self.speedX = 5
		self.speedY = 5
		self.radius = BALL_RADIUS

class GameRoom():
	def __init__(self, room_id, user_data, consumer_data, game_type, daddyficulty= ""):
		self.room_id = room_id
		self.connections = consumer_data
		self.game_type = game_type
		self.time_since_last_receive = {}
		self.missing_player = False
		self.server_order = -1

		self.left_player = user_data[0]
		self.ai_player = None
		if self.game_type["is_local"]:
			self.right_player = - self.left_player
		elif self.game_type["is_online"]:
			self.right_player = user_data[1]
		elif self.game_type["is_ai"]:
			self.right_player = - self.left_player
			self.ai_player = PongAI(
				difficulty = daddyficulty,
				canvas_width=CANVAS_WIDTH,
				canvas_height=CANVAS_HEIGHT
			)
		# # Adding AI player logic
		# if self.right_player == "ai_player":
		#     self.ai_player = PongAI(
		#         difficulty = daddyficulty,
		#         canvas_width=CANVAS_WIDTH,
		#         canvas_height=CANVAS_HEIGHT
		#     )
		# for consumer in consumer_data:
		#     self.connections.append(consumer)
		self.players = {
				self.left_player: Player('left', CANVAS_WIDTH, CANVAS_HEIGHT),
				self.right_player: Player('right', CANVAS_WIDTH, CANVAS_HEIGHT)
		}
		self.canvas_width = CANVAS_WIDTH
		self.canvas_height = CANVAS_HEIGHT
		self.ball = Ball(self.canvas_width, self.canvas_height)
		self.running = True
		self.game_over = False
		self.winner = -1

	#setter meant to be called by the server, right now used to concede games if the player refuses to rejoin
	#Also can be used to cancel a game with ABORTED
	def set_server_order(self, new_order):
		self.server_order = new_order
	
	async def receive_player_input(self, player_id, input):
#		logger.info("GameRoom: Received player input")
		if player_id in self.players:
			self.time_since_last_receive[player_id] = time.perf_counter()
			player = self.players[player_id]
			if input == "move_up":
				player.speed = -5
			elif input == "move_down":
				player.speed = 5
			elif input == "move_stop":
				player.speed = 0
			elif input == "idle":
				pass
#				logger.info(f"GameRoom: player input is idle for player: {player_id}")

	def update_players(self):
		for id in self.players:
			player = self.players[id]
			speed = player.speed
			if speed > 0:
				if player.y + PADDLE_HEIGHT == CANVAS_HEIGHT:
					continue
				if (player.y + PADDLE_HEIGHT) + speed >= CANVAS_HEIGHT:
					player.y += CANVAS_HEIGHT - (player.y + PADDLE_HEIGHT)
				else:
					player.y += speed
			else:
				if player.y == 0:
					continue
				if (player.y - speed <= 0):
					player.y += CANVAS_HEIGHT - player.y
				else:
					player.y += speed

	def check_collisions(self, player):
		d = dict()
		closestX = max(player.x, min(self.ball.x, player.x + PADDLE_WIDTH))
		closestY = max(player.y, min(self.ball.y, player.y + PADDLE_HEIGHT))
		distanceX = self.ball.x - closestX
		distanceY = self.ball.y - closestY
		distance = math.sqrt(distanceX ** 2 + distanceY ** 2)
		d['hasCollision'] = distance <= self.ball.radius
		d['isVertical'] = abs(distanceY) > abs(distanceX)
		d['distanceX'] = distanceX
		d['distanceY'] = distanceY
		return d

	def handle_player_collisions(self):
		for id in self.players:
			player = self.players[id]
			collision = self.check_collisions(player)
			if collision['hasCollision']:
				if (collision['isVertical']):
					self.ball.speedY *= -1
					if collision['distanceY'] > 0:
						self.ball.y = player.y + PADDLE_HEIGHT + self.ball.radius
					else:
						self.ball.y = player.y - self.ball.radius
				else:
					self.ball.speedX *= -1
					relativeIntersection = player.y + PADDLE_HEIGHT * 0.5 - self.ball.y
					normalizedIntersection = relativeIntersection / (PADDLE_HEIGHT * 0.5)
					self.ball.speedY = -normalizedIntersection * 5
					if collision['distanceX'] > 0:
						self.ball.x = player.x + PADDLE_WIDTH + self.ball.radius
					else:
						self.ball.x = player.x - self.ball.radius

	def _get_new_mmr(self, userMMR: int, oppMMR: int, match_outcome: int):
		E = 1 / (1 + 10**((oppMMR - userMMR)/400))
		return int(userMMR + 30 * (match_outcome - E))

	def record_match_result_sync(self, winner):
		try:
			match_outcome = 0 #rightplayer win
			if(winner == self.left_player):
				match_outcome = 1 #leftplayer win
			p1 = CustomUser.objects.get(id=self.left_player)
			p2 = CustomUser.objects.get(id=self.right_player)
			if (winner == self.left_player):
				match_outcome = 1
				p1.winCount += 1
				p2.lossCount += 1
			else :
				match_outcome = 0
				p2.winCount += 1
				p1.lossCount += 1
			p1MMR = p1.mmr
			p2mmr = p2.mmr
			p1.mmr = self._get_new_mmr(p1MMR, p2mmr, match_outcome)
			p2.mmr = self._get_new_mmr(p2mmr, p1MMR, 1 - match_outcome)
			match_result = MatchResults(
				p1=p1,
				p2=p2,
				matchOutcome=match_outcome,
			)
			p1.save()
			p2.save()
			match_result.save()
			print(f"Match result saved: {match_result}")
		except CustomUser.DoesNotExist:
			print("Error: One or both players not found.")

	async def declare_winner(self, winner):
		if self.server_order is CONCEDE:
			if self.dropped_side is LEFT:
				winner = self.right_player
			else:
				winner = self.left_player
			logger.info(f"gameRoom: player conceding match, winner is: {winner}")
		else:
			if self.players[self.left_player].score == 5:
				winner = "left"
			else:
				winner = "right"
		game_report = {
				'score_left': self.players[self.left_player].score,
				'score_right': self.players[self.right_player].score,
				'winner': winner
				}
		print(game_report)
		for connection in self.connections:
			await connection.send(json.dumps({
				'type': 'game_over',
				'payload': game_report
				}))
		if self.game_type["is_online"]:
			await sync_to_async(self.record_match_result_sync)(winner)

	def update_ball(self):
		self.ball.x += self.ball.speedX
		self.ball.y += self.ball.speedY
		if self.ball.y - self.ball.radius < 0 or self.ball.y + self.ball.radius > CANVAS_HEIGHT:
			self.ball.speedY *= -1
		if self.ball.x - self.ball.radius < 0 or self.ball.x + self.ball.radius > CANVAS_WIDTH:
			if self.ball.x - self.ball.radius < 0:
				self.players[self.right_player].score += 1
				if self.players[self.right_player].score == 5: #Edit this to extend the score before gameover is called
					self.winner = self.right_player
					self.game_over = True
				self.ball.x = CANVAS_WIDTH * 0.7
				self.ball.y = CANVAS_WIDTH * 0.5
			else:
				self.players[self.left_player].score += 1
				if self.players[self.left_player].score == 5: #Same here
					self.game_over = True
				self.ball.x = CANVAS_WIDTH * 0.3
				self.ball.y = CANVAS_WIDTH * 0.5

	async def send_update(self):
		game_state = {
				'players': {
						f'player{index + 1}': {
							'x': player.x,
							'y': player.y,
							'score': player.score,
						} for index, (player_id, player) in enumerate(self.players.items())
					},
				'ball': {
					'x': self.ball.x,
					'y': self.ball.y,
					'radius': self.ball.radius
					}
				}
		try:
			for connection in self.connections:
				await connection.send(json.dumps({
					'type': 'game_update',
					'payload': game_state,
					}))
		except Exception as e:
			logger.error(f"gameRoom: Could not send update to players: {e}")

	async def check_pulse(self):
		current_time = time.perf_counter()
#		logger.info("gameRoom: Took current_time")
		for player_id in self.players:
#			logger.info(f"gameRoom: {player_id} current_time: {current_time} time_since_last_receive: {self.time_since_last_receive[player_id]} ")
			if current_time - self.time_since_last_receive[player_id] > 1.5 and self.players[player_id].dropped is not True:
				self.players[player_id].dropped = True
				logger.info(f"gameRoom: Player: {player_id} has dropped out!")
				self.dropped_player = player_id
				if player_id == self.left_player:
					self.dropped_side = LEFT
				else:
					self.dropped_side = RIGHT
				self.missing_player += 1
				if self.game_type["is_ai"]:
					self.missing_player = 2

	async def player_rejoin(self, new_id, new_connection):
		if self.dropped_side == LEFT:
			self.left_player = new_id
			self.connections[0] = new_connection
		else:
			self.right_player = new_id
			self.connections[1] = new_connection
		self.missing_player = False
		self.players[new_id].dropped = False
		self.time_since_last_receive[self.left_player] = time.perf_counter()
		self.time_since_last_receive[self.right_player] = time.perf_counter()
		logger.info(f"gameRoom: Player has come back, new id: {new_id}")

	async def run(self):
		logger.info('gameRoom starting')
		logger.info(f"gameRoom: : {self.room_id}")
		try:
			for connection in self.connections:
				await connection.send(json.dumps({
					'type': 'game_start',
					'message': 'Game has started'
					}))
			for player_id in self.players:
				self.time_since_last_receive[player_id] = time.perf_counter()
			while self.running:
#				logger.info('gameRoom: Checking pulse of players')
				await self.check_pulse()
#				logger.info('gameRoom: Finished checking pulse of players')
				if self.missing_player:
					if self.missing_player == 2 or self.server_order is ABORTED:
						logger.info('gameRoom: No players left in room, aborting...')
						return ABORTED
#					logger.info('gameRoom: Missing player detected')
				self.update_players()
#				logger.info('gameRoom: updated players')
				self.handle_player_collisions()
#				logger.info('gameRoom: updated collisions')
				self.update_ball()
#				logger.info('gameRoom: updated ball')
				# Add AI logic
				if self.ai_player:
					ai_move = await self.ai_player.calculate_move(
						self.ball.x,
						self.ball.y,
						self.ball.speedX,
						self.ball.speedY
					)
					await self.receive_player_input(self.right_player, ai_move)
				if self.game_over or self.server_order is CONCEDE:
					logger.info('gameRoom: preparing gameover')
					await self.declare_winner(self.winner)
#					logger.info('gameRoom: done')
					return
				await self.send_update()
#				logger.info('gameRoom: sent update to clients')
				await asyncio.sleep(0.016)

		except Exception as e:
			logger.error(f"gameRoom: exception caught in run: {e}")
			return

