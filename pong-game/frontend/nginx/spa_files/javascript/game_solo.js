import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from "./fetch_request.js";
import { getCookie } from "./fetch_request.js";
import { state } from "./app.js";
import { hideElem, hideClass, showElem } from "./utils.js";
import { translations as trslt } from "./language_pack.js";
import { setUpOnePlayerControl, connectWebSocket, playerEvent, setTypeOfGame } from "./game_utils.js";

export async function setSoloLobby(contentContainer, difficulty = "", skip = false) {
    let response;
    let userData;
    try {
        setTypeOfGame("ai");
        response = await fetchWithToken('/api/user/getuser/');
        userData = await response.json();
        console.log("User data in lobby: ", userData);
		playerEvent.player_1.id = userData.id;
    } catch(error) {
        console.log(error);
        window.location.hash = "login";
        return;
    }

    const lng = localStorage.getItem("language");

    contentContainer.innerHTML = `
        <div class="gamelobby-view">
        <div id="game-lobby" class="gamelobby-view">
                <button id="easy">${trslt[lng].easy}</button>
                <button id="medium">${trslt[lng].medium}</button>
                <button id="hard">${trslt[lng].hard}</button>
                <div id="player-info-container" style="display: flex; justify-content: space-between;">
                <div class="user-info" id="user-info-left" style="text-align: left; flex: 1; padding: 10px; display: none;"></div>
                <div class="user-info" id="user-info-right" style="text-align: left; flex: 1; padding: 10px; display: none;"></div>
                </div>
                <div id="game-info">Loading...</div>
                <div id="player-status" class="player-status"></div>
                <canvas id="game" width="800" height="600" style="display: none;"></canvas>
                <button id="go-back">${trslt[lng].back}</button>
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

    async function create_ai_match(difficulty) {
        try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            await state.gameSocket.send(JSON.stringify({
                action: 'create_ai_match',
                difficulty: difficulty
            }));

            console.log("Started AI game session");
            console.log("Player_id: " + userData.alias);
            gameInfo.textContent = '• AI Connected';
        } catch (error) {
            console.error('Error starting AI game:', error);
            gameInfo.textContent = 'Error starting AI game. Plase try again.';
        }
    }

    
    function setupButtonListener(difficultyLevel) {
        const button = document.getElementById(difficultyLevel);
        button.addEventListener('click', async () => {
            try {
                ["easy", "medium", "hard", "go-back"].forEach(hideElem);
                create_ai_match(difficultyLevel);
            } catch (error) {
                console.error(`Error in ${difficultyLevel} event listener:`, error);
            }
        });
    }
    
    setupButtonListener('easy');
    setupButtonListener('medium');
    setupButtonListener('hard');
    

    document.getElementById('go-back').addEventListener('click', async () => {
        window.location.hash = "game/";
    });
    
    document.getElementById('go-back-EOG').addEventListener('click', async () => {
        window.location.hash = "game/";
    });
    
    await connectWebSocket();
    setUpOnePlayerControl();
    if (difficulty) {
        ["easy", "medium", "hard", "go-back"].forEach(hideElem);
        create_ai_match(difficulty);
    }
}