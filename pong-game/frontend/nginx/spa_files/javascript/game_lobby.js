import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from "./fetch_request.js";
import { getCookie } from "./fetch_request.js";
import { state } from "./app.js";
import { hideElem, hideClass, showElem } from "./utils.js";
import { drawElements, drawGameOverScreen } from "./game_utils.js";
import { translations as trslt } from "./language_pack.js";

export async function setLobbyView(contentContainer, roomID = "") {
	let response;
	let userData;
	let roomId;
	let gameState;
	try {
		response = await fetchWithToken('/api/user/getuser/');
		userData = await response.json();
		console.log("User data in lobby: ", userData);
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
		return;
	}

    const lng = localStorage.getItem("language");

	contentContainer.innerHTML = `
		<div class="gamelobby-view">
		<!-- <h2>Game Lobby</h2> -->
		<div id="game-lobby" class="gamelobby-view">
			<!-- <p>Select an option below to get started:</p> -->
				<button id="create-match">Create Private Match</button>
				<button id="join-match">Join Match</button>
				<button id="ready-button" style="display:none;">Ready</button>
				<button id="invite-button" style="display:none;"> > Invite a Player </button>
				<div id="player-info-container" style="display: flex; justify-content: space-between;">
					<div class="user-info" id="user-info-left" style="text-align: left; flex: 1; padding: 10px;"></div>
					<div class="user-info" id="user-info-right" style="text-align: left; flex: 1; padding: 10px;"></div>
				</div>
				<div id="game-info">Loading...</div>
				<div id="player-status" class="player-status"></div>
				<canvas id="game" width="800" height="600" style="display: none;"></canvas>
				<button id="go-back-EOG" style="display: none;">${trslt[lng].back}</button>
		</div>
	`;
	const canvas = document.getElementById('game');
	const token = getCookie("accessToken");
	const ctx = canvas.getContext('2d');
	const gameInfo = document.getElementById('game-info');
	let wsReconnectTimer = null;
	let pendingGameUpdate = null;
	let readyButton = null;
	let textBox = null;

	let playerEvent = {
		pending: false,
		type: -1,
	}
	var game_over = false;

	async function connectWebSocket() {
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
				action: 'player_input',
				input: playerEvent.type,
				game_roomID: roomId,
				local: false
			}));
			playerEvent.pending = false;
		}
		else {
			await state.gameSocket.send(JSON.stringify({
				action: 'player_input',
				input: 'idle',
				game_roomID: roomId,
				local: false
			}));
		}
	}

	async function getGameState()
	{
		return new Promise((resolve, reject) => {
			pendingGameUpdate = resolve;
			});
	}

	async function gameLoop(socket) {
		gameState = await getGameState();
		if (game_over) {
			console.log('Drawing game_over...');
			drawGameOverScreen(gameState);
			game_over = false;
			return;
		}
		let player_1 = gameState.players.player1;
		let player_2 = gameState.players.player2;
		drawElements(gameState.ball, player_1, player_2);
		await sendEvents(socket, roomId);
		requestAnimationFrame(gameLoop);
	}

	async function joinRoom(roomUID) {
		try {
			roomId = roomUID;

			await state.gameSocket.send(JSON.stringify({
				action: 'join_private_match',
				room_name: roomUID,
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
		readyButton.textContent = 'Start Game';
	
		readyButton.onclick = function(event) {
			try {
				if (readyButton.disabled == false) {
					readyButton.textContent = 'Waiting...';
					readyButton.disabled = true;

					state.gameSocket.send(JSON.stringify({
						action: 'player_ready',
						room_name: roomId,
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
		document.getElementById("game-lobby").appendChild(readyButton);
	}

	function destroyReadyButton() {
		if (readyButton) {
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
			}));
			console.log("Room requested")
		} catch (error) {
			console.error('Error sending room creation request: ', error);
		}
	}

	async function startGame() {
		try {
			destroyReadyButton();
			hideClass("hrs");
			hideElem("game-info");
			showElem("game", "block");
			showElem("go-back-EOG", "block");
			hideElem("invite-button");
			if (textBox) {
				textBox.remove();
				textBox = null;
			}
			gameLoop(state.gameSocket);
		} catch {
			console.error('Exception caught in startGame', error);
		}
	}
	
	function renderUserInfoLeft(user) {
		const userInfoDiv = document.getElementById("user-info-left");
		userInfoDiv.innerHTML = `
			<hr class="hrs">
			<h4>Player one</h4>
			<div style="display: flex; align-items: center; margin-bottom: 10px;">
				<img src="${user.avatar}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; margin-right: 10px;">
				<div>
					<p style="margin: 0; font-weight: bold;">${user.alias}</p>
					<p style="margin: 0; font-size: 0.8rem;">MMR: ${user.mmr}</p>
				</div>
			</div>
			<hr class="hrs">
		`;
	}	

	function renderUserInfoRight(user) {
		const userInfoDiv = document.getElementById("user-info-right");
		userInfoDiv.innerHTML = `
			<hr class="hrs">
			<h4 class="player-two">Player two</h4>
			<div style="display: flex; align-items: center; margin-bottom: 10px;">
				<div>
					<p style="margin: 0; font-weight: bold;">${user.alias}</p>
					<p style="margin: 0; font-size: 0.8rem;">MMR: ${user.mmr}</p>
				</div>
				<img src="${user.avatar}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; margin-left: 10px;">
			</div>
			<hr class="hrs">
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

	function renderUserInfo(user1, user2 = null) {
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

	async function create_private_match() {
		try {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			await requestRoom();
		} catch (error){
			console.error('Exception caught in privateMatch.js', error);
		}
	}

	async function init(){
		await connectWebSocket();
	}

	document.getElementById('create-match').addEventListener('click', async () => {
		create_private_match();
	});

	document.getElementById('join-match').addEventListener('click', async () => {
		const roomID = prompt("enter room Id you want to join");
		if (roomID) {
			window.location.hash = `lobby/${roomID}`;
		}			
	});

    document.getElementById('go-back-EOG').addEventListener('click', async () => {
        window.location.hash = "game/";
    });

	await init();
	if (roomID) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		await joinRoom(roomID);
	}
}

