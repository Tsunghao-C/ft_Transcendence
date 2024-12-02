export function closeGameWebSocket() {
	console.log("the websocket should be closed");
}

export function setGameView(contentContainer) {
	contentContainer.innerHTML = "";
	const canvas = document.createElement('canvas');
	canvas.id = 'game';
	canvas.width = 1000;
	canvas.height = 100;
	canvas.style.backgroundColor = 'black';
	canvas.style.display = 'block';
	canvas.style.margin = '0 auto';
	contentContainer.appendChild(canvas);

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

	function updatePlayer(Player) {
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

	function handlePaddleCollision(player) {
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

	function updateBall() {
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
//			ball.speedX *= -1;
		}
	}

	function gameLoop() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.font = '48px serif';
		ctx.textBaseline = 'hanging';
		ctx.fillStyle = 'white';
		ctx.fillText(Player1.score + " : " + Player2.score, canvas.width * 0.45, canvas.height * 0.10);
		updatePlayer(Player1);
		updatePlayer(Player2);
		handlePaddleCollision(Player1);
		handlePaddleCollision(Player2);
		updateBall();
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

	}
