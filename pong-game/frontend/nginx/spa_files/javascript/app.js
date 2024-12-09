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
import { setHomePage } from './home.js';
import { fetchWithToken } from './fetch_request.js';
import { setLanguageCookie } from './fetch_request.js';
import { getLanguageCookie } from './fetch_request.js';
// import { ChatWebSocket } from './chat.js';
// import { setChatView, cleanupChatView } from './chat_view.js';

export async function loadPage(page) {
	//add a checker to check there is no more than one /
	//if invalid token, the server explodes
	let isLoggedIn;
	let data;
	let response;
	try {
		response = await fetchWithToken('/api/user/getuser/');
		data = await response.json();
		console.log("User data: ", data);
		isLoggedIn = "true";
		setLanguageCookie(data.language);
	} catch (error) {
		isLoggedIn = "false";
	}
	const contentContainer = document.getElementById("content");
	const currentLanguage = getLanguageCookie() ||  "en";
	const path = window.location.pathname;
	const navbar = document.getElementById("mainNavBar");
	navbar.style.display = isLoggedIn === "true" ? "block" : "none";

	// load user info if user is logged in
	if (isLoggedIn === "true") {
		const userDropdown = document.getElementById("userDropdown");
		userDropdown.textContent = data.alias;
		const userAvatar = document.getElementById("userAvatar");
		userAvatar.src = data.avatar;
		//to change to have the good avatar picture src
		userAvatar.style.display = "block";
	}
	// cleanup only if user is logged in
	if (isLoggedIn === "true") {
		if (page !== "game") {closeGameWebSocket();}
		// if (page !== "chat") {
		// 	cleanupChatView();
		// 	const chatContainer = document.getElementById('chat-container');
		// 	if (chatContainer) {
		// 		chatContainer.remove();
		// 	}
		// }
		console.log("here");
	}
	console.log("page is ", page);
	// check authentication first
	if (path !== '/') {
		set404View(contentContainer);
		return;
	} else if (isLoggedIn != "true" && page !== "login" && page !== "register") {
		window.location.hash = "login";
		loadPage("login");
	} else if (isLoggedIn === "true" && (page === "login" || page === "register")) {
		window.location.hash = "home";
		loadPage("home");
		console.log("logged in, redirect to home");
		return;
	} else {
		try {
			// Handle different page views
			switch (page) {
				case "home":
					setHomePage(contentContainer);
					break;
				case "about":
					contentContainer.innerHTML = '<h1 data-i18n="about">About</h1><p>To fill.</p>';
					break;
				case "game":
					setGameMenu(contentContainer);
					break;
				case "leaderboard":
					setLeaderboardView(contentContainer);
					break;
				case "profile":
					// will not be necessary, maybe it will
					setProfileView(contentContainer, data.alias);
					break;
				case "friends":
					setFriendsView(contentContainer);
					break;
				case "login":
					setLoginView(contentContainer);
					break;
				case "register":
					setRegisterView(contentContainer);
					break;
				case "personnal-data":
					setPersonnalDataView(contentContainer);
					break;
				default:
					if (page.startsWith("profile/")) {
						const profileUsername = page.split("/")[1] || data.alias;
						setProfileView(contentContainer, profileUsername);
					} else {
						set404View(contentContainer);
					}
				}
		} catch (error) {
			console.log("Error in setView:", error);
		}
	changeLanguage(currentLanguage);
	}
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

	// Clear any stale login state on fresh page load
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
			document.cookie = `accessToken=whocares; path=/; secure; SameSite=Strict`;
			document.cookie = `refreshToken=whocares; path=/; secure; SameSite=Strict`;
			loadPage("login");
		});
	}
});
