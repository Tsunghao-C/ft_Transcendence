export function setGameTestView(contentContainer) {
	contentContainer.innerHTML = `
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Game Lobby</title>
			<style>
			body {
				font-family: Arial, sans-serif;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				height: 100vh;
				margin: 0;
				background-color: #282c34;
				color: white;
			}

			h1 {
				margin-bottom: 20px;
			}

			button {
				padding: 10px 20px;
				margin: 10px;
				font-size: 16px;
				border: none;
				border-radius: 5px;
				cursor: pointer;
				background-color: #61dafb;
				color: #282c34;
				transition: background-color 0.3s;
			}

			button:hover {
				background-color: #21a1f1;
			}

			button:active {
				background-color: #0e86d4;
			}
			</style>
		</head>
		<body>
		<h1>Game Lobby</h1>
		<p>Select an option below to get started:</p>
		<div>
			<button id="create_private_match">Create Private Match</button>
			<button id="join_match">Join Match</button>
		</div>
		<canvas id="game" width="800" height="600"></canvas>

		</body>
		</html>`;

	const joinMatch = document.getElementById("join_match");
	const createMatch = document.getElementById("create_private_match");
	joinMatch.addEventListener("click", () => join_match());
	createMatch.addEventListener("click", () => create_private_match())

	const canvas = document.getElementById('game');
	const token = localStorage.getItem('token'); //Is this stored there or in cookies!!!!
	const PADDLE_HEIGHT = 100;
	const PADDLE_WIDTH = 15;

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

	var data = {
		playerId: -1,
		socket: -1,
		roomUID: -1
	};

	function createSocket() {
		try {
			//await getPlayerInfo(); hardcode player info for tests
			//		const roomName = "42";
			const socketUrl = 'ws://localhost:8000/ws/game/42'; //set room_name instead
			console.log(socketUrl);
			data.socket = new WebSocket(socketUrl);
			data.socket.onopen() = () => {
				console.log('Websocket connection established');
		};
		data.socket.onerror() = (error) => {
		console.error('Websocket error: ', error);
		throw error;
	};
	} catch (error) {
		throw error;
		}
	};


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

	function sendEvents(socket, playerData) {
		if (playerEvent.pending == true) {
			socket.send(JSON.stringify({
				type: 'player_input',
				player_id: playerData.playerId,
				input: playerEvent.type,
				game_roomID: playerData.roomUID
			}));	
			playerEvent.pending = false;
		}
		else {
			socket.send(JSON.stringify({
				type: 'player_input',
				player_id: playerData.playerId,
				input: 'idle',
				game_roomID: playerData.roomUID
			}));
		}
	}

	function drawElements(ball, Player1, Player2, ctx) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.font = '48px serif';
		ctx.textBaseline = 'hanging';
		ctx.fillStyle = 'white';
		ctx.fillText(Player1.score + " : " + Player2.score, canvas.width * 0.45, canvas.height * 0.10);
		ctx.fillStyle = Player1.color;
		ctx.fillRect(Player1.Paddle.x, Player1.Paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
		ctx.fillStyle = Player2.color;
		ctx.fillRect(Player2.Paddle.x, Player2.Paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
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

	async function getGameState(socket)
	{
		return new Promise((resolve, reject) => {
			socket.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data.type == 'game_update') {
						resolve(data.payload);
					}
					if (data.type == 'game_over')
					resolve (data.paylord);
				} catch (error) {
					console.error('Error parsing socker message in getElements: ', error);
					return(error);
				}
			};
			socket.onerror = (error) => {
				console.error('Websocket error: ', error);
			reject(error);
			}
		})
	}

	async function gameLoop(ctx, socket, playerData) {
		gameState = await getGameState(socket);
		if (gameState.type == 'game_over'){
			drawGameOverScreen(gameState);
			return; // end the loop ig???
		}
		drawElements(gameState.ball, gameState.player1, gameState.player2, ctx);
		sendEvents(socket, playerData, roomUID);
		requestAnimationFrame(gameLoop);
	}

	data.socket.onmessage = function (event) {
		try {
			const response = JSON.parse(event.data);
			if (response.type == 'notice') {
				console.log('Server notice: ' + response.message);
			}
			else if (response.type == 'room_creation') {
				data.roomUID = response.room_name;
				console.log('Room creation notice received');
				console.log('Room name: ' + data.roomUID);
			}
			else if (response.type == 'game_start') {
				console.log(response.message);
				startGame();
			}
			else if (response.error)
			console.error(response.error);
		}
		catch (error) {
			console.error('Error processing server response:', error);
		}
	}

	function joinRoom() {
		// Create a container for the input field and button
		const container = document.createElement('div');
		container.style.position = 'fixed';
		container.style.top = '50%';
		container.style.left = '50%';
		container.style.transform = 'translate(-50%, -50%)';
		container.style.padding = '20px';
		container.style.border = '1px solid #ccc';
		container.style.borderRadius = '10px';
		container.style.backgroundColor = '#f9f9f9';
		container.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
		container.style.textAlign = 'center';

		// Create the input field for the room UID
		const inputField = document.createElement('input');
		inputField.type = 'text';
		inputField.placeholder = 'Enter Room UID';
		inputField.style.marginBottom = '10px';
		inputField.style.padding = '10px';
		inputField.style.width = 'calc(100% - 20px)';
		inputField.style.boxSizing = 'border-box';
		inputField.style.fontSize = '16px';

		// Create the submit button
		const submitButton = document.createElement('button');
		submitButton.textContent = 'Join Room';
		submitButton.style.padding = '10px 20px';
		submitButton.style.fontSize = '16px';
		submitButton.style.cursor = 'pointer';

		// Append the input and button to the container
		container.appendChild(inputField);
		container.appendChild(document.createElement('br')); // Line break
		container.appendChild(submitButton);

		// Append the container to the body
		document.body.appendChild(container);

		// Handle button click
		submitButton.addEventListener('click', () => {
			const roomUID = inputField.value.trim();

			if (!roomUID) {
				alert('Please enter a valid Room UID.');
				return;
			}

			data.roomUID  = roomUID;
			// Send the join room request to the server
			try {
				data.socket.send(JSON.stringify({
					action: 'join_private_match',
					room_name: roomUID,
					id: data.playerId
				}));
				console.log('Room Id:', roomUID);
			} catch (error) {
				console.error('Error joining room:', error);
				alert('Failed to join room. Please try again.');
			} finally {
				// Remove the input container after submission
				document.body.removeChild(container);
			}
		});
	}

	async function waitForReady(socket) {
		const readyButton = document.getElementById('ready-button');
		readyButton.addEventListener('click', async () => {
			try {
				readyButton.disabled = true; //change this to switch state rather than disable
				readyButton.textContent = 'Waiting for game start...';
				socket.send(JSON.stringify({
					type: 'player_ready',
					player_id: data.playerId
				}));
				readyButton.classList.add('ready');
			} catch (error) {
				console.error('Could not set up lobby: ', error);
				throw error;
				// or just reenable the button and print an error for the user?
				// readyButton.disabled = false;
				// readyButton.textContent = 'Ready Up';
			}
		});
	}

	async function startGame() {
		try {
			if (canvas.getContext) {
				const ctx = canvas.getContext('2d');
				gameLoop(ctx, data.socket, data);
			}
			else
			throw error;
		} catch {
			console.error('Exception caught in startGame');
		}
	}

	function join_match() {
		try {
			createSocket();
		joinRoom();
			waitForReady();
		} catch {
			console.error('Exception caught in joinMatch.js')
		}
	}

	//const token = document.cookie('token'); //need to tokenize it manually ???
	async function requestRoom() {
		data.socket.send(JSON.stringify({
			action: 'create_private_match',
			player_id: data.playerId
		}));
	}

	async function startGame() {
		try {
			if (canvas.getContext) {
				const ctx = canvas.getContext('2d');
				gameLoop(ctx, data.socket, data);
			}
			else
			throw error;
		} catch {
			console.error('Exception caught in startGame');
		}
	}

	async function create_private_match() {
		try {
			createSocket();
			requestRoom();
			await waitForReady();
		} catch {
			console.error('Exception caught in privateMatch.js');
		}
	}
}
