import { translations } from "./language_pack.js";
import { state } from "./app.js";

export function closeGameWebSocket() {
	console.log("The WebSocket should be closed");
}

export function setGameMenu(contentContainer, menu = "main") {
	contentContainer.innerHTML = "";


	const menus = {
		main: [
			{ text: `${translations[state.language].solo}`, hash: "solo" },
			{ text: `${translations[state.language].multi}`, hash: "game/multiplayer" },
		],
		multiplayer: [
			{ text: `${translations[state.language].local}`, hash: "game/local" },
			{ text: `${translations[state.language].online}`, hash: "lobby" },
			{ text: `${translations[state.language].backButton}`, hash: "game/main" },
		],
		local: [
			{ text: `${translations[state.language].duel}`, hash: "duel" },
			{ text: `${translations[state.language].tournament}`, hash: "tournament" },
			{ text: `${translations[state.language].backButton}`, hash: "game/multiplayer" },
		],
	};

	function createMenu(menuKey) {
		const menu = menus[menuKey];
		const gameView = document.createElement("div");
		gameView.className = "game-view";
		const menuContainer = document.createElement("div");
		menuContainer.className = "menu-container";
		if (menuKey === "main") {
			const title = document.createElement("h1");
			title.textContent = "pQnGX";
			title.className = "main-game-menu-title";
			gameView.appendChild(title);
		}
		menu.forEach((item) => {
			const button = document.createElement("button");
			button.textContent = item.text;
			button.className = "btn btn-primary mb-2";
			button.style.display = "block";
			button.style.margin = "10px auto";

			button.addEventListener("click", () => {
				window.location.hash = item.hash;
			});

			menuContainer.appendChild(button);
		});
		gameView.appendChild(menuContainer);
		return gameView;
	}

	const menuView = createMenu(menu);
	contentContainer.appendChild(menuView);
}

