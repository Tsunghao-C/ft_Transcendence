
// size by default of the canvas is 300x150, it can be sized arbitrarily by CSS. If it appears distorted, best specify it in the <canvas> attribute and not the CSS
const canvas = document.getElementById('game');

if (canvas.getContext) {
	const ctx = canvas.getContext('2d');
	const Paddle_HEIGHT = 100;
	const Paddle_WIDTH = 20;
	let	ball = {x:canvas.width/2, y:canvas.height/2, color:'white', speedX:5, speedY:5, radius:10}; // could become class

	class Paddle {
		constructor (id, color) {
			if (id == 1)
			{
				this.x = canvas.width * 0.10;
				this.upKey = 'ArrowUp';
				this.downKey = 'ArrowDown';
			}
			else
			{
				this.x = canvas.width * 0.90;
				this.upKey = 'w';
				this.downKey = 's';
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
		}
	}

	const Player1 = new Player(1, 'red');
	const Player2 = new Player(2, 'green');

	document.addEventListener('keydown', function(event) {
		if (event.code == 'ArrowUp') {
				Player1.Paddle.speed = -5;
		}
		else if (event.code == 'ArrowDown') {
				Player1.Paddle.speed = 5;
		}
	});

	document.addEventListener('keyup', function(event) {
		if (event.code == 'ArrowUp' || event.code == 'ArrowDown')
			Player1.Paddle.speed = 0;
	});

	function updatePlayer(Player) {
		if (Player.Paddle.speed > 0)
		{
			if (Player.Paddle.y + Paddle_HEIGHT == canvas.height)	
				return ;
			if ((Player.Paddle.y + Paddle_HEIGHT) + Player.Paddle.speed >= canvas.height)
				Player.Paddle.y += canvas.height - (Player.Paddle.y + Paddle_HEIGHT);
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

	function checkHorizontalCollision(ballX, ballY, Player)
	{
		return (ballX <= Player.Paddle.x + Paddle_WIDTH &&
				ballX >= Player.Paddle.x &&
				ballY >= Player.Paddle.y &&
				ballY <= Player.Paddle.y + Paddle_HEIGHT);
	}

	function checkVerticalCollision(Player) {
		const horizontalOverlap =
			ball.x + ball.radius > Player.Paddle.x &&
			ball.x - ball.radius < Player.Paddle.x + Paddle_WIDTH;

		const topEdgeCollision =
			ball.y + ball.radius >= Paddle.y &&
			ball.y + ball.radius <= Paddle.y + ball.speedY;

		const bottomEdgeCollision =
			ball.y - ball.radius <= Paddle.y + Paddle_HEIGHT &&
			ball.y - ball.radius >= Paddle.y + Paddle_HEIGHT - ball.speedY;

		return (horizontalOverlap && (topEdgeCollision || bottomEdgeCollision));
	}
	
	function checkPlayerCollision(Player)
	{
		if (checkHorizontalCollision(ball.x + ball.radius * (-1 * (ball.speedX < 0)), ball.y + ball.radius * (-1 * ball.speedX < 0), Player) == true)
		{
			ball.speedX *= -1;
			let relativeIntersection = (Player.Paddle.y + (Paddle_HEIGHT * 0.5) - ball.y);
			let normalizedIntersection = relativeIntersection / (Paddle_HEIGHT * 0.5);
			ball.speedY = normalizedIntersection * 5;
		}
		else if (checkVerticalCollision(Player) == true)
			ball.speedY *= -1;
	}

	function updateBall() {
		ball.x += ball.speedX;
		ball.y += ball.speedY;
		if (ball.y - ball.radius < 0 || ball.y + ball.radius * (-1 * (ball.speedY < 0)) > canvas.height)
			ball.speedY *= -1;
		if (ball.x - ball.radius < 0 || ball.x + ball.radius * (-1 * (ball.speedX < 0)) > canvas.width)
			ball.speedX *= -1;
	}

	function gameLoop() {

		updatePlayer(Player1);
		updatePlayer(Player2);
		checkPlayerCollision(Player1);
		checkPlayerCollision(Player2);
		updateBall();
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = Player1.color;
		ctx.fillRect(Player1.Paddle.x, Player1.Paddle.y, Paddle_WIDTH, Paddle_HEIGHT);
		ctx.fillStyle = Player2.color;
		ctx.fillRect(Player2.Paddle.x, Player2.Paddle.y, Paddle_WIDTH, Paddle_HEIGHT);
		ctx.beginPath();
		ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
		ctx.fillStyle = ball.color;
		ctx.fill();
		ctx.closePath();

		requestAnimationFrame(gameLoop);
	}
	gameLoop();
}
