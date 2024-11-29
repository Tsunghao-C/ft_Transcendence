//const canvas = document.getElementById('game');

const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 15;

class Paddle {
	constructor (id, color) {
		if (id == 1) {
			this.x = canvas.width * 0.10;
			this.upKey = 'ArrowUp';
			this.downKey = 'ArrowDown';
		}
		else {
			this.x = canvas.width * 0.90;
			this.upKey = 'KeyW';
			this.downKey = 'KeyS';
		}
		this.y = canvas.height * 0.30;
		this.speed = 0;
		this.color = color;
	}
}

class Player {
	constructor (id, color) {
		this.id = id;
		this.color = color;
		this.Paddle = new Paddle(id, color);
		this.score = 0;
	}
}

let	ball = {
	x:canvas.width/2,
	y:canvas.height/2,
	color:'white',
	speedX:6,
	speedY:6,
	radius:10
};

let gameState = {
	ball: ball,
	player1: Player,
	player2: Player
};

let playerEvent = {
	pending: false,
	type: -1,
}

document.addEventListener('keydown', function(event) {
	if (event.code == 'ArrowUp') {
		playerEvent.pending = true;
		playerEvent.type = 'up';
	}
	else if (event.code == 'ArrowDown') {
		playerEvent.pending = true;
		playerEvent.type = 'down';
	}
});

document.addEventListener('keyup', function(event) {
	if (event.code == 'ArrowDown' || event.code == 'ArrowUp')
	{
	 	playerEvent.pending = true;
		playerEvent.type = 'stop'
	}
});

function sendEvents(socket, playerData) {
	if (playerEvent.pending == true)
	{
		socket.send(JSON.stringify({
				type: 'player_input',
				player_id: playerData.playerId,
				input: playerEvent.type,
				game_roomID: playerData.roomUID
		}));	
		playerEvent.pending = false;
	}
}

function drawElements(ball, Player1, Player2, ctx) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	//		ctx.font = '48px serif';
	//		ctx.textBaseline = 'hanging';
	//		ctx.fillStyle = 'white';
	ctx.fillText(Player1.score + " : " + Player2.score, canvas.width * 0.45, canvas.height * 0.10);
	ctx.fillStyle = Player1.color;
	ctx.fillRect(Player1.Paddle.x, Player1.Paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
	ctx.fillStyle = Player2.color;
	ctx.fillRect(Player2.Paddle.x, Player2.Paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
	ctx.beginPath();
	ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
	ctx.fillStyle = ball.color;
	ctx.fill();
	ctx.closePath();
}

async function getGameState(socket)
{
	return new Promise((resolve, reject) => {
		socket.send(JSON.stringify({ type: 'get_game_state'}));
		socket.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type == 'game_state') {
					resolve(data.payload);
				}
			} catch (error) {
				console.error('Error parsing socker message in getElements: ', error);
				return(error);
			}
		};
		socket.onerror = (error) => {
			console.error('Websocket error: ', error);
			reject(error);
		}
	})
}

export async function gameLoop(ctx, socket, playerData) {
	gameState = await getGameState(socket);
	drawElements(gameState.ball, gameState.player1, gameState.player2, ctx);
	sendEvents(socket, playerData, roomUID);
	requestAnimationFrame(gameLoop);
}
gameLoop();
