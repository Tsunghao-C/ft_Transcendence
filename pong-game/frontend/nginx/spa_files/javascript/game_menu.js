import { translations } from "./language_pack.js";
import { getLanguageCookie } from './fetch_request.js';

export function closeGameWebSocket() {
	console.log("The WebSocket should be closed");
}

export function setGameMenu(contentContainer, menu = "main") {
	contentContainer.innerHTML = "";

	const currentLanguage = localStorage.getItem("language");

	const menus = {
		main: [
			{ text: `${translations[currentLanguage].solo}`, hash: "game/solo" },
			{ text: `${translations[currentLanguage].multi}`, hash: "game/multiplayer" },
		],
		solo: [
			{ text: `${translations[currentLanguage].easy}`, hash: "game/solo/easy" },
			{ text: `${translations[currentLanguage].medium}`, hash: "game/solo/medium" },
			{ text: `${translations[currentLanguage].hard}`, hash: "game/solo/hard" },
			{ text: `${translations[currentLanguage].back}`, hash: "game/main" },
		],
		multiplayer: [
			{ text: `${translations[currentLanguage].local}`, hash: "game/local" },
			{ text: `${translations[currentLanguage].online}`, hash: "game/online" },
			{ text: `${translations[currentLanguage].back}`, hash: "game/main" },
		],
		local: [
			{ text: `${translations[currentLanguage].duel}`, hash: "game/local/duel" },
			{ text: `${translations[currentLanguage].tournament}`, hash: "game/local/tournament" },
			{ text: `${translations[currentLanguage].back}`, hash: "game/multiplayer" },
		],
		online: [
			{ text: `${translations[currentLanguage].quickMatch}`, hash: "game/online/quickMatch" },
			{ 
				text: `${translations[currentLanguage].duel}`, 
				hash: "game/online/duel", 
				action: () => setViews(contentContainer) // Ensure setViews is called
			},
			{ text: `${translations[currentLanguage].tournament}`, hash: "game/online/tournament" },
			{ text: `Join a room`, hash: "game/online/joinRoom" },
			{ text: `${translations[currentLanguage].back}`, hash: "game/multiplayer" },
		],
	};

	function createMenu(menuKey) {
		const menu = menus[menuKey];
		const menuContainer = document.createElement("div");
		menuContainer.className = "menu-container";

		menu.forEach((item) => {
			const button = document.createElement("button");
			button.textContent = item.text;
			button.className = "btn btn-primary mb-2";
			button.style.display = "block";
			button.style.margin = "10px auto";

			// Add hash change and optional action
			button.addEventListener("click", () => {
				if (item.action) {
					item.action(); // Call the action explicitly
				}
				window.location.hash = item.hash;
			});

			menuContainer.appendChild(button);
		});

		return menuContainer;
	}

	const menuView = createMenu(menu);
	contentContainer.appendChild(menuView);
}

function setViews(contentContainer) {
    contentContainer.innerHTML = `
        <div id="game-lobby" style="text-align: center;">
            <h1>Game Lobby</h1>
            <p>Select an option below to get started:</p>
            <div>
                <button id="create-match">Create Private Match</button>
                <button id="join-match">Join Match</button>
                <button id="ready-button" style="display:none;">Ready</button>
                <div id="game-info">Loading...</div>
                <div id="player-status" class="player-status"></div>
                <canvas id="game" width="800" height="600"></canvas>
            </div>
        </div>
    `;
	const canvas = document.getElementById('game');
		const token = localStorage.getItem('token'); //Is this stored there or in cookies!!!!
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
			playerId: -1,
			socket: -1,
			roomUID: -1
		};

		function connectWebSocket() {
            if (ws && ws.readyState === WebSocket.CONNECTING) {
                console.log('Connection already in progress...');
                return Promise.resolve();
            }
				return new Promise((resolve, reject) => {
				const gameId = 'test_game';
				const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
				const wsUrl = `${wsScheme}://${window.location.host}/ws/game-server/${gameId}/`;
				
				console.log('Connecting to WebSocket...')
				ws = new WebSocket(wsUrl);
				data.socket = ws

				ws.onopen = function() {
					console.log('WebSocket connected');
					gameInfo.textContent = 'Connected to game server...';
					if (wsReconnectTimer) {
						clearTimeout(wsReconnectTimer);
						wsReconnectTimer = null;
					}
					data.socket.onmessage = function (event) {
					//	console.log('Ws message received', event);
					//	console.log('Ws readyState:', data.socket.readyState);
						try {
							const response = JSON.parse(event.data);
							if (response.type == 'notice') {
								console.log('Server notice: ' + response.message);
							}
							else if (response.type == 'room_creation') {
								data.roomUID = response.room_name;
								createTextBox(data.roomUID);
								console.log('Room creation notice received');
								console.log('Room name: ' + data.roomUID);
							}
							else if (response.type == 'game_start') {
								console.log(response.message);
								startGame();
							}
							else if (response.type == 'error') {
								console.error('Error received:', response.message);
							}
							else if (response.type == 'game_update') {
								if (pendingGameUpdate) { 
									pendingGameUpdate(response.payload) 
									pendingGameUpdate = null;
								}
							}
							else if (response.type == 'game_over') {
								console.log('game_over received: ', response.payload);
								if (pendingGameUpdate) {
									pendingGameUpdate(response.payload);
									game_over = true;
									pendingGameUpdate = null;
								}
							}
							else if (response.error)
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
				await data.socket.send(JSON.stringify({
					type: 'player_input',
					player_id: data.playerId,
					input: playerEvent.type,
					game_roomID: data.roomUID
				}));	
				playerEvent.pending = false;
			}
			else {
				await data.socket.send(JSON.stringify({
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

		async function gameLoop(socket, playerData) {
			gameState = await getGameState();
//			console.log("gameState: ", gameState);
			if (game_over) {
				console.log('Drawing game_over...');
				drawGameOverScreen(gameState);
				game_over = false;
				return;
			}
			let player_1 = gameState.players.player_1;
			let player_2 = gameState.players.player_2;
			drawElements(gameState.ball, player_1, player_2);
			await sendEvents(socket, data.roomUID);
			requestAnimationFrame(gameLoop);
		}

		async function joinRoom() {
			// Create a modal container for the room join input
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
		
			// Create input and button with clearer, more compact styling
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
		
			// Append modal to body
			document.body.appendChild(modal);
		
			const roomUidInput = modal.querySelector('#room-uid-input');
			const joinRoomBtn = modal.querySelector('#join-room-btn');
		
			return new Promise((resolve, reject) => {
				joinRoomBtn.addEventListener('click', async () => {
					const roomUID = roomUidInput.value.trim();
		
					if (!roomUID) {
						alert('Please enter a valid Room UID.');
						return;
					}
		
					data.roomUID = roomUID;
					
					try {
						await data.socket.send(JSON.stringify({
							action: 'join_private_match',
							room_name: roomUID,
							id: data.playerId
						}));
						console.log(`Request to join room ${roomUID} sent.`);
						
						// Remove the modal after successful room join request
						document.body.removeChild(modal);
						resolve(roomUID);
					} catch (error) {
						console.error('Error joining room:', error);
						alert('Failed to join room. Please try again.');
						reject(error);
					}
				});
			});
		}
		

		function createReadyButton() {
			console.log("Creating ready button");
			readyButton = document.createElement('button');
			readyButton.id = 'ready-button';
			readyButton.textContent = 'Ready Up';
			readyButton.style.position = 'fixed';
			readyButton.style.bottom = '20px';
			readyButton.style.left = '50%';
			readyButton.style.transform = 'translateX(-50%)';
			readyButton.style.padding = '10px 20px';
			readyButton.style.fontSize = '16px';
			readyButton.style.cursor = 'pointer';
			document.body.appendChild(readyButton);
		}

		async function showReadyButton() {
			// Destruction du bouton précédent
			destroyReadyButton();
		
			// Création du bouton
			readyButton = document.createElement('button');
			readyButton.id = 'ready-button';
			readyButton.textContent = 'Ready Up';
			
			// Styles très visibles pour le débogage
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
		
			// Test multiple de l'attachement d'événement
			readyButton.onclick = function(event) {
				try {
					if (readyButton.disabled == false) {
						readyButton.textContent = 'Waiting for game start...';
						readyButton.disabled = true;

						data.socket.send(JSON.stringify({
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
		
			// Ajout au DOM avec vérification
			try {
				document.body.appendChild(readyButton);
				console.log('Ready button DEFINITELY added to DOM');
				
				// Vérification supplémentaire
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
//				readyButton.replaceWith(readyButton.cloneNode(true));
				readyButton.parentNode.removeChild(readyButton);
				readyButton.remove();
				readyButton = null;
			}
		}

		function createTextBox(content) {
			textBox = document.createElement('textarea');
			textBox.value = content;
			textBox.style.position = 'fixed';
			textBox.style.top = '50%';
			textBox.style.left = '50%';
			textBox.style.transform = 'translateX(-50%)';
			textBox.style.width = '300px';
			textBox.style.height = '100px';
			textBox.style.padding = '10px';
			textBox.style.fontSize = '16px';
			textBox.style.resize = 'none'; // Disable resizing
			textBox.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
			textBox.style.border = '1px solid #ccc';
			textBox.style.borderRadius = '5px';
			textBox.style.backgroundColor = '#f9f9f9';
			textBox.readOnly = true;
			document.body.appendChild(textBox);
		}

		async function requestRoom() {
			try {
				console.log("Requesting room")
				await data.socket.send(JSON.stringify({
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
				if (textBox) {
					textBox.remove();
					textBox = null;
				}
				gameLoop(data.socket, data);
			} catch {
				console.error('Exception caught in startGame', error);
			}
		}
	
		async function join_match() {
			try {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				data.playerId = 'player_2';
				
				await joinRoom();
				
				await showReadyButton();
			} catch (error) {
				console.error('Exception caught in joinMatch', error);
			}
		}
	
		async function create_private_match() {
			try {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				data.playerId = 'player_1'
				await requestRoom();
				console.log("Player_id: " + data.playerId);
				await showReadyButton()
//				await startGame()
			} catch (error){
				console.error('Exception caught in privateMatch.js', error);
			}
		}

		async function init(){
			gameState.player1 = new Player('0', 'green');
			gameState.player2 = new Player('1', 'red');
			await connectWebSocket();
		}

		
		document.getElementById('create-match').addEventListener('click', async () => {
		create_private_match()
	});
	
	document.getElementById('join-match').addEventListener('click', async () => {
		join_match()
	});
	
	init();
}


