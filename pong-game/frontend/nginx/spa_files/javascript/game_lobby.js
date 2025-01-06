import { fetchWithToken } from "./fetch_request.js";
import { state } from "./app.js";
import { showReadyButton, setUpOnePlayerControl, connectWebSocket, playerEvent, setRoomId, setTypeOfGame } from "./game_utils.js";
import { translations as trsl } from "./language_pack.js";

export async function setLobbyView(contentContainer, roomID = "") {
	let response;
	let userData;
	let roomId;
	try {
		response = await fetchWithToken('/api/user/getuser/');
		userData = await response.json();
		playerEvent.player_1.id = userData.id;
		console.log("User data in lobby: ", userData);
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
		return;
	}

	const lng = localStorage.getItem("language");

	contentContainer.innerHTML = `
		<div class="gamelobby-view">
			<div id="game-lobby" class="gamelobby-view">
				<button id="join-queue">${trsl[state.language].quickMatch}</button>
				<button id="create-match">${trsl[state.language].createPrivate}</button>
				<button id="go-back">${trsl[state.language].backButton}</button>
				<button id="invite-button" style="display:none;">${trsl[state.language].invitePlayer}</button>
				<div id="player-info-container" style="display: flex; justify-content: space-between;">
					<div class="user-info" id="user-info-left" style="text-align: left; flex: 1; padding: 10px;"></div>
					<div class="user-info" id="user-info-right" style="text-align: left; flex: 1; padding: 10px;"></div>
				</div>
				<div id="game-info">${trsl[state.language].loading}</div>
				<canvas id="game" width="800" height="600" style="display: none;"></canvas>
				<button id="go-back-EOG" style="display: none;">${trsl[state.language].backButton}</button>
			</div>
		</div>
	`;
	const canvas = document.getElementById('game');
	const ctx = canvas.getContext('2d');


	document.getElementById('join-queue').addEventListener('click', async () => {
		try {
			console.log("Trying to join queue room");

			const gameInfo = document.getElementById('game-info');
			gameInfo.innerHTML = `
				<p id="queue-timer" styles="margin: 0 !important;">${trsl[state.language].waiting} 0s</p>
			`;

			let timeInQueue = 0;
			const timerInterval = setInterval(() => {
				const queueTimerElement = document.getElementById('queue-timer');
				if (queueTimerElement) {
					queueTimerElement.textContent = `${trsl[state.language].waiting} ${timeInQueue}s`;
					timeInQueue += 1;
				} else {
					clearInterval(timerInterval);
				}
			}, 1000);

			await state.gameSocket.send(JSON.stringify({
				action: 'join_queue',
				id: userData.alias
			}));
			console.log("Join queue attempt sent");

		} catch (error) {
			console.error('Exception caught in joinQueue', error);
		}
	});

	setUpOnePlayerControl();
	async function joinRoom(roomUID) {
		try {
			roomId = roomUID;

			await state.gameSocket.send(JSON.stringify({
				action: 'join_private_match',
				room_name: roomUID,
			}));
			console.log(`Request to join room ${roomUID} sent.`);
			await showReadyButton(roomUID, userData.alias);
		} catch (error) {
			console.error('Error joining room:', error);
			alert(`${trsl[state.language].joinRoomError}`);
			throw error;
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

	async function create_private_match() {
		try {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			await requestRoom();
		} catch (error){
			console.error('Exception caught in privateMatch.js', error);
		}
	}

	document.getElementById('create-match').addEventListener('click', async () => {
		create_private_match();
	});

	document.getElementById('go-back').addEventListener('click', async () => {
		window.location.hash = "game/multiplayer";
	});

	document.getElementById('go-back-EOG').addEventListener('click', async () => {
		window.location.hash = "lobby";
	});

	setTypeOfGame("online");
	await connectWebSocket();
	if (roomID) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		setRoomId(roomID);
		await joinRoom(roomID);
	}
}

