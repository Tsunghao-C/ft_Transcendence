
// size by default of the canvas is 300x150, it can be sized arbitrarily by CSS. If it appears distorted, best specify it in the <canvas> attribute and not the CSS
const canvas = document.getElementById("game");

if (canvas.getContext) {
	const ctx = canvas.getContext("2d");
	let	ball = {x:canvas.width/2, y:canvas.height/2, color:'white', speedX:5, speedY:5, radius:10};
	let	paddle = {x:(canvas.width * 0.10), y:(canvas.height * 0.30), speed:0};
	const PADDLE_HEIGHT = 100;
	const PADDLE_WIDTH = 20;
	let player = {paddle:paddle, color:'red'};

	document.addEventListener('keydown', function(event) {
		if (event.code == 'ArrowUp') {
			if (player.paddle.y - 5 > 0)
				player.paddle.speed = -5;
			else
				player.paddle.speed = 0;
		}
		else if (event.code == 'ArrowDown') {
			if (player.paddle.y + PADDLE_HEIGHT < canvas.height)
				player.paddle.speed = 5;
			else
				player.paddle.speed = 0;
		}
	});

	document.addEventListener('keyup', function(event) {
		if (event.code == 'ArrowUp' || event.code == 'ArrowDown')
			player.paddle.speed = 0;
	});

	function gameLoop() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ball.x += ball.speedX;
		ball.y += ball.speedY;
		if (player.paddle.speed > 0)
		{
			if (player.paddle.y + PADDLE_HEIGHT == canvas.height)
				player.paddle.y += 0;
			else if (player.paddle.y + PADDLE_HEIGHT + 5 > canvas.height)
				player.paddle.y += canvas.height - player.paddle.y + PADDLE_HEIGHT;
			else
				player.paddle.y += player.paddle.speed;
		}
		else
		{
			if (player.paddle.y == 0)
				player.paddle.y += 0;
			else if (player.paddle.y - 5 < 0)
				player.paddle.y += canvas.height - player.paddle.y;
			else
				player.paddle.y += player.paddle.speed;
		}
		if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height)
			ball.speedY *= -1;
		if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width)
			ball.speedX *= -1;
		ctx.fillStyle = player.color;
		ctx.fillRect(player.paddle.x, player.paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);

		ctx.beginPath();
		ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
		ctx.fillStyle = ball.color;
		ctx.fill();
		ctx.closePath();

		requestAnimationFrame(gameLoop);
	}
	gameLoop();
}
