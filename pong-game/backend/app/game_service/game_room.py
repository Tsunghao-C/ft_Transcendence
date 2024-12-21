import math
import json
import asyncio
import httpx
import logging
from .ai_player import PongAI
from .models import MatchResults
from asgiref.sync import sync_to_async
from user_service.models import CustomUser


CANVAS_WIDTH = 800 #original value is 800, change it in case I fucked it up for tests
CANVAS_HEIGHT = 600
PADDLE_HEIGHT = 100
PADDLE_WIDTH = 15
BALL_RADIUS = 10

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
        self.room_id = "lobby_" + room_id
        self.connections = []
        self.left_player = user_data[0]
        self.right_player = user_data[1]
        self.game_type = game_type

        # Adding AI player logic
        self.ai_player = None
        if self.right_player == "ai_player":
            self.ai_player = PongAI(
                difficulty = daddyficulty,
                canvas_width=CANVAS_WIDTH,
                canvas_height=CANVAS_HEIGHT
            )
        for consumer in consumer_data:
            self.connections.append(consumer)
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

    async def receive_player_input(self, player_id, input):
        logger.info("GameRoom: Received player input")
        if player_id in self.players:
            player = self.players[player_id]
            if input == "move_up":
                player.speed = -5
            elif input == "move_down":
                player.speed = 5
            elif input == "move_stop":
                player.speed = 0
            elif input == "idle":
                logger.info(f"GameRoom: ID NOT FOUND, current players: {self.left_player} {self.right_player}")
                pass

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

    #need to write this with Ben

    def record_match_result_sync(self, winner):
        try:
            match_outcome = 1
            if(winner == self.left_player):
                match_outcome = 0
            p1 = CustomUser.objects.get(alias=self.left_player)
            p2 = CustomUser.objects.get(alias=self.right_player)
            match_result = MatchResults(
                p1=p1,
                p2=p2,
                matchOutcome=match_outcome,
            )
                
            match_result.save()
            print(f"Match result saved: {match_result}")
        except CustomUser.DoesNotExist:
            print("Error: One or both players not found.")

    async def declare_winner(self, winner):
        game_report = {
                'score_left': self.players[self.left_player].score,
                'score_right': self.players[self.right_player].score,
                'winner': winner
                }
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
                if self.players[self.right_player].score == 5:
                    self.winner = self.right_player
                    self.game_over = True
                self.ball.x = CANVAS_WIDTH * 0.7
                self.ball.y = CANVAS_WIDTH * 0.5
            else:
                self.players[self.left_player].score += 1
                if self.players[self.left_player].score == 5:
                    self.winner = self.left_player
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
        for connection in self.connections:
            await connection.send(json.dumps({
                'type': 'game_update',
                'payload': game_state,
                }))

    async def run(self):
        logger.info('gameRoom starting')
        logger.info(f"Room_id: {self.room_id}")
        try:
            for connection in self.connections:
                await connection.send(json.dumps({
                    'type': 'game_start',
                    'message': 'Game has started'
                    }))
            while self.running:
                self.update_players()
                logger.info('gameRoom updated players')
                self.handle_player_collisions()
                logger.info('gameRoom updated collisions')
                self.update_ball()
                logger.info('gameRoom updated ball')
                # Add AI logic
                if self.ai_player:
                    ai_move = await self.ai_player.calculate_move(
                        self.ball.x,
                        self.ball.y,
                        self.ball.speedX,
                        self.ball.speedY
                    )
                    await self.receive_player_input("ai_player", ai_move)

                if self.game_over:
                    logger.info('gameRoom preparing gameover')
                    await self.declare_winner(self.winner)
                    logger.info('gameRoom done')
                    return
                await self.send_update()
                logger.info('gameRoom sent update to clients')
                await asyncio.sleep(0.016)

        except Exception as e:
            logger.error(f"GameRoom initial group send error: {e}")
            return
