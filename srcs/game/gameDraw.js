//const canvas = document.getElementById('game');
// Query backend for available rooms and use that for the url
// query client for auth token and use that as argument to url maybe? We will need to validate tho right?
//wss for prod with SSL //get Ben to setup url for game_path

const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 15;
const PADDLE_SPEED = 5;

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

const DOWN = 0;
const UP = 1;

let playerEvent = {
	pending: false,
	type: -1,
}

const Player1 = new Player(1, 'red');
const Player2 = new Player(2, 'green');

document.addEventListener('keydown', function(event) {
	if (event.code == 'ArrowUp') {
		playerEvent.pending = true;
		playerEvent.type = UP;
	}
	else if (event.code == 'ArrowDown') {
		playerEvent.pending = true;
		playerEvent.type = DOWN;
	}
});

//document.addEventListener('keyup', function(event) {
//	if (event.code == 'ArrowDown' || event.code == 'ArrowUp')
//	 	playerEvent.pending = false;
//});

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

function sendEvents(socket, playerData) {
	if (playerEvent.pending == true)
	{
		socket.send(JSON.stringify({
				type: 'player_ready',
				player_id: playerData.playerId
		}));	
		playerEvent.pending = false;
	}
}

export function gameLoop(ctx, socket) {
	gameState = getElements(socket);
	drawElements(gameState.ball, gameState.player1, gameState.player2, ctx);
	sendEvents(socket, playerData);
	requestAnimationFrame(gameLoop);
}
gameLoop();
