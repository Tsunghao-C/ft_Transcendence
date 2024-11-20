let gameSocket = null;

const translations = {
	en: {
		home: "Home",
		game: "Game",
		leaderboard: "Leaderboard",
		settings: "Settings",
		about: "About",
		user: "User",
		colorMode: "Color Mode",
		lightMode: "Light",
		darkMode: "Dark",
		colorblindMode: "Colorblind",
		error404Title: "404",
		error404Message: "Error 404: Page not found",
		fontSize: "Font Size",
		smallFont: "Small",
		mediumFont: "Medium",
		largeFont: "Large",
	},
	fr: {
		home: "Accueil",
		game: "Jeu",
		leaderboard: "Classement",
		settings: "Paramètres",
		about: "À propos",
		user: "Utilisateur",
		colorMode: "Choix des couleurs",
		lightMode: "Clair",
		darkMode: "Sombre",
		colorblindMode: "Daltonien",
		error404Title: "404",
		error404Message: "Erreur 404 : Page introuvable",
		fontSize: "Taille de la police",
		smallFont: "Petite",
		mediumFont: "Moyenne",
		largeFont: "Grande",
	},
	pt: {
		home: "Início",
		game: "Jogo",
		leaderboard: "Classificação",
		settings: "Configurações",
		about: "Sobre",
		user: "Usuário",
		colorMode: "Modo de Cor",
		lightMode: "Claro",
		darkMode: "Escuro",
		colorblindMode: "Daltônico",
		error404Title: "404",
		error404Message: "Erro 404: Página não encontrada",
		fontSize: "Tamanho da fonte",
		smallFont: "Pequena",
		mediumFont: "Média",
		largeFont: "Grande",
	},
};

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

function closeGameWebSocket() {
	if (gameSocket) {
		console.log("Closing WebSocket connection...");
		gameSocket.close();
		gameSocket = null;
	}
}

function loadPage(page) {
	const contentContainer = document.getElementById("content");
	const currentLanguage = localStorage.getItem("language") || "en";

	if (gameSocket && page !== "game") {
		closeGameWebSocket();
	}

	if (page === "home") {
		contentContainer.innerHTML = '<h1 data-i18n="home">Home</h1><p>Welcome!</p>';
	} else if (page === "about") {
		contentContainer.innerHTML = '<h1 data-i18n="about">About</h1><p>To fill.</p>';
	} else if (page === "game") {
		contentContainer.innerHTML = `
			<h1 data-i18n="game">Game</h1>
			<div id="gameWindow" style="border: 1px solid #ccc; padding: 20px; height: 300px; overflow-y: auto;">
				<p>Loading game data...</p>
			</div>
		`;
		initializeGameWebSocket();
	} else if (page === "settings") {
		contentContainer.innerHTML = `
			<h1 data-i18n="settings">Settings</h1>
			<div>
				<h3>Language</h3>
				<select id="languageSelect">
					<option value="en">English</option>
					<option value="fr">Français</option>
					<option value="pt">Português</option>
				</select>
			</div>
			<div>
				<h3 data-i18n="colorMode"></h3>
				<select id="colorMode">
					<option value="light" data-i18n="lightMode">Light Mode</option>
					<option value="dark" data-i18n="darkMode">Dark Mode</option>
					<option value="colorblind" data-i18n="colorblindMode">Colorblind Mode</option>
				</select>
			</div>
			</div>
				<h3 data-i18n="fontSize">Font Size</h3>
				<select id="fontSize">
					<option value="small" data-i18n="smallFont">Small</option>
					<option value="medium" data-i18n="mediumFont" selected>Medium</option>
					<option value="large" data-i18n="largeFont">Large</option>
				</select>
			</div>
		`;

		const languageSelect = document.getElementById("languageSelect");
		languageSelect.value = currentLanguage;
		languageSelect.addEventListener("change", (event) => {
			changeLanguage(event.target.value);
		});

		const colorMode = document.getElementById("colorMode");
		colorMode.addEventListener("change", (event) => {
			changeColorMode(event.target.value);
		});

		const fontSize = document.getElementById("fontSize");
		fontSize.addEventListener("change", (event) => {
			changeFontSize(event.target.value);
		});
	} else {
contentContainer.innerHTML = `
		<h1 data-i18n="error404Title">${translations[currentLanguage].error404Title}</h1>
		<p data-i18n="error404Message">${translations[currentLanguage].error404Message}</p>
	`;
	}
	changeLanguage(currentLanguage);
}


function changeLanguage(language) {
	console.log("Language changed to:", language);

	localStorage.setItem("language", language);

	const elements = document.querySelectorAll("[data-i18n]");
	elements.forEach((el) => {
		const key = el.getAttribute("data-i18n");
		if (translations[language] && translations[language][key]) {
			el.textContent = translations[language][key];
		}
	});
}


function changeColorMode(colortype) {
	switch (colortype) {
		case "light":
			setLightMode();
			break;
		case "dark":
			setDarkMode();
			break;
		case "colorblind":
			setColorblindMode();
			break;
		default:
			setLightMode();
	}
}

function setLightMode() {
	document.body.classList.remove("dark", "colorblind");
}

function setDarkMode() {
	document.body.classList.remove("light", "colorblind");
	document.body.classList.add("dark");
}

function setColorblindMode() {
	document.body.classList.remove("light", "dark");
	document.body.classList.add("colorblind");
}

function changeFontSize(size) {
	document.body.classList.remove("small-font", "medium-font", "large-font");

	if (size === "small") {
		document.body.classList.add("small-font");
	} else if (size === "medium") {
		document.body.classList.add("medium-font");
	} else if (size === "large") {
		document.body.classList.add("large-font");
	}

	localStorage.setItem("fontSize", size);
}


function handleNavigation(event) {
	event.preventDefault();

	const newPage = event.target.getAttribute("href").substring(1);
	loadPage(newPage);
	window.history.pushState({ page: newPage }, newPage, "#" + newPage);

	updateActiveLink();
}

function updateActiveLink() {
	const links = document.querySelectorAll('.nav-link');

	links.forEach(link => {
		link.classList.remove('active');
	});

	const currentLink = document.querySelector(`a[href="${window.location.hash}"]`);
	if (currentLink) {
		currentLink.classList.add('active');
	}
}

document.addEventListener("DOMContentLoaded", function () {

	// // Récupérer la taille de police enregistrée
	// const savedFontSize = localStorage.getItem("fontSize") || "medium";
	// changeFontSize(savedFontSize);

	// // Ajouter un écouteur pour les modifications dans le select
	// const fontSizeSelect = document.getElementById("fontSizeSelect");
	// fontSizeSelect.value = savedFontSize; // Sélectionner la taille enregistrée
	// fontSizeSelect.addEventListener("change", (event) => {
	// 	changeFontSize(event.target.value);
	// });
	const savedLanguage = localStorage.getItem("language") || "en";
	changeLanguage(savedLanguage);

	const currentPage = window.location.hash.substring(1) || "home";
	loadPage(currentPage);
	updateActiveLink();

	const links = document.querySelectorAll("a");
	links.forEach(link => {
		link.addEventListener("click", handleNavigation);
	});

	window.addEventListener("popstate", function (event) {
		const page = event.state ? event.state.page : "home";
		loadPage(page);
		updateActiveLink();
	});

	window.addEventListener('hashchange', updateActiveLink);
});
