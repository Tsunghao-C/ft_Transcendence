import { gameLoop } from './gameDraw.js'

const canvas = document.getElementById('game');
const token = localStorage.getItem('token'); //Is this stored there or in cookies!!!!
var data = {
	playerId: -1,
	socket: -1,
	roomUID: -1
}
//const token = document.cookie('token'); //need to tokenize it manually ???

function createSocket() {
	try {
		//await getPlayerInfo(); hardcode player info for tests
		const socketUrl = `ws://localhost:8000/ws/game/${roomId}/`;
		data.socket = new WebSocket(socketUrl);
		data.socket.onopen() = () => {
			console.log('Websocket connection established');
		};
		data.socket.onerror() = (error) => {
			console.log('Websocket error: ', error);
			throw error;
		};
		data.socket = socket;
	} catch (error) {
		throw error;
	}
};

async function getPlayerInfo() {
	try {
		const dbQuery = await fetch('http://django/api/user/getuser/', {
			method: 'GET',
			headers: {
				'Authorization' : `Bearer ${token}`,
				'Content-Type': 'application/json'
			}
		});
		if (!dbQuery.ok) {
			throw new Error('Failed to fetch player info');
			}
		const playerInfo = await dbQuery.json();
		return playerInfo;
	} catch (error) {
		console.error('Error fetching player info: ', error);
		throw error;
	}
}

async function requestRoom() {
	data.socket.send(JSON.stringify({
		action: 'create_private_match',
		player_id: data.playerId
	}));
}

data.socket.onmessage = function (event) {
	try {
		const response = JSON.parse(event.data);
		if (response.type == 'notice') {
			console.log('Server notice: ' + response.message)
		}
		else if (response.type == 'room_creation') {
			console.log('Room creation notice received')
			data.roomUID = response.room_name
		}
		else if (response.error)
			console.error(response.error)
	}
	catch (error) {
		console.error('Error processing server response:', error);
	}
}

async function setupLobby(socket) {
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
			setupLobby();
			const ctx = canvas.getContext('2d');
			gameLoop(ctx, data.socket, data);
		}
		else
			throw error;
	} catch {
		console.error('Exception caught in startGame');
	}
}

(async() => {
	try {
		createSocket();
		requestRoom();
		await setupGame();
		startGame();
	} catch {
		console.error('Exception caught in privateMatch.js');
	}
})();
