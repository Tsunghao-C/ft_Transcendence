import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from "./fetch_request.js";
import { getCookie } from "./fetch_request.js";
import { state } from "./app.js";
import { hideElem } from "./utils.js";
import { showElem } from "./utils.js";

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
    contentContainer.innerHTML = `
        <div class="gamelobby-view">
        <div id="game-lobby" class="gamelobby-view">
            <div>
                <button id="easy">easy</button>
                <button id="medium">medium</button>
                <button id="hard">hard</button>
                <button id="menu">Back To Menu</button>
                <button id="ready-button" style="display:none;">Ready</button>
                <div id="player-info-container" style="display: flex; justify-content: space-between;">
                    <div id="user-info-left" style="text-align: left; flex: 1; padding: 10px;"></div>
                    <div id="user-info-right" style="text-align: left; flex: 1; padding: 10px;"></div>
                </div>
                <div id="game-info">Loading...</div>
                <div id="player-status" class="player-status"></div>
                <canvas id="game" width="800" height="600" style="display: none;"></canvas>
            </div>
        </div>
    `;
    const canvas = document.getElementById('game');
    const token = getCookie("accessToken");
    const PADDLE_HEIGHT = 100;
    const PADDLE_WIDTH = 15;
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
                        } else if (response.type == 'room_creation') {
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

    async function sendEvents(socket) {
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
        showElem("menu", "block");
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
        readyButton.textContent = 'Ready Up';

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

        readyButton.onclick = function(event) {
            try {
                if (readyButton.disabled == false) {
                    readyButton.textContent = 'Waiting for game start...';
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

        document.body.appendChild(readyButton);
    }

    function destroyReadyButton() {
        if (readyButton) {
            readyButton.parentNode.removeChild(readyButton);
            readyButton.remove();
            readyButton = null;
        }
    }

    async function startGame() {
        try {
            destroyReadyButton();
            showElem("game", "block");
            if (textBox) {
                textBox.remove();
                textBox = null;
            }
            gameLoop(state.gameSocket);
        } catch (error) {
            console.error('Exception caught in startGame', error);
        }
    }
    
    function renderUsers(difficulty) {
        const userInfoDiv = document.getElementById("user-info-left");
        userInfoDiv.innerHTML = `
            <hr>
            <h4>Player one</h4>
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <img src="${userData.avatar}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; margin-right: 10px;">
                <div>
                    <p style="margin: 0; font-weight: bold;">${userData.alias}</p>
                    <p style="margin: 0;">MMR: ${userData.mmr}</p>
                </div>
            </div>
            <hr>
        `;
        const aiInfoDiv = document.getElementById("user-info-right");
        aiInfoDiv.innerHTML = `
            <hr>
            <h4 class="player-two">Player two</h4>
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <img src="${userData.avatar}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; margin-right: 10px;">
                <div>
                    <p style="margin: 0; font-weight: bold;">${difficulty} AI</p>
                </div>
            </div>
            <hr>
        `;
    }

    async function create_ai_match(difficulty) {
        try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'block';
            await state.gameSocket.send(JSON.stringify({
                action: 'create_ai_match',
                difficulty: difficulty
            }));

            console.log("Started AI game session");
            console.log("Player_id: " + userData.alias);
            renderUsers(difficulty);
            await showReadyButton();

            gameInfo.textContent = 'Playing against AI - Get Ready!';
        } catch (error) {
            console.error('Error starting AI game:', error);
            gameInfo.textContent = 'Error starting AI game. Plase try again.';
        }
    }

    async function init(){
        await connectWebSocket();
    }

    const easyButton = document.getElementById('easy');
    const mediumButton = document.getElementById('medium');
    const hardButton = document.getElementById('hard');

    easyButton.addEventListener('click', async () => {
        try {
            hideElem("easy");
            hideElem("medium");
            hideElem("hard");
            hideElem("menu");
            create_ai_match('easy');
        } catch (error) {
            console.error('Error in join-match event listener:', error);
        }
    });

    mediumButton.addEventListener('click', async () => {
        try {
            hideElem("easy");
            hideElem("medium");
            hideElem("hard");
            hideElem("menu");
            create_ai_match('medium');
        } catch (error) {
            console.error('Error in join-match event listener:', error);
        }
    });

    hardButton.addEventListener('click', async () => {
        try {
            hideElem("easy");
            hideElem("medium");
            hideElem("hard");
            hideElem("menu");
            create_ai_match('hard');
        } catch (error) {
            console.error('Error in join-match event listener:', error);
        }
    });

    document.getElementById('menu').addEventListener('click', async () => {
        window.location.hash = "game/";
    });

    await init();
}