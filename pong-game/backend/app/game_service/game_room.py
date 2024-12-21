import math
import json
import asyncio
import httpx
import time
import logging
from .ai_player import PongAI

CANVAS_WIDTH = 800 #original value is 800, change it in case I fucked it up for tests
CANVAS_HEIGHT = 600
PADDLE_HEIGHT = 100
PADDLE_WIDTH = 15
BALL_RADIUS = 10
LEFT = 0
RIGHT = 1

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
    def __init__(self, room_id, user_data, consumer_data, notification_queue, daddyficulty= ""):
        self.room_id = "lobby_" + room_id
        self.connections = []
        self.left_player = user_data[0]
        self.right_player = user_data[1]
        self.time_since_last_receive = {}
        self.missing_player = True
        self.notification_queue = notification_queue

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
            self.time_since_last_receive[player_id] = time.perf_counter()
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
                'score_left': self.players[self.left_player].score,
                'score_right': self.players[self.right_player].score,
                'winner': winner
                }
        for connection in self.connections:
            await connection.send(json.dumps({
                'type': 'game_over',
                'payload': game_report
                }))
#        await self.send_report_to_db(winner) # send json post with "p1ID" and "p2ID" and matchOutcome, set matchOutcome to 0 for p0 victory or 1 for p1 victory
#        await asyncio.sleep(1)

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

    def check_pulse(self):
        current_time = time.perf_counter()
        for player_id in self.players:
            if self.time_since_last_receive[player_id] - current_time > 1:
                self.dropped_player = player_id
                if player_id == self.left_player:
                    self.dropped_side = LEFT
                else:
                    self.dropped_side = RIGHT
                self.missing_player = True

    def player_comeback(self, new_id):
        if self.dropped_side == LEFT:
            self.left_player = new_id
        else:
            self.right_player = new_id
        self.missing_player = False
        logger.info(f"gameRoom: Player has come back, new id: {new_id}")

    def wait_for_player_rejoin(self):
        timeout_counter = time.perf_counter()
        while True:
            time.sleep(5)
            if not self.missing_player:
                logger.info("gameRoom: Resuming game")
                break
            current_time = time.perf_counter()
            if timeout_counter - current_time > 30:
                logger.info("gameRoom: timing out!")
                return 405

    async def run(self):
        logger.info('gameRoom starting')
        logger.info(f"gameRoom: room_id: {self.room_id}")
        try:
            for connection in self.connections:
                await connection.send(json.dumps({
                    'type': 'game_start',
                    'message': 'Game has started'
                    }))
            for player_id in self.players:
                self.time_since_last_receive[player_id] = time.perf_counter()
            while self.running:
                logger.info('gameRoom: Checking pulse of players')
                self.check_pulse()
                if self.missing_player:
                    self.wait_for_player_rejoin()
                self.update_players()
                logger.info('gameRoom: updated players')
                self.handle_player_collisions()
                logger.info('gameRoom: updated collisions')
                self.update_ball()
                logger.info('gameRoom: updated ball')
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
                    logger.info('gameRoom: preparing gameover')
                    await self.declare_winner(self.winner)
                    logger.info('gameRoom: done')
                    return
                await self.send_update()
                logger.info('gameRoom: sent update to clients')
                await asyncio.sleep(0.016)

        except Exception as e:
            logger.error(f"gameRoom: initial group send error: {e}")
            return
