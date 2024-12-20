import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from "./fetch_request.js";
import { getCookie } from "./fetch_request.js";
import { state } from "./app.js";
import { hideElem } from "./utils.js";
import { showElem } from "./utils.js";

export async function setLobbyView(contentContainer, roomID = "") {
	let response;
	let userData
	try {
		response = await fetchWithToken('/api/user/getuser/');
		userData = await response.json();
		console.log("User data in lobby: ", userData);
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
		return;
	}
	contentContainer.innerHTML = `
		<div class="gamelobby-view">
		<!-- <h2>Game Lobby</h2> -->
		<div id="game-lobby" class="gamelobby-view">
			<!-- <p>Select an option below to get started:</p> -->
			<div>
				<button id="create-match">Create Private Match</button>
				<button id="join-match">Join Match</button>
				<button id="ready-button" style="display:none;">Ready</button>
				<button id="invite-button" style="display:none;"> > Invite a Player </button>
				<div id="player-info-container" style="display: flex; justify-content: space-between;">
					<div id="user-info-left" style="text-align: left; flex: 1; padding: 10px;"></div>
					<div id="user-info-right" style="text-align: left; flex: 1; padding: 10px;"></div>
				</div>
				<div id="game-info">Loading...</div>
				<div id="player-status" class="player-status"></div>
				<canvas id="game" width="800" height="600" style="display: none;"></canvas>
			</div>
		</div>
	`;
	const canvas = document.getElementById('game');
	const token = getCookie("accessToken");
	const PADDLE_HEIGHT = 100;
	const PADDLE_WIDTH = 15;
	const ctx = canvas.getContext('2d');
	const gameInfo = document.getElementById('game-info');
	const debugDiv = document.getElementById('debug');
	const playerStatus = document.getElementById('player-status');
	let playerId = null;
	let lastGameState = null;
	let ws = null;
	let wsReconnectTimer = null;
	let pendingGameUpdate = null;
	let pendingGameOver = null;
	let readyButton = null;
	let textBox = null;

	class Paddle {
		constructor (id, color) {
			this.id = id;
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

	let	ball = {
		x:canvas.width/2,
		y:canvas.height/2,
		color:'white',
		speedX:6,
		speedY:6,
		radius:10
	};

	let gameState = {
		ball: ball,
		player1: Player,
		player2: Player
	};

	let playerEvent = {
		pending: false,
		type: -1,
	}
	var game_over = false;
	var data = {
		playerId: "player2",
		socket: -1,
		roomUID: -1
	};

	async function connectWebSocket() {
		if (state.gameSocket) {
			return ;
		}
		if (ws && ws.readyState === WebSocket.CONNECTING) {
			console.log('Connection already in progress...');
			return Promise.resolve();
		}
			return new Promise((resolve, reject) => {
			const gameId = 'test_game';
			const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws'; // to change to wss
			const wsUrl = `${wsScheme}://${window.location.host}/ws/game-server/${gameId}/?token=${encodeURIComponent(token)}`;
			
			console.log('Connecting to WebSocket...')
			ws = new WebSocket(wsUrl);
			state.gameSocket = ws

			ws.onopen = function() {
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
								renderUserInfoLeft(player1Data.profile);
								renderUserInfoRight(player2Data.profile);
							} catch(error) {
								console.log(error);
								window.location.hash = "login";
								return;
							}
						} else if (response.type == 'room_creation') {
							data.roomUID = response.room_name;
							console.log('Room creation notice received');
							console.log('Room name: ' + data.roomUID);
							window.location.hash = `lobby/${data.roomUID}`;
						} else if (response.type == 'set_player_1') {
							let player1Data;
							let profileResponse;
							profileResponse = await fetchWithToken(`/api/user/get-profile/?alias=${response.alias}`);
							player1Data = await profileResponse.json();
							hideElem("create-match");
							hideElem("join-match");
							renderUserInfoLeft(player1Data.profile);
							renderEmptyUserInfoRight();
							data.playerId = 'player1';
							console.log("you are player1");
							const inviteButton = document.getElementById("invite-button");
    						inviteButton.style.display = "inline-block";
							inviteButton.addEventListener("click", async function() {
								const aliasToInvite = prompt("Enter the alias of the player you want to invite:");
								if (aliasToInvite) {
									try {
										const response = await fetchWithToken('/api/chat/create-invitation/', JSON.stringify({
											alias: aliasToInvite,
											roomId: data.roomUID,
										}), 'POST');
										if (!response.ok) {
											console.log(response);
											alert("Error: an error occured, please try again later");
										} else {
											alert("Invitation sent !");
										}
									} catch(error) {
										console.log(error);
										alert("Error: an error occured, please try again later");
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
				ws.onerror = function (error) {
					console.error('Websocker error', error);
					reject (new Error('Failed to connect Websocket'));

				};
			});
	}

	document.addEventListener('keydown', function(event) {
		if (event.code == 'ArrowUp') {
			playerEvent.pending = true;
			playerEvent.type = 'move_up';
		}
		else if (event.code == 'ArrowDown') {
			playerEvent.pending = true;
			playerEvent.type = 'move_down';
		}
	});

	document.addEventListener('keyup', function(event) {
		if (event.code == 'ArrowDown' || event.code == 'ArrowUp')
		{
			playerEvent.pending = true;
			playerEvent.type = 'move_stop'
		}
	});

	async function sendEvents(socket) {
		if (playerEvent.pending == true) {
			await state.gameSocket.send(JSON.stringify({
				type: 'player_input',
				player_id: data.playerId,
				input: playerEvent.type,
				game_roomID: data.roomUID
			}));	
			playerEvent.pending = false;
		}
		else {
			await state.gameSocket.send(JSON.stringify({
				type: 'player_input',
				player_id: data.playerId,
				input: 'idle',
				game_roomID: data.roomUID
			}));
		}
	}

	function drawElements(ball, player_1, player_2) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.font = '48px serif';
		ctx.textBaseline = 'hanging';
		ctx.fillStyle = 'white';
		ctx.fillText(player_1.score + " : " + player_2.score, canvas.width * 0.45, canvas.height * 0.10);
		ctx.fillStyle = player_1.color;
		ctx.fillRect(player_1.x, player_1.y, PADDLE_WIDTH, PADDLE_HEIGHT);
		ctx.fillStyle = player_2.color;
		ctx.fillRect(player_2.x, player_2.y, PADDLE_WIDTH, PADDLE_HEIGHT);
		ctx.beginPath();
		ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
		ctx.fillStyle = ball.color;
		ctx.fill();
		ctx.closePath();
	}

	function drawGameOverScreen(gameState) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.font = '48px serif';
		ctx.textBaseline = 'hanging';
		ctx.fillStyle = 'white';
		ctx.fillText("Game Over", canvas.width * 0.5, canvas.height * 0.30);
		ctx.fillText(gameState.score_left, canvas.width * 0.25, canvas.height * 0.50);
		ctx.fillText(gameState.score_right, canvas.width * 0.75, canvas.height * 0.50);
	}

	async function getGameState()
	{
		return new Promise((resolve, reject) => {
			pendingGameUpdate = resolve;
			});
	}

	async function gameLoop(socket) {
		gameState = await getGameState();
		// console.log("gameState: ", gameState);
		if (game_over) {
			console.log('Drawing game_over...');
			drawGameOverScreen(gameState);
			game_over = false;
			return;
		}
		let player_1 = gameState.players.player1;
		let player_2 = gameState.players.player2;
		drawElements(gameState.ball, player_1, player_2);
		await sendEvents(socket, data.roomUID);
		requestAnimationFrame(gameLoop);
	}

	async function joinRoom(roomUID) {
		try {
			data.roomUID = roomUID;
	
			await state.gameSocket.send(JSON.stringify({
				action: 'join_private_match',
				room_name: roomUID,
				id: data.playerId
			}));
			console.log(`Request to join room ${roomUID} sent.`);
			await showReadyButton();
		} catch (error) {
			console.error('Error joining room:', error);
			alert('Failed to join room. Please try again.');
			throw error;
		}
	}

	async function showReadyButton() {
		destroyReadyButton();
	
		readyButton = document.createElement('button');
		readyButton.id = 'ready-button';
		readyButton.textContent = 'Ready Up';
		
		readyButton.style.cssText = `
			position: fixed;
			bottom: 20px;
			left: 50%;
			transform: translateX(-50%);
			padding: 10px 20px;
			font-size: 16px;
			cursor: pointer;
			background-color: red;
			color: white;
			z-index: 1000;
			border: 3px solid yellow;
		`;
	
		readyButton.onclick = function(event) {
			try {
				if (readyButton.disabled == false) {
					readyButton.textContent = 'Waiting for game start...';
					readyButton.disabled = true;

					state.gameSocket.send(JSON.stringify({
						action: 'player_ready',
						room_name: data.roomUID,
						player_id: data.playerId
					}));
					console.log('Ready signal sent.');
				}
			} catch (error) {
				console.error('Error sending ready signal:', error);
				readyButton.disabled = false;
				readyButton.textContent = 'Ready Up'; // Revert state on error
				alert('Failed to send ready signal. Please try again.');
			}
		};
	
		readyButton.addEventListener('click', function(event) {
			console.log('addEventListener triggered');
			console.log('Event:', event);
		});
	
		try {
			document.body.appendChild(readyButton);
			console.log('Ready button DEFINITELY added to DOM');
			
			const button = document.getElementById('ready-button');
			if (button) {
				console.log('Button found in DOM');
			} else {
				console.error('Button NOT found in DOM');
			}
		} catch (error) {
			console.error('Error adding button to DOM:', error);
		}
	}

	function destroyReadyButton() {
		console.log("Trying to destroy ready buttons");
		if (readyButton) {
			console.log("Destroying ready buttons");
			readyButton.parentNode.removeChild(readyButton);
			readyButton.remove();
			readyButton = null;
		}
	}

	async function requestRoom() {
		try {
			console.log("Requesting room")
			await state.gameSocket.send(JSON.stringify({
				action: 'create_private_match',
				id: data.playerId
			}));
			console.log("Room requested")
		} catch (error) {
			console.error('Error sending room creation request: ', error);
		}
	}

	async function startGame() {
		try {
			destroyReadyButton();
			hideElem("invite-button");
			showElem("game", "block");
			if (textBox) {
				textBox.remove();
				textBox = null;
			}
			gameLoop(state.gameSocket, data);
		} catch {
			console.error('Exception caught in startGame', error);
		}
	}
	
	function renderUserInfoLeft(user) {
		const userInfoDiv = document.getElementById("user-info-left");
		userInfoDiv.innerHTML = `
			<hr>
			<h4>Player one</h4>
			<div style="display: flex; align-items: center; margin-bottom: 10px;">
				<img src="${user.avatar}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; margin-right: 10px;">
				<div>
					<p style="margin: 0; font-weight: bold;">${user.alias}</p>
					<p style="margin: 0;">MMR: ${user.mmr}</p>
				</div>
			</div>
			<hr>
		`;
	}	

	function renderUserInfoRight(user) {
		const userInfoDiv = document.getElementById("user-info-right");
		userInfoDiv.innerHTML = `
			<hr>
			<h4 class="player-two">Player two</h4>
			<div style="display: flex; align-items: center; margin-bottom: 10px;">
				<div>
					<p style="margin: 0; font-weight: bold;">${user.alias}</p>
					<p style="margin: 0;">MMR: ${user.mmr}</p>
				</div>
				<img src="${user.avatar}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; margin-left: 10px;">
			</div>
			<hr>
		`;
	}	

	function renderEmptyUserInfoRight() {
		const userInfoDiv = document.getElementById("user-info-right");
		userInfoDiv.innerHTML = `
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

	async function create_private_match() {
		try {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			await requestRoom();
		} catch (error){
			console.error('Exception caught in privateMatch.js', error);
		}
	}

	async function init(){
		gameState.player1 = new Player('0', 'green');
		gameState.player2 = new Player('1', 'red');
		await connectWebSocket();
		console.log("abruti");
	}
	
	function getRoomIDInput() {
		const modal = document.createElement('div');
		modal.id = 'room-join-modal';
		modal.style.position = 'fixed';
		modal.style.top = '50%';
		modal.style.left = '50%';
		modal.style.transform = 'translate(-50%, -50%)';
		modal.style.padding = '20px';
		modal.style.border = '1px solid #ccc';
		modal.style.borderRadius = '10px';
		modal.style.backgroundColor = '#f9f9f9';
		modal.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
		modal.style.zIndex = '1000';
	
		modal.innerHTML = `
			<h3>Join Game Room</h3>
			<input 
				type="text" 
				id="room-uid-input" 
				placeholder="Enter Room UID" 
				style="width: 100%; padding: 10px; margin-bottom: 10px; box-sizing: border-box;"
			>
			<button 
				id="join-room-btn" 
				style="width: 100%; padding: 10px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;"
			>
				Join Room
			</button>
		`;
	
		document.body.appendChild(modal);
	
		const roomUidInput = modal.querySelector('#room-uid-input');
		const joinRoomBtn = modal.querySelector('#join-room-btn');
	
		return new Promise((resolve, reject) => {
			joinRoomBtn.addEventListener('click', () => {
				const roomUID = roomUidInput.value.trim();
	
				if (!roomUID) {
					alert('Please enter a valid Room UID.');
					return;
				}
	
				document.body.removeChild(modal);
				resolve(roomUID);
			});
		});
	}	
	
	document.getElementById('create-match').addEventListener('click', async () => {
	create_private_match()
});
	
	document.getElementById('join-match').addEventListener('click', async () => {
		try {
			const roomID = await getRoomIDInput();
			window.location.hash = `lobby/${roomID}`;
		} catch (error) {
			console.error('Error in join-match event listener:', error);
		}
	});
	
	await init();
	if (roomID) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		await joinRoom(roomID);
	}
}


