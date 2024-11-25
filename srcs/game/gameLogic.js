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

export function checkCollision(paddle) {
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
