import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from "./fetch_request.js";
import { getCookie } from "./fetch_request.js";
import { state } from "./app.js";
import { hideElem, hideClass, showElem } from "./utils.js";
import { translations as trslt } from "./language_pack.js";
import { showReadyButton, handlePlayerEvent, connectWebSocket } from "./game_utils.js";


export async function setSoloLobby(contentContainer) {
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
            const wsScheme = "wss"
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
                    try {
                        const response = JSON.parse(event.data);
                        if (response.type == 'notice') {
                            console.log('Server notice: ' + response.message);
                        } else if (response.type == 'ai_room_creation') {
                            roomId = response.room_name;
                            console.log('Room creation notice received');
                            console.log('Room name: ' + roomId);
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

    async function sendEvents() {
        if (playerEvent.pending == true) {
            await state.gameSocket.send(JSON.stringify({
                action: 'player_input',
                player_id: userData.alias,
                input: playerEvent.type,
                game_roomID: roomId,
                local: false
            }));
            playerEvent.pending = false;
        }
        else {
            await state.gameSocket.send(JSON.stringify({
                action: 'player_input',
                player_id: userData.alias,
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
                        player_id: userData.alias
                    }));
                    console.log('Ready signal sent.');
                }
            } catch (error) {
                console.error('Error sending ready signal:', error);
                readyButton.disabled = false;
                readyButton.textContent = 'Ready Up';
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
    
    function renderUsers(difficulty) {
        const userInfoDiv = document.getElementById("user-info-left");
        userInfoDiv.innerHTML = `
            <hr class="hrs">
            <h4>Player one</h4>
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <img src="${userData.avatar}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; margin-right: 10px;">
                <div>
                    <p style="margin: 0; font-weight: bold;">${userData.alias}</p>
                    <p style="margin: 0; font-size: 0.8rem;">MMR: ${userData.mmr}</p>
                </div>
            </div>
            <hr class="hrs">
        `;
        const aiInfoDiv = document.getElementById("user-info-right");
        aiInfoDiv.innerHTML = `
            <hr class="hrs">
            <h4 class="player-two">Player two</h4>
            <div style="display: flex; align-items: center; justify-content: right; margin-bottom: 10px;">
                <div>
                    <p style="margin: 0; font-weight: bold; text-align: right;">AI</p>
                    <p style="margin: 0; text-align: right; font-size: 0.8rem;">Mode: ${difficulty}</p>
                </div>
                <img src="${userData.avatar}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; margin-right: 10px;">
            </div>
            <hr class="hrs">
        `;
        showElem("user-info-left", "block");
        showElem("user-info-right", "block");
    }

    async function create_ai_match(difficulty) {
        try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            await state.gameSocket.send(JSON.stringify({
                action: 'create_ai_match',
                difficulty: difficulty
            }));

            console.log("Started AI game session");
            console.log("Player_id: " + userData.alias);
            renderUsers(difficulty);
            await showReadyButton();

            gameInfo.textContent = '• AI Connected';
        } catch (error) {
            console.error('Error starting AI game:', error);
            gameInfo.textContent = 'Error starting AI game. Plase try again.';
        }
    }

    async function init(){
        await connectWebSocket();
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

    await init();
}