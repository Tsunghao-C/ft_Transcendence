import { fetchWithToken } from "./fetch_request.js";
import { state } from "./app.js";
import { hideElem } from "./utils.js";
import { showElem } from "./utils.js";
import { setUpTwoPlayersControl, connectWebSocket, playerEvent, setTypeOfGame } from "./game_utils.js";
import { translations as trsl } from "./language_pack.js";


export async function setLocalLobby(contentContainer, skip = false) {
	let response;
	let userData;
	try {
		setTypeOfGame("local");
		response = await fetchWithToken('/api/user/getuser/');
		userData = await response.json();
		playerEvent.player_1.id = userData.id;

	} catch(error) {
		console.log(error);
		window.location.hash = "login";
		return;
	}
	contentContainer.innerHTML = `
		<div class="gamelobby-view">
			<div id="game-lobby" class="gamelobby-view">
				<div id="player-info-container" style="display: flex; justify-content: space-between;">
					<div id="user-info-left" style="text-align: left; flex: 1; padding: 10px;"></div>
					<div id="user-info-right" style="text-align: left; flex: 1; padding: 10px;"></div>
				</div>
				<div id="game-info">Loading...</div>
                <p id="rejoin-alreadyingame-text">${trsl[state.language].alreadyInGame}</p>
				<canvas id="game" width="800" height="600" style="display: none;"></canvas>
				<button id="go-back">${trsl[state.language].backButton}</button>
				<button id="go-back-EOG" style="display: none;">${trsl[state.language].backButton}</button>
			</div>
		</div>
	`;

	if (skip == true) {
		document.getElementById('go-back-EOG').textContent = "";
		hideElem("go-back-EOG");
	}
    hideElem('rejoin-alreadyingame-text');
    hideElem('go-back');

	const canvas = document.getElementById('game');
	const ctx = canvas.getContext('2d');
	const gameInfo = document.getElementById('game-info');

	await connectWebSocket();
	setUpTwoPlayersControl();

	try {
		create_local_match();
	} catch (error) {
		console.error('Error in join-match event listener:', error);
	}

	async function request_local_room() {
		try {
			console.log("Requesting room")
			await state.gameSocket.send(JSON.stringify({
				action: 'create_local_match',
				id: userData.alias
			}));
			console.log("Room requested")
		} catch (error) {
			console.error('Error sending room creation request: ', error);
		}
	}

	async function create_local_match() {
		try {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			await request_local_room();
		} catch (error) {
			console.error('Error starting Local game:', error);
			gameInfo.textContent = trsl[state.language].localError;
		}
	}

	document.getElementById('go-back-EOG').addEventListener('click', async () => {
		window.location.hash = "game/local";
	});
}
