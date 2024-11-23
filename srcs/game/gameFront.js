const canvas = document.getElementById('game');

const socket = new WebSocket('ws://gameServer:port');  // current address for backend is localhost:8004
// Query backend for available rooms and use that for the url
// query client for auth token and use that as argument to url maybe? We will need to validate tho right?
//wss for prod with SSL //get Ben to setup url for game_path


if (canvas.getContext) {
	const ctx = canvas.getContext('2d');
	const PADDLE_HEIGHT = 100;
	const PADDLE_WIDTH = 15;
	const PADDLE_SPEED = 5;
	let	ball = {x:canvas.width/2, y:canvas.height/2, color:'white', speedX:6, speedY:6, radius:10};

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

	const Player1 = new Player(1, 'red');
	const Player2 = new Player(2, 'green');

	document.addEventListener('keydown', function(event) {
		if (event.code == Player1.Paddle.upKey) {
				Player1.Paddle.speed = -PADDLE_SPEED;
		}
		else if (event.code == Player1.Paddle.downKey) {
				Player1.Paddle.speed = PADDLE_SPEED;
		}
		else if (event.code == Player2.Paddle.upKey) {
				Player2.Paddle.speed = -PADDLE_SPEED;
		}
		else if (event.code == Player2.Paddle.downKey) {
				Player2.Paddle.speed = PADDLE_SPEED;
		}
	});

	document.addEventListener('keyup', function(event) {
		if (event.code == Player1.Paddle.upKey || event.code == Player1.Paddle.downKey)
			Player1.Paddle.speed = 0;
		else if (event.code == Player2.Paddle.upKey || event.code == Player2.Paddle.downKey)
			Player2.Paddle.speed = 0;
	});

	
	
	function gameLoop() {
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
		requestAnimationFrame(gameLoop);
	}
	gameLoop();
}
