import { hideElem, hideClass, showElem } from "./utils.js";
import { getCookie } from "./fetch_request.js";
import { state } from "./app.js";
import { fetchWithToken } from "./fetch_request.js";


// let readyButton = null;
// let textBox = null;
// let pendingGameUpdate = null;

let game_over = false;
let pendingGameUpdate = null;
let roomId;
let is_local = false;
export let playerEvent = {
    player_1: {
        pending: false,
        type: -1,
        id: null
    }
};

const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 15;

function drawElements(ball, player_1, player_2) {
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

function drawGameOverScreen(gameState) {
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

export function destroyReadyButton(readyButton) {
	if (readyButton) {
		readyButton.parentNode.removeChild(readyButton);
		readyButton.remove();
		readyButton = null;
	}
}

async function getGameState(pendingGameUpdate) {
	return new Promise((resolve, reject) => {
		pendingGameUpdate = resolve;
		});
}

export async function gameLoop() {
	const gameState = await getGameState(pendingGameUpdate);
	if (game_over) {
		console.log('Drawing game_over...');
		drawGameOverScreen(gameState);
		game_over = false;
		return;
	}
	let player_1 = gameState.players.player1;
	let player_2 = gameState.players.player2;
	drawElements(gameState.ball, player_1, player_2);
	await sendEvents();
	requestAnimationFrame(gameLoop);
}

export async function showReadyButton(roomId, alias) {
	destroyReadyButton();

	const readyButton = document.createElement('button');
	readyButton.id = 'ready-button';
	readyButton.textContent = 'Start Game';

	readyButton.onclick = function(event) {
		try {
			console.log("***********************");
			console.log ("roomId is : ", roomId);
			if (readyButton.disabled == false) {
				readyButton.textContent = 'Waiting...';
				readyButton.disabled = true;

				state.gameSocket.send(JSON.stringify({
					action: 'player_ready',
					room_name: roomId,
					player_id: alias
				}));
				console.log('Ready signal sent.');
			}
		} catch (error) {
			console.error('Error sending ready signal:', error);
			readyButton.disabled = false;
			readyButton.textContent = 'Ready Up';
			alert('Failed to send ready signal. Please try again.');
		}
	};

	document.getElementById("game-lobby").appendChild(readyButton);
}

async function sendEvents(socket) {
	if (playerEvent.player_1.pending == true) {
		await state.gameSocket.send(JSON.stringify({
			action: 'player_input',
			player_id: userData.alias,
			input: playerEvent.player_1.type,
			game_roomID: roomId,
			local: false
		}));
		playerEvent.player_1.pending = false;
	}
	else {
		await state.gameSocket.send(JSON.stringify({
			action: 'player_input',
			player_id: userData.alias,
			input: 'idle',
			game_roomID: roomId,
			local: false
		}));
	}
}

export function handlePlayerEvent(event) {
	if (event.type === 'keydown') {
		if (event.code === 'ArrowUp') {
			playerEvent.player_1.pending = true;
			playerEvent.player_1.type = 'move_up';
		} else if (event.code === 'ArrowDown') {
			playerEvent.player_1.pending = true;
			playerEvent.player_1.type = 'move_down';
		}
	} else if (event.type === 'keyup') {
		if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
			playerEvent.player_1.pending = true;
			playerEvent.player_1.type = 'move_stop';
		}
	}
}	

export function renderUserInfo(user1, user2 = null) {
	const userInfoLeftDiv = document.getElementById("user-info-left");
	userInfoLeftDiv.innerHTML = `
		<hr class="hrs">
		<h4>Player one</h4>
		<div style="display: flex; align-items: center; margin-bottom: 10px;">
			<img src="${user1.avatar}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; margin-right: 10px;">
			<div>
				<p style="margin: 0; font-weight: bold;">${user1.alias}</p>
				<p style="margin: 0; font-size: 0.8rem;">MMR: ${user1.mmr}</p>
			</div>
		</div>
		<hr class="hrs">
	`;
	const userInfoRightDiv = document.getElementById("user-info-right");
	if (user2) {
		userInfoRightDiv.innerHTML = `
			<hr class="hrs">
			<h4 class="player-two">Player two</h4>
			<div style="display: flex; align-items: center; margin-bottom: 10px;">
				<div>
					<p style="margin: 0; font-weight: bold;">${user2.alias}</p>
					<p style="margin: 0; font-size: 0.8rem;">MMR: ${user2.mmr}</p>
				</div>
				<img src="${user2.avatar}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; margin-left: 10px;">
			</div>
			<hr class="hrs">
		`;
	} else {
		userInfoRightDiv.innerHTML = `
			<hr>
			<h4 class="player-two">Player two</h4>
			<div style="display: flex; align-items: center; margin-bottom: 10px;">
				<div>
					<p style="margin: 0; font-weight: bold;">Waiting...</p>
				</div>
				<img src="/media/default.jpg" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; margin-left: 10px;">
			</div>
			<hr>
		`;
	}
}

export async function connectWebSocket() {
	const token = getCookie("accessToken");
	const gameInfo = document.getElementById('game-info');
	let wsReconnectTimer = null;

	if (state.gameSocket) {
		return ;
	}
	if (state.gameSocket && state.gameSocket.readyState === WebSocket.CONNECTING) {
		console.log('Connection already in progress...');
		return Promise.resolve();
	}
		return new Promise((resolve, reject) => {
		const gameId = 'test_game';
		const wsScheme = 'wss';
		const wsUrl = `${wsScheme}://${window.location.host}/ws/game-server/${gameId}/?token=${encodeURIComponent(token)}`;

		console.log('Connecting to WebSocket...')
		state.gameSocket = new WebSocket(wsUrl);

		state.gameSocket.onopen = function() {
			console.log('WebSocket connected');
			resolve();
			gameInfo.textContent = '• Connected';
			if (wsReconnectTimer) {
				clearTimeout(wsReconnectTimer);
				wsReconnectTimer = null;
			}
			state.gameSocket.onmessage = async function (event) {
			//	console.log('Ws message received', event);
			//	console.log('Ws readyState:', state.gameSocket.readyState);
				try {
					const response = JSON.parse(event.data);
					if (response.type == 'notice') {
						console.log('Server notice: ' + response.message);
					} else if (response.type == 'join' || (response.type == 'rejoin')) {
						let player1Data;
						let player2Data;
						let profileResponse;
						console.log('player1 alias', response.player1, "and player2 alias", response.player2);
						try {
							profileResponse = await fetchWithToken(`/api/user/get-profile/?alias=${response.player1}`);
							player1Data = await profileResponse.json();
							profileResponse = await fetchWithToken(`/api/user/get-profile/?alias=${response.player2}`);
							player2Data = await profileResponse.json();
							hideElem("create-match");
							hideElem("join-match");
							renderUserInfo(player1Data.profile, player2Data.profile);
							// renderUserInfoLeft(player1Data.profile);
							// renderUserInfoRight(player2Data.profile);
						} catch(error) {
							console.log(error);
							window.location.hash = "login";
							return;
						}
					} else if (response.type == 'room_creation') {
						roomId = response.room_name;
						console.log('Room creation notice received');
						console.log('Room name: ' + roomId);
						window.location.hash = `lobby/${roomId}`;
					} else if (response.type == 'ai_room_creation') {
						roomId = response.room_name;
						console.log('Room creation notice received');
						console.log('Room name: ' + roomId);
					} else if (response.type == 'set_player_1') {
						let player1Data;
						let profileResponse;
						profileResponse = await fetchWithToken(`/api/user/get-profile/?alias=${response.alias}`);
						player1Data = await profileResponse.json();
						hideElem("create-match");
						hideElem("join-match");
						// renderUserInfoLeft(player1Data.profile);
						// renderEmptyUserInfoRight();
						renderUserInfo(player1Data.profile, null);
						console.log("you are player1");
						const inviteButton = document.getElementById("invite-button");
						inviteButton.style.display = "inline-block";
						inviteButton.addEventListener("click", async function() {
							const aliasToInvite = prompt("Enter the alias of the player you want to invite:");
							if (aliasToInvite) {
								try {
									const response = await fetchWithToken('/api/chat/create-invitation/', JSON.stringify({
										alias: aliasToInvite,
										roomId: roomId,
									}), 'POST');
									if (!response.ok) {
										console.log(response);
										alert("Error: an error occured, please try again later");
									} else {
										alert("Invitation sent !");
									}
								} catch(error) {
									console.log(error);
									window.location.hash = "login";
								}
							}
						});
					} else if (response.type == 'game_start') {
						console.log(response.message);
						startGame();
					} else if (response.type == 'error') {
						console.error('Error received:', response.message);
					} else if (response.type == 'game_update') {
						if (pendingGameUpdate) {
							pendingGameUpdate(response.payload)
							pendingGameUpdate = null;
						}
					} else if (response.type == 'game_over') {
						console.log('game_over received: ', response.payload);
						if (pendingGameUpdate) {
							pendingGameUpdate(response.payload);
							game_over = true;
							pendingGameUpdate = null;
						}
					} else if (response.error)
						console.error(response.error);
				}
				catch (error) {
					console.error('Error processing server response:', error);
				}
			}
			};
			state.gameSocket.onerror = function (error) {
				console.error('Websocker error', error);
				reject (new Error('Failed to connect Websocket'));

			};
		});
}

// async function startGame() {
// 	try {
// 		destroyReadyButton();
// 		hideClass("hrs");
// 		hideElem("game-info");
// 		showElem("game", "block");
// 		showElem("go-back-EOG", "block");
// 		hideElem("invite-button");
// 		gameLoop(roomId);
// 	} catch (error) {
// 		console.error('Exception caught in startGame', error);
// 	}
// }
// AI game
async function startGame() {
	try {
		console.log("we are in start game");
		destroyReadyButton();
		hideClass("hrs");
		hideElem("game-info");
		showElem("game", "block");
		showElem("go-back-EOG", "block");
		if (textBox) {
			textBox.remove();
			textBox = null;
		}
		gameLoop(state.gameSocket);
	} catch (error) {
		console.error('Exception caught in startGame', error);
	}
}

function renderLocalUsers(user1, user2) {
	const userInfoDiv = document.getElementById("user-info-left");
	userInfoDiv.innerHTML = `
		<hr class="hrs">
		<h4>Player one</h4>
		<div style="display: flex; align-items: center; margin-bottom: 10px;">
			<div>
				<p style="margin: 0; font-weight: bold;">${user1}</p>
			</div>
		</div>
		<hr class="hrs">
	`;
	const aiInfoDiv = document.getElementById("user-info-right");
	aiInfoDiv.innerHTML = `
		<hr class="hrs">
		<h4 class="player-two">Player two</h4>
		<div style="display: flex; align-items: center; justify-content: right; margin-bottom: 10px;">
			<div>
				<p style="margin: 0; text-align: right; font-size: 0.8rem;">Mode: ${user2}</p>
			</div>
		</div>
		<hr class="hrs">
	`;
	// showElem("user-info-left", "block");
	// showElem("user-info-right", "block");
}