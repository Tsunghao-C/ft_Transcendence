import { gameLoop } from './gameDraw.js'

const canvas = document.getElementById('game');
var data = {
	playerId: -1,
	socket: -1,
	roomUID: -1
};

function createSocket() {
	try {
		//await getPlayerInfo(); hardcode player info for tests
		const socketUrl = `ws://localhost:8000/ws/game/`;
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

data.socket.onmessage = function (event) {
	try {
		const response = JSON.parse(event.data);
		if (response.type == 'notice') {
			console.log('Server notice: ' + response.message);
		}
		else if (response.type == 'room_creation') {
			console.error('Error: server created room');
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
			console.log(`Request to join room ${roomUID} sent.`);
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

document.addEventListener("DOMContentLoaded", function() {
	const joinMatchBtn = document.getElementById('joinMatchBtn');

	joinMatchBtn.addEventListener('click', function() {
		console.log("Joining match...");
		join_match();
	}); 
});

function join_match() {
	try {
		createSocket();
		joinRoom();
		waitForReady();
	} catch {
		console.error('Exception caught in joinMatch.js')
	}
}
