import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from "./fetch_request.js";
import { getCookie } from "./fetch_request.js";
import { state } from "./app.js";
import { hideElem } from "./utils.js";
import { showElem } from "./utils.js";

export async function setQuickMatchView(contentContainer, roomID = "") {
    let response;
    let userData;
    let roomId;
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
        <!-- <h2>Game Lobby</h2> -->
        <div id="game-lobby" class="gamelobby-view">
            <!-- <p>Select an option below to get started:</p> -->
            <div>
                <button id="join-queue">Join Queue</button>
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
    const gameInfo = document.getElementById('game-info');
    let wsReconnectTimer = null;



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
            const wsScheme = 'wss';
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
                            state.gameSocket.close();
                            window.location.hash = `lobby/${roomId}`;
                        } else if (response.type == 'error') {
                            console.error('Error received:', response.message);
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

    document.getElementById('join-queue').addEventListener('click', async () => {
        try {
            console.log("Trying to join queue room");
    
            const gameInfo = document.getElementById('game-info');
            gameInfo.innerHTML = `
                <p id="queue-timer">Time in queue: 0s</p>
                <a id="cancel-button" href="#game/online">Cancel</a>
            `;
    
            let timeInQueue = 0;
            const timerInterval = setInterval(() => {
                const queueTimerElement = document.getElementById('queue-timer');
                if (queueTimerElement) {
                    queueTimerElement.textContent = `Time in queue: ${timeInQueue}s`;
                    timeInQueue += 1;
                } else {
                    clearInterval(timerInterval);
                }
            }, 1000);
    
            const cancelButton = document.getElementById('cancel-button');
            cancelButton.addEventListener('click', () => {
                clearInterval(timerInterval);
            });
    
            await state.gameSocket.send(JSON.stringify({
                action: 'join_queue',
                id: userData.alias
            }));
            console.log("Join queue attempt sent");
    
        } catch (error) {
            console.error('Exception caught in joinQueue', error);
        }
    });

    await connectWebSocket();

}



