import { setGameView } from './game_menu.js';
import { setGameMenu } from './game_menu.js';
import { closeGameWebSocket } from './game_menu.js';
import { changeLanguage } from './settings.js';
import { changeFontSize } from './settings.js';
import { changeColorMode } from './settings.js';
import { setSettingsView } from './settings.js';
// import { setLoginView } from './login.js';
// import { setRegisterView } from './login.js';
import { setLoginView } from './login_login.js';
import { setRegisterView } from './login_register.js';
import { set404View } from './404.js';
import { setLeaderboardView } from './leaderboard.js';
import { setPersonnalDataView } from './personnal-data.js';
import { setProfileView } from './profile.js';
import { setFriendsView } from './friends.js';
import { playerDatas } from './data_test.js';

export function loadPage(page) {
	//add a checker to check there is no more than one /
	const contentContainer = document.getElementById("content");
	const currentLanguage = localStorage.getItem("language") || "en";
	const isLoggedIn = localStorage.getItem("isLoggedIn") || "false" ;
	const path = window.location.pathname;

	if (page !== "game") {
		closeGameWebSocket();
	}
	const navbar = document.getElementById("mainNavBar");
	if (navbar) navbar.style.display = isLoggedIn === "true" ? "block" : "none";

	if (isLoggedIn === "true") {
		const currentLogin = localStorage.getItem("currentLogin");
		userAvatar.src = playerDatas.players[currentLogin].profilePicture;;
		userDropdown.textContent = currentLogin;
		// ici afficher la bonne pp
		userAvatar.style.display = "block";
	}
	console.log("page is ", page);
	if (path !== '/') {
		set404View(contentContainer);
	} else if (isLoggedIn != "true" && page !== "login" && page !== "register") {
		window.location.hash = "login";
		loadPage("login")
	} else if (isLoggedIn === "true" && (page === "login" || page === "register")) {
		window.location.hash = "home";
		loadPage("home");
	} else if (page === "home") {
		contentContainer.innerHTML = '<h1 data-i18n="home">Home</h1><p>Welcome!</p>';
	} else if (page === "about") {
		contentContainer.innerHTML = '<h1 data-i18n="about">About</h1><p>To fill.</p>';
	} else if (page === "game") {
		setGameMenu(contentContainer);
	} else if (page === "leaderboard") {
		setLeaderboardView(contentContainer);
	} else if (page === "profile") {
		//change this to make a request for current username
		const username = localStorage.getItem("currentLogin");
		setProfileView(contentContainer, username);
	} else if (page.startsWith("profile/")) {
		let username = page.split("/")[1];
		if (!username) {
			username = localStorage.getItem("currentLogin");
		}
		setProfileView(contentContainer, username);
	} else if (page === "settings") {
		setSettingsView(contentContainer);
	} else if (page === "friends") {
		setFriendsView(contentContainer);
	} else if (page === "login") {
		setLoginView(contentContainer);
	} else if (page === "register") {
		setRegisterView(contentContainer);
	} else if (page === "personnal-data") {
		setPersonnalDataView(contentContainer);
	} else {
		set404View(contentContainer);
	}
	changeLanguage(currentLanguage);
}


function handleNavigation(event) {
	event.preventDefault();

	if (event.target.hasAttribute("data-bs-toggle") && event.target.getAttribute("data-bs-toggle") === "tab") {
		return;
	}
	const newPage = event.target.getAttribute("href")?.substring(1);
	if (newPage) {
		window.history.pushState({ page: newPage }, newPage, '/#' + newPage);
		loadPage(newPage);
		updateActiveLink();
	}
}



export function attachNavigationListeners() {
	const links = document.querySelectorAll("a[href^='#']");
	links.forEach((link) => {
		link.removeEventListener("click", handleNavigation);
		link.addEventListener("click", handleNavigation);
	});
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

	const savedFontSize = localStorage.getItem("fontSize") || "medium";
	changeFontSize(savedFontSize);

	const savedLanguage = localStorage.getItem("language") || "en";
	changeLanguage(savedLanguage);

	const savedColor = localStorage.getItem("color") || "light";
	changeColorMode(savedColor);

	const currentPage = window.location.hash.substring(1) || "home";
	loadPage(currentPage);
	updateActiveLink();

	attachNavigationListeners();

	window.addEventListener("popstate", function (event) {
		const page = event.state ? event.state.page : "home";
		loadPage(page);
		updateActiveLink();
	});

	const logoutButton = document.getElementById("logoutButton");
	if (logoutButton) {
		logoutButton.addEventListener("click", function (event) {
			event.preventDefault();
			console.log("Logout clicked!");
			localStorage.setItem("isLoggedIn", "false");
			localStorage.setItem("isLoggedIn", "falutfava");
			loadPage("login");
		});
	}
});
