import time
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

CANVAS_WIDTH = 800
CANVAS_HEIGHT = 600
PADDLE_HEIGHT = 100
PADDLE_WIDTH = 15

class Player():
    def __init__(self, player_id, side, canvas_width, canvas_height):
        self.player_id = player_id
        if side == 'left':
            self.x = canvas_width * 0.10
        elif side == 'right':
            self.x = canvas_width * 0.90
        self.y = canvas_height * 0.30
        self.speed = 0

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
        self.ball = {"x":self.canvas_width * 0.5, "y":self.canvas_height * 0.5, "speedX":5, "speedY":5}
        self.running = True

    def updatePlayers(self):
        receiveEvents(self.players_channels, )

    def run(self):
        while self.running:
            self.updatePlayers()
            self.checkCollissions()
            self.updateBall()
            self.sendUpdate()
            time.sleep(0.016)

export function updatePlayer(Player) {
	if (Player.Paddle.speed > 0)
	{
		if (Player.Paddle.y + PADDLE_HEIGHT == canvas.height)
			return ;
		if ((Player.Paddle.y + PADDLE_HEIGHT) + Player.Paddle.speed >= canvas.height)
			Player.Paddle.y += canvas.height - (Player.Paddle.y + PADDLE_HEIGHT);
		else
			Player.Paddle.y += Player.Paddle.speed;
	}
	else
	{
		if (Player.Paddle.y == 0)
			return ;
		if (Player.Paddle.y - Player.Paddle.speed <= 0)
			Player.Paddle.y += canvas.height - Player.Paddle.y;
		else
			Player.Paddle.y += Player.Paddle.speed;
	}
}

function checkCollision(paddle) {
	const closestX = Math.max(paddle.x, Math.min(ball.x, paddle.x + PADDLE_WIDTH));
	const closestY = Math.max(paddle.y, Math.min(ball.y, paddle.y + PADDLE_HEIGHT));
	
	const distanceX = ball.x - closestX;
	const distanceY = ball.y - closestY;
	const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
	
	return {
		hasCollision: distance <= ball.radius,
		isVertical: Math.abs(distanceY) > Math.abs(distanceX),
		distanceX: distanceX,
		distanceY: distanceY
	};
}

export function handlePaddleCollision(player) {
	const collision = checkCollision(player.Paddle);
	
	if (collision.hasCollision) {
		if (collision.isVertical) {
			ball.speedY *= -1;
			if (collision.distanceY > 0) {
				ball.y = player.Paddle.y + PADDLE_HEIGHT + ball.radius;
			} else {
				ball.y = player.Paddle.y - ball.radius;
			}
		} else {
			ball.speedX *= -1;
			let relativeIntersection = (player.Paddle.y + (PADDLE_HEIGHT * 0.5) - ball.y);
			let normalizedIntersection = relativeIntersection / (PADDLE_HEIGHT * 0.5);
			ball.speedY = -normalizedIntersection * 5;
			if (collision.distanceX > 0) {
				ball.x = player.Paddle.x + PADDLE_WIDTH + ball.radius;
			} else {
				ball.x = player.Paddle.x - ball.radius;
			}
		}
	}
}

export function updateBall() {
	ball.x += ball.speedX;
	ball.y += ball.speedY;
	if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height)
		ball.speedY *= -1;
	if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width)
	{
		if (ball.x - ball.radius < 0)
		{
			Player2.score++;
			ball.x = canvas.width * 0.7;
			ball.y = canvas.height * 0.5;
		}
		else
		{
			Player1.score++;
			ball.x = canvas.width * 0.3;
			ball.y = canvas.height * 0.5;
		}
	}
}
