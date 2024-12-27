import { hideElem, hideClass, showElem, showClass } from "./utils.js";
import { state } from "./app.js";

// let readyButton = null;
// let textBox = null;
// let pendingGameUpdate = null;

const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 15;

export function drawElements(ball, player_1, player_2) {
	const canvas = document.getElementById('game');
	const ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.font = '48px Space Mono';
	ctx.textBaseline = 'hanging';
	ctx.fillStyle = 'black';

	// Score
	const scoreText = player_1.score + " : " + player_2.score;
	const textWidth = ctx.measureText(scoreText).width;
	ctx.fillText(scoreText, (canvas.width - textWidth) / 2, canvas.height * 0.10);

	// Player 1
	ctx.fillStyle = player_1.color;
	ctx.fillRect(player_1.x, player_1.y, PADDLE_WIDTH, PADDLE_HEIGHT);
	
	// Player 2
	ctx.fillStyle = player_2.color;
	ctx.fillRect(player_2.x, player_2.y, PADDLE_WIDTH, PADDLE_HEIGHT);
	
	// Ball
	ctx.fillStyle = ball.color;
	ctx.fillRect(ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
}

export function drawGameOverScreen(gameState) {
	const canvas = document.getElementById('game');
	const ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.font = '48px Space Mono';
	ctx.textBaseline = 'hanging';
	ctx.fillStyle = 'black';

	// Game Over
	const gameoverText = "Game Over";
	const gameoverTextWidth = ctx.measureText(gameoverText).width;
	ctx.fillText(gameoverText, (canvas.width - gameoverTextWidth) / 2, canvas.height * 0.50);
	
	// Score
	const scoreText = gameState.score_left + " : " + gameState.score_right;
	const scoreTextWidth = ctx.measureText(scoreText).width;
	ctx.fillText(scoreText, (canvas.width - scoreTextWidth) / 2, canvas.height * 0.10);
}

// function destroyReadyButton(readyButton) {
// 	console.log("Are we in destroy ?");
// 	console.log("readyButton is : ", readyButton);
// 	if (readyButton) {
// 		readyButton.parentNode.removeChild(readyButton);
// 		readyButton.remove();
// 		readyButton = null;
// 	}
// }

// async function getGameState(pendingGameUpdate) {
// 	return new Promise((resolve, reject) => {
// 		pendingGameUpdate = resolve;
// 		});
// }

// async function gameLoop(socket, pendingGameUpdate) {
// 	gameState = await getGameState(pendingGameUpdate);
// 	if (game_over) {
// 		console.log('Drawing game_over...');
// 		drawGameOverScreen(gameState);
// 		game_over = false;
// 		return;
// 	}
// 	let player_1 = gameState.players.player1;
// 	let player_2 = gameState.players.player2;
// 	drawElements(gameState.ball, player_1, player_2);
// 	await sendEvents(socket, roomId);
// 	requestAnimationFrame(gameLoop);
// }

// export async function startGame(readyButton, textBox, pendingGameUpdate) {
// 	try {
// 		console.log("we are in start game");
// 		destroyReadyButton(readyButton);
// 		hideElem("ready-button");
// 		hideClass("hrs");
// 		hideElem("game-info");
// 		showElem("game", "block");
// 		showElem("go-back-EOG", "block");
// 		if (textBox) {
// 			textBox.remove();
// 			textBox = null;
// 		}
// 		gameLoop(state.gameSocket, pendingGameUpdate);
// 	} catch (error) {
// 		console.error('Exception caught in startGame', error);
// 	}
// }

// export async function showReadyButton(readyButton, roomId, userData) {
// 	destroyReadyButton();

// 	readyButton = document.createElement('button');
// 	readyButton.id = 'ready-button';
// 	readyButton.textContent = 'Start Game';

// 	readyButton.onclick = function(event) {
// 		try {
// 			console.log("***********************");
// 			console.log ("roomId is : ", roomId);
// 			if (readyButton.disabled == false) {
// 				readyButton.textContent = 'Waiting...';
// 				readyButton.disabled = true;

// 				state.gameSocket.send(JSON.stringify({
// 					action: 'player_ready',
// 					room_name: roomId,
// 					player_id: userData.alias
// 				}));
// 				console.log('Ready signal sent.');
// 			}
// 		} catch (error) {
// 			console.error('Error sending ready signal:', error);
// 			readyButton.disabled = false;
// 			readyButton.textContent = 'Ready Up';
// 			alert('Failed to send ready signal. Please try again.');
// 		}
// 	};

// 	document.getElementById("game-lobby").appendChild(readyButton);
// }