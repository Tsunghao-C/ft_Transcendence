let gameSocket = null;

export function closeGameWebSocket() {
	if (gameSocket) {
		console.log("Closing WebSocket connection...");
		gameSocket.close();
		gameSocket = null;
	}
}

function initializeGameWebSocket() {
	if (gameSocket) {
		console.log("WebSocket already initialized.");
		return;
	}

	gameSocket = new WebSocket('ws://localhost:8433');

	gameSocket.onopen = () => {
		console.log("Connected to game server.");
		gameSocket.send(JSON.stringify({ type: "joinGame", message: "Player has joined the game." }));
	};

	gameSocket.onmessage = (event) => {
		const message = JSON.parse(event.data);
		console.log("Message from server:", message);

		const gameWindow = document.getElementById("gameWindow");
		if (message.type === "update") {
			gameWindow.innerHTML = `
				<h3>Game Status: ${message.status}</h3>
				<p>Score: ${message.score}</p>
				<p>Players:</p>
				<ul>
					${message.players.map(player => `<li>${player.name}: ${player.score}</li>`).join("")}
				</ul>
			`;
		}
	};

	gameSocket.onerror = (error) => {
		console.error("WebSocket error:", error);
	};

	gameSocket.onclose = () => {
		console.log("WebSocket connection closed.");
		gameSocket = null;
	};
}

export function setGameView(contentContainer) {
	contentContainer.innerHTML = `
	<h1 data-i18n="game">Game</h1>
	<div id="gameWindow" style="border: 1px solid #ccc; padding: 20px; height: 300px; overflow-y: auto;">
		<p>Loading game data...</p>
	</div>
`;
initializeGameWebSocket();
}
