import { translations } from "./language_pack.js";
import { getLanguageCookie } from './fetch_request.js';

export function closeGameWebSocket() {
	console.log("The WebSocket should be closed");
}

export function setGameMenu(contentContainer, menu = "main") {
	contentContainer.innerHTML = "";

	const currentLanguage = localStorage.getItem("language");

	const menus = {
		main: [
			{ text: `${translations[currentLanguage].solo}`, hash: "solo" },
			{ text: `${translations[currentLanguage].multi}`, hash: "game/multiplayer" },
		],
		multiplayer: [
			{ text: `${translations[currentLanguage].local}`, hash: "game/local" },
			{ text: `${translations[currentLanguage].online}`, hash: "lobby" },
			{ text: `${translations[currentLanguage].back}`, hash: "game/main" },
		],
		local: [
			{ text: `${translations[currentLanguage].duel}`, hash: "duel" },
			{ text: `${translations[currentLanguage].tournament}`, hash: "tournament" },
			{ text: `${translations[currentLanguage].back}`, hash: "game/multiplayer" },
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

