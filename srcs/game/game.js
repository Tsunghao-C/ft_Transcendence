
// size by default of the canvas is 300x150, it can be sized arbitrarily by CSS. If it appears distorted, best specify it in the <canvas> attribute and not the CSS
const canvas = document.getElementById("game");
if (canvas.getContext) {
	const ctx = canvas.getContext("2d");
	let ball = {x:canvas.width/2, y:canvas.height/2, color:'white', speedX:5, speedY:5, radius:10};
	// let player = {x:, y:, color:}

	function gameLoop() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ball.x += ball.speedX;
		ball.y += ball.speedY;

		if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
			ball.speedY *= -1;
		}
		if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
			ball.speedX *= -1;
		}
		ctx.beginPath();
		ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
		ctx.fillStyle = ball.color;
		ctx.fill();
		ctx.closePath();

		requestAnimationFrame(gameLoop);
	}

	gameLoop();
}
