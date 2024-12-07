import math
import json
import asyncio
import httpx
import logging
from asgiref.sync import async_to_sync

CANVAS_WIDTH = 800
CANVAS_HEIGHT = 600
PADDLE_HEIGHT = 100
PADDLE_WIDTH = 15
BALL_RADIUS = 10

logger = logging.getLogger(__name__)
class Player():
    def __init__(self, player_id, side, canvas_width, canvas_height):
        self.player_id = player_id
        if side == 'left':
            self.x = canvas_width * 0.10
        elif side == 'right':
            self.x = canvas_width * 0.90
        self.y = canvas_height * 0.30
        self.speed = 0
        self.score = 0

    def get_speed(self):
        return self.speed

    def set_speed(self, value):
        self.speed = value

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
    def __init__(self, room_id, player_channel, players):
        self.room_id = "lobby_" + room_id
        self.player_channel = player_channel
        self.players = {
                players[0]: Player(players[0], 'left', CANVAS_WIDTH, CANVAS_HEIGHT),
                players[1]: Player(players[1], 'right', CANVAS_WIDTH, CANVAS_HEIGHT)
        }
        self.canvas_width = CANVAS_WIDTH
        self.canvas_height = CANVAS_HEIGHT
        self.ball = Ball(self.canvas_width, self.canvas_height)
        self.running = True
        self.game_over = False
        self.winner = -1

    async def receive_player_input(self, player_id, input):
        logger.info("GameRoom: Received player input")
        if player_id in self.players:
            player = self.players[player_id]
            if input == "move_up":
                player.set_speed(-5)
            elif input == "move_down":
                player.set_speed(5)
            elif input == "move_stop":
                player.set_speed(0)
            elif input == "idle":
                pass

    def update_players(self):
        for player_id, player in self.players.items():
            speed = player.get_speed()
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
        for player_id, player in self.players.items():
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

    async def send_report_to_db(self, winner):
        game_report = {
                "p1ID": self.players[0],
                "p2ID": self.players[1],
                "matchOutcome": winner
                }
        backend_url = "http://the-backend-here"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(backend_url, json=game_report)
                response.raise_for_status()
                print(f"Report succesfully sent. Reponse: {response.text}")
        except httpx.HTTPStatusError as exc:
            print(f"Error response {exc.response.status_code}: {exc.response.text}")
        except Exception as e:
            print(f"An error occurred: {e}")

    async def declare_winner(self, winner):
        game_report = {
                'score_left': self.players[0].score,
                'score_right': self.players[1].score,
                'winner': self.players[winner].player_id
                }
        message = json.dumps(game_report)
        await self.player_channel.group_send(
                self.room_id,
                {
                    'type': 'game_message',
                    'update_type': 'game_over',
                    'payload': game_report,
                    'message': message
                })
        await self.send_report_to_db(winner) # send json post with "p1ID" and "p2ID" and matchOutcome, set matchOutcome to 0 for p0 victory or 1 for p1 victory
        await asyncio.sleep(10)

    def update_ball(self):
        self.ball.x += self.ball.speedX
        self.ball.y += self.ball.speedY
        if self.ball.y - self.ball.radius < 0 or self.ball.y + self.ball.radius > CANVAS_HEIGHT:
            self.ball.speedY *= -1
        if self.ball.x - self.ball.radius < 0 or self.ball.x + self.ball.radius > CANVAS_WIDTH:
            if self.ball.x - self.ball.radius < 0:
                self.players[1].score += 1
                if self.players[1].score == 5:
                    self.winner = 1
                    self.game_over = True
                self.ball.x = CANVAS_WIDTH * 0.7
                self.ball.y = CANVAS_WIDTH * 0.5
            else:
                self.players[0].score += 1
                if self.players[0].score == 5:
                    self.winner = 0
                    self.game_over = True
                self.ball.x = CANVAS_WIDTH * 0.3
                self.ball.y = CANVAS_WIDTH * 0.5

    async def send_update(self):
        game_state = {
                'players': {
                    player_id: {
                        'x': player.x,
                        'y': player.y,
                        'score': player.score,
                        } for player_id, player in self.players.items()
                    },
                'ball': {
                    'x': self.ball.x,
                    'y': self.ball.y,
                    'radius': self.ball.radius
                    }
                }
        message = json.dumps(game_state)
        await self.player_channel.group_send(
                self.room_id,
                {
                    'type': 'game_message',
                    'update_type': 'game_update',
                    'payload': game_state,
                    'message': message
                })

    async def run(self):
        logger.info('gameRoom starting')
        logger.info(f"Room_id: {self.room_id}")
        logger.info(f"Player_channel: {self.player_channel}")
        try:
            message = 'Game has started'
            await self.player_channel.group_send(
                    self.room_id,
                    {
                        'type': 'game_message',
                        'update_type': 'game_start',
                        'payload': None,
                        'message': message
                    })
        except Exception as e:
            logger.error(f"GameRoom initial group send error: {e}")
            return
        logger.info('gameRoom started, messages sent')
        while self.running:
            self.update_players()
            logger.info('gameRoom updated players')
            self.handle_player_collisions()
            logger.info('gameRoom updated collisions')
            self.update_ball()
            logger.info('gameRoom updated ball')
            if self.game_over:
                logger.info('gameRoom preparing gameover')
                await self.declare_winner(self.winner)
                logger.info('gameRoom done')
                return 
            await self.send_update()
            logger.info('gameRoom sent update to clients')
            await asyncio.sleep(0.016)
