import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from "./fetch_request.js";
import { getCookie } from "./fetch_request.js";
import { state } from "./app.js";
import { hideElem } from "./utils.js";
import { showElem } from "./utils.js";
import { setUpTwoPlayersControl, connectWebSocket, playerEvent, setTypeOfGame } from "./game_utils.js";
import { translations as trslt } from "./language_pack.js";


export async function setLocalLobby(contentContainer, skip = false) {
    let response;
    let userData;
    try {
        setTypeOfGame("local");
        response = await fetchWithToken('/api/user/getuser/');
        userData = await response.json();
        console.log("User data in lobby: ", userData);
		playerEvent.player_1.id = userData.id;

    } catch(error) {
        console.log(error);
        window.location.hash = "login";
        return;
    }
    const lng = getLanguageCookie() || "en";
    contentContainer.innerHTML = `
        <div class="gamelobby-view">
        <div id="game-lobby" class="gamelobby-view">
            <button id="local">Start local versus</button>
            <div id="player-info-container" style="display: flex; justify-content: space-between;">
                <div id="user-info-left" style="text-align: left; flex: 1; padding: 10px;"></div>
                <div id="user-info-right" style="text-align: left; flex: 1; padding: 10px;"></div>
            </div>
            <div id="game-info">Loading...</div>
            <div id="player-status" class="player-status"></div>
            <canvas id="game" width="800" height="600" style="display: none;"></canvas>
            <button id="go-back-EOG" style="display: none;">${trslt[lng].back}</button>
        </div>
    `;

    if (skip == true) {
        console.log("SKIP IS TRUE");
        document.getElementById('go-back-EOG').textContent = "";
        hideElem("go-back-EOG");
    }

    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const gameInfo = document.getElementById('game-info');

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
            gameInfo.textContent = 'Error starting Local game. Plase try again.';
        }
    }

    
    const localButton = document.getElementById('local');

    localButton.addEventListener('click', async () => {
        try {
            hideElem("local");
            create_local_match();
        } catch (error) {
            console.error('Error in join-match event listener:', error);
        }
    });
    
    await connectWebSocket();
    setUpTwoPlayersControl();
    if (skip) {
        hideElem("local");
        create_local_match();
    }
    
    document.getElementById('go-back-EOG').addEventListener('click', async () => {
        window.location.hash = "game/local";
    });

}