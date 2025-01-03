import { hideElem, hideClass, showElem } from "./utils.js";
import { getCookie } from "./fetch_request.js";
import { state } from "./app.js";
import { fetchWithToken } from "./fetch_request.js";
import { submitMatchResult } from "./game_tournament.js";


// let readyButton = null;
// let textBox = null;
// let pendingGameUpdate = null;

let game_over = false;
let pendingGameUpdate = null;
let roomId;
let typeOfGame;
let isTournament;

export let TournamentPlayers = {
	player1: {
		alias: "none",
		id: -1
	},
	player2: {
		alias: "none",
		id: -1
	}
}
export let playerEvent = {
    player_1: {
        pending: false,
        type: -1,
        id: null
    },
	player_2: {
        pending: false,
        type: -1,
        id: null
    }
};

export function setIsTournament(isTournamentValue) {
	isTournament = isTournamentValue;
}

export function setTypeOfGame(gameType) {
	typeOfGame	= gameType;
}

export function setRoomId(roomIdToJoin) {
	roomId = roomIdToJoin;
}

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
	if (!canvas)
		return;
	const ctx = canvas.getContext('2d');
	if (!ctx)
		return;
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

async function getGameState() {
	return new Promise((resolve, reject) => {
		pendingGameUpdate = resolve;
		});
}

export async function gameLoop() {
	const gameState = await getGameState();
	if (game_over) {
		console.log('Drawing game_over...');
		drawGameOverScreen(gameState);
		game_over = false;
		return;
	}
	let player_1 = gameState.players.player1;
	let player_2 = gameState.players.player2;
	drawElements(gameState.ball, player_1, player_2);
	if (typeOfGame === "local") {
		await sendLocalEvents();
	} else {
		await sendEvents();
	}
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

async function sendEvents() {
	if (playerEvent.player_1.pending == true) {
		await state.gameSocket.send(JSON.stringify({
			action: 'player_input',
			player_id: playerEvent.player_1.id,
			input: playerEvent.player_1.type,
			game_roomID: roomId,
			local: false
		}));
		playerEvent.player_1.pending = false;
	}
	else {
		await state.gameSocket.send(JSON.stringify({
			action: 'player_input',
			player_id: playerEvent.player_1.id,
			input: 'idle',
			game_roomID: roomId,
			local: false
		}));
	}
}

async function sendLocalEvents() {
	for (const property in playerEvent) {
		if (playerEvent[property].pending == true) {
			await state.gameSocket.send(JSON.stringify({
				action: 'player_input',
				player_id: playerEvent[property].id,
				input: playerEvent[property].type,
				game_roomID: roomId,
				local: true
			}));
			playerEvent[property].pending = false;
		}
		else {
			await state.gameSocket.send(JSON.stringify({
				action: 'player_input',
				player_id: playerEvent[property].id,
				input: 'idle',
				game_roomID: roomId,
				local: true
			}));
		}
	}
}

// export function handlePlayerEvent(event) {
// 	if (event.type === 'keydown') {
// 		if (event.code === 'ArrowUp') {
// 			playerEvent.player_1.pending = true;
// 			playerEvent.player_1.type = 'move_up';
// 		} else if (event.code === 'ArrowDown') {
// 			playerEvent.player_1.pending = true;
// 			playerEvent.player_1.type = 'move_down';
// 		}
// 	} else if (event.type === 'keyup') {
// 		if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
// 			playerEvent.player_1.pending = true;
// 			playerEvent.player_1.type = 'move_stop';
// 		}
// 	}
// }

function handleKeyDownOnePlayer(event) {
    if (event.code === 'ArrowUp') {
        playerEvent.player_1.pending = true;
        playerEvent.player_1.type = 'move_up';
    } else if (event.code === 'ArrowDown') {
        playerEvent.player_1.pending = true;
        playerEvent.player_1.type = 'move_down';
    }
}

function handleKeyUpOnePlayer(event) {
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
        playerEvent.player_1.pending = true;
        playerEvent.player_1.type = 'move_stop';
    }
}

function handleKeyDownTwoPlayers(event) {
    if (event.code === 'KeyW') {
        playerEvent.player_1.pending = true;
        playerEvent.player_1.type = 'move_up';
    } else if (event.code === 'KeyS') {
        playerEvent.player_1.pending = true;
        playerEvent.player_1.type = 'move_down';
    } else if (event.code === 'ArrowUp') {
        playerEvent.player_2.pending = true;
        playerEvent.player_2.type = 'move_up';
    } else if (event.code === 'ArrowDown') {
        playerEvent.player_2.pending = true;
        playerEvent.player_2.type = 'move_down';
    }
}

function handleKeyUpTwoPlayers(event) {
    if (event.code === 'KeyW' || event.code === 'KeyS') {
        playerEvent.player_1.pending = true;
        playerEvent.player_1.type = 'move_stop';
    } else if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
        playerEvent.player_2.pending = true;
        playerEvent.player_2.type = 'move_stop';
    }
}

function removeAllEventListeners() {
    document.removeEventListener('keydown', handleKeyDownOnePlayer);
    document.removeEventListener('keyup', handleKeyUpOnePlayer);
    document.removeEventListener('keydown', handleKeyDownTwoPlayers);
    document.removeEventListener('keyup', handleKeyUpTwoPlayers);
}

export function setUpOnePlayerControl() {
    removeAllEventListeners();
    document.addEventListener('keydown', handleKeyDownOnePlayer);
    document.addEventListener('keyup', handleKeyUpOnePlayer);
}

export function setUpTwoPlayersControl() {
    removeAllEventListeners();
    document.addEventListener('keydown', handleKeyDownTwoPlayers);
    document.addEventListener('keyup', handleKeyUpTwoPlayers);
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
			<div style="display: flex; align-items: center; justify-content: right; margin-bottom: 10px;">
				<div>
					<p style="margin: 0; font-weight: bold; text-align: right;">${user2.alias}</p>
					<p style="margin: 0; font-size: 0.8rem; text-align: right;">MMR: ${user2.mmr}</p>
				</div>
				<img src="${user2.avatar}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; margin-left: 10px;">
			</div>
			<hr class="hrs">
		`;
	} else {
		userInfoRightDiv.innerHTML = `
			<hr>
			<h4 class="player-two">Player two</h4>
			<div style="display: flex; align-items: center; justify-content: right; margin-bottom: 10px;">
				<div>
					<p style="margin: 0; font-weight: bold;text-align: right;">Waiting...</p>
				</div>
				<img src="/media/default.jpg" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; margin-left: 10px;">
			</div>
			<hr>
		`;
	}
}

const onmessage_methods = {
	'notice': log_notice,
	'room_creation': register_room,
	'ai_room_creation': register_ai_room,
	'local_room_creation': register_local_room,
	'set_player_1': set_player1,
	'join': join_room,
	'rejoin': join_room,
	'rejoin_room_query': rejoin_room,
	'game_start': start_game,
	'game_update': update_game,
	'game_over': set_game_over,
	'error': log_error
}

async function log_notice(response) {
	console.log('Server notice: ' + response.message);
}

async function register_room(response) {
	roomId = response.room_name;
	console.log('Room creation notice received');
	console.log('Room name: ' + roomId);
	window.location.hash = `lobby/${roomId}`;
}

async function register_ai_room(response) {
	roomId = response.room_name;
	console.log('AI Room creation notice received');
	console.log('Room name: ' + roomId);
	if (isTournament) {
		renderLocalUsers(TournamentPlayers.player1.alias, TournamentPlayers.player2.alias);
	} else {
		renderLocalUsers(response.player1_alias, "CPU [" + response.difficulty + "]");
	}
	await showReadyButton(roomId, playerEvent.player_1.id);
}

async function register_local_room(response) {
	console.log('Local Room creation notice received');
	console.log('Room name: ' + roomId);
	roomId = response.room_name;
	playerEvent.player_2.id = response.player2_id;
	if (isTournament) {
		renderLocalUsers(TournamentPlayers.player1.alias, TournamentPlayers.player2.alias);
	} else {
		renderLocalUsers(response.player1_alias, "Guest");
	}
	await showReadyButton(roomId, playerEvent.player_1.id);
}

async function set_player1(response) {
	let player1Data;
	let profileResponse;
	profileResponse = await fetchWithToken(`/api/user/get-profile/?own=yes`);
	player1Data = await profileResponse.json();
	hideElem("create-match");
	hideElem("join-queue");
	hideElem("go-back");
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
}

async function start_game(response) {
	console.log(response.message);
	startGame();
}

async function update_game(response) {
	if (pendingGameUpdate) {
			pendingGameUpdate(response.payload)
			pendingGameUpdate = null;
	}
}

async function set_game_over(response) {
	console.log('game_over received: ', response.payload);
	if (pendingGameUpdate) {
		pendingGameUpdate(response.payload);
		game_over = true;
		pendingGameUpdate = null;
	}
	if (isTournament) {
		submitMatchResult(TournamentPlayers.player1.id, TournamentPlayers.player2.id, response.payload.winner)
	}
}

async function log_error(response) {
	console.error('Error received:', response.message);
}

async function join_room(response) {
	let player1Data;
	let player2Data;
	let profileResponse;
	console.log('player1 alias', response.player1, "and player2 alias", response.player2);
	try {
		profileResponse = await fetchWithToken(`/api/user/get-profile/?uid=${response.player1}`);
		player1Data = await profileResponse.json();
		profileResponse = await fetchWithToken(`/api/user/get-profile/?uid=${response.player2}`);
		player2Data = await profileResponse.json();
		hideElem("create-match");
		hideElem("join-queue");
		hideElem("go-back");
		renderUserInfo(player1Data.profile, player2Data.profile);
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
		return;
	}
}

async function rejoin_room(response) {
	console.log('Paused gameRoom found');
	console.log('Rejoining room (Hardcoded rn XD)');
	roomId = response.room_name;
	await state.gameSocket.send(JSON.stringify({
		action: "rejoin_room",
		response: true //change this from true to false and vice versa to test rejoining rooms
	}));
	console.log("Starting gameLoop directly in rejoin_room_query branch")
	await startGame();
}

export async function connectWebSocket() {
	const token = getCookie("accessToken");
	const gameInfo = document.getElementById('game-info');
	let wsReconnectTimer = null;

	if (state.gameSocket) {
		state.gameSocket.close();
		state.gameSocket = null;
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
				try {
					const response = JSON.parse(event.data);
					if (response.type in onmessage_methods)
						await onmessage_methods[response.type](response);
					else if (response.error)
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

async function startGame() {
	try {
		destroyReadyButton();
		hideElem("ready-button");
		showElem("game", "block");
		showElem("go-back-EOG", "block");
		hideClass("hrs");
		hideElem("game-info");
		if (typeOfGame !== "local") {
			if (typeOfGame == "online") {
				hideElem("invite-button");
			}
		}
		gameLoop(roomId);	
	} catch (error) {
		console.error('Exception caught in startGame', error);
	}
}

export function renderLocalUsers(user1, user2) {
	const userInfoDiv = document.getElementById("user-info-left");
	userInfoDiv.innerHTML = `
		<hr class="hrs">
		<h4>Player one</h4>
		<div style="display: flex; align-items: center; margin-bottom: 10px;">
			<div>
				<p style="margin: 0; padding: 0; font-weight: bold;">${user1}</p>
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
				<p style="margin: 0; padding: 0; font-weight: bold; text-align: right;">${user2}</p>
			</div>
		</div>
		<hr class="hrs">
	`;
	showElem("user-info-left", "block");
	showElem("user-info-right", "block");
}

export function goBackButtonEventListener(location) {
	document.getElementById('go-back-EOG').addEventListener('click', async () => {
        window.location.hash = location;
    });
}