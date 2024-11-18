
// size by default of the canvas is 300x150, it can be sized arbitrarily by CSS. If it appears distorted, best specify it in the <canvas> attribute and not the CSS
const canvas = document.getElementById("game");

if (canvas.getContext) {
	const ctx = canvas.getContext("2d");
	let	ball = {x:canvas.width/2, y:canvas.height/2, color:'white', speedX:5, speedY:5, radius:10}; // could become class
	let	paddle = {x:(canvas.width * 0.10), y:(canvas.height * 0.30), speed:0};
	const PADDLE_HEIGHT = 100;
	const PADDLE_WIDTH = 20;
	let player = {paddle:paddle, color:'red'}; //to upgrade to class in the future

	document.addEventListener('keydown', function(event) {
		if (event.code == 'ArrowUp') {
				player.paddle.speed = -5;
		}
		else if (event.code == 'ArrowDown') {
				player.paddle.speed = 5;
		}
	});

	document.addEventListener('keyup', function(event) {
		if (event.code == 'ArrowUp' || event.code == 'ArrowDown')
			player.paddle.speed = 0;
	});

	function updatePlayer() {
		if (player.paddle.speed > 0)
		{
			if (player.paddle.y + PADDLE_HEIGHT == canvas.height)	
				return ;
			if ((player.paddle.y + PADDLE_HEIGHT) + player.paddle.speed >= canvas.height)
				player.paddle.y += canvas.height - (player.paddle.y + PADDLE_HEIGHT);
			else
				player.paddle.y += player.paddle.speed;
		}
		else
		{
			if (player.paddle.y == 0)
				return ;
			if (player.paddle.y - player.paddle.speed <= 0)
				player.paddle.y += canvas.height - player.paddle.y;
			else
				player.paddle.y += player.paddle.speed;
		}
	}
	
	function updateBall() {
		ball.x += ball.speedX;
		ball.y += ball.speedY;
		if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height)
			ball.speedY *= -1;
		if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width)
			ball.speedX *= -1;
		if (ball.x + ball.radius < player.paddle.x + PADDLE_WIDTH && ball.x + ball.radius > player.paddle.x)
			ball.speedX *= -1;
	}

	function gameLoop() {

		updatePlayer();
		updateBall();
		ctx.clearRect(0, 0, canvas.width, canvas.height);
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
