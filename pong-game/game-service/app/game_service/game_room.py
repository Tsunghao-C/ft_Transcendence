import time
import math
import json
import asyncio
import threading
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

CANVAS_WIDTH = 800
CANVAS_HEIGHT = 600
PADDLE_HEIGHT = 100
PADDLE_WIDTH = 15
BALL_RADIUS = 10

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
        self.speed_lock = threading.Lock()

    def get_speed(self):
        with self.speed_lock:
            return self.speed

    def set_speed(self, value):
        with self.speed_lock:
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
    def __init__(self, room_id, player_channels):
        self.room_id = room_id
        self.channel_layer = get_channel_layer()
        self.player_channels = player_channels
        self.players = {
                player_channels[0]: Player(player_channels[0], 'left', CANVAS_WIDTH, CANVAS_HEIGHT),
                player_channels[1]: Player(player_channels[1], 'right', CANVAS_WIDTH, CANVAS_HEIGHT)
        }
        self.canvas_width = CANVAS_WIDTH
        self.canvas_height = CANVAS_HEIGHT
        self.ball = Ball(self.canvas_width, self.canvas_height)
        self.running = True

    async def receive_player_inputs(self, player_id, input):
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
        for player in self.players:
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

    def handle_collisions(self):
        for player in self.players:
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


    def update_ball(self):
        self.ball.x += self.ball.speedX
        self.ball.y += self.ball.speedY
        if self.ball.y - self.ball.radius < 0 or self.ball.y + self.ball.radius > CANVAS_HEIGHT:
            self.ball.speedY *= -1
        if self.ball.x - self.ball.radius < 0 or self.ball.x + self.ball.radius > CANVAS_WIDTH:
            if self.ball.x - self.ball.radius < 0:
                self.players[1].score += 1
                self.ball.x = CANVAS_WIDTH * 0.7
                self.ball.y = CANVAS_WIDTH * 0.5
            else:
                self.players[0].score += 1
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
        for player_channel in self.player_channels:
            await async_to_sync(self.channel_layer.send)(
                    player_channel,
                    {
                        'type': 'game_update',
                        'payload': game_state,
                        'game_state': json.dumps(game_state)
                        }
                    )

    async def run(self):
        while self.running:
            self.update_players()
            self.handle_collisions()
            self.update_ball()
            await self.send_update()
            await asyncio.sleep(0.016)
