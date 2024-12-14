import { setGameView } from './game_menu.js';
import { setGameMenu } from './game_menu.js';
import { closeGameWebSocket } from './game_menu.js';
import { changeLanguage } from './settings.js';
import { changeFontSize } from './settings.js';
import { changeColorMode } from './settings.js';
import { setLoginView } from './login_login.js';
import { setRegisterView } from './login_register.js';
import { set404View } from './404.js';
import { setLeaderboardView } from './leaderboard.js';
import { setpersonalDataView } from './personal-data.js';
import { setProfileView } from './profile.js';
import { setFriendsView } from './friends.js';
import { setGameTestView } from  './game_test.js';
import { setHomePage } from './home.js';
import { fetchWithToken } from './fetch_request.js';
import { setLanguageCookie } from './fetch_request.js';
import { getLanguageCookie } from './fetch_request.js';
import { setAboutPage } from './about.js';
// import { setChatPage } from './chat.js';
import { setChatView } from './chat_view.js';

export const state = {
	chatSocket: null,
	};

export async function setContainerHtml(container, url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load navbar.html: ${response.statusText}`);
        }
        const containerHtml = await response.text();
		// console.log("navbarHtml  is : " + navbarHtml);
        container.innerHTML = containerHtml;
    } catch (error) {
        console.error(error);
    }
}

function setNavbarHtml(container) {
	container.innerHTML = `
		<a class="navbar-brand" href="#home">Q</a>
		<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
			<span class="navbar-toggler-icon"></span>
		</button>
		<div class="collapse navbar-collapse" id="navbarNav">
			<ul class="navbar-nav mx-auto">
				<li class="nav-item">
					<a class="nav-link" href="#game" data-i18n="game"><span data-i18n="game">Game</span></a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#leaderboard" data-i18n="leaderboard"><span data-i18n="leaderboard">Leaderboard</span></a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#profile" data-i18n="profile"><span data-i18n="profile">Profile</span></a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#friends" data-i18n="friends"><span data-i18n="friends">Friends</span></a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#chat" data-i18n="chat"><span data-i18n="chat">Chat</span></a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#about" data-i18n="about"><span data-i18n="about">About</span></a>
				</li>
			</ul>
			<ul class="navbar-nav">
				<li class="nav-item dropdown d-flex align-items-center">
					<img id="userAvatar" src="" alt="User Avatar" class="rounded-circle me-2" style="width: 30px; height: 30px; display: none;">
					<a class="nav-link dropdown-toggle" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false" role="button" tabindex="0">User</a>
					<ul class="dropdown-menu" aria-labelledby="userDropdown" role="menu">
						<li><a class="dropdown-item" href="#personal-data" data-i18n="personalData" role="menuitem" tabindex="0">My information</a></li>
						<li><a class="dropdown-item" href="#" data-i18n="logout" id="logoutButton" role="menuitem" tabindex="0">Logout</a></li>
					</ul>
				</li>
			</ul>
		</div>
	`;
	const logoutButton = document.getElementById("logoutButton");
	if (logoutButton) {
		logoutButton.addEventListener("click", function (event) {
			event.preventDefault();
			console.log("Logout clicked!");
			document.cookie = `accessToken=whocares; path=/; secure; SameSite=Strict`;
			document.cookie = `refreshToken=whocares; path=/; secure; SameSite=Strict`;
			container.innerHTML = '';
			window.location.hash = "login";
			loadPage("login");
		});
	}
}

export async function loadPage(page) {
	localStorage.setItem("isLoggedIn", "true");
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
	const contentContainer = document.getElementById("center-box");
	const navbar = document.getElementById("mainNavBar");
	const innerContent = document.getElementById("innerContent");
	const currentLanguage = getLanguageCookie();
	if (!currentLanguage || !['pt', 'fr', 'en'].includes(currentLanguage)) {
		setLanguageCookie("en");
	}
	const path = window.location.pathname;
	// load user info if user is logged in
	if (isLoggedIn === "true") {
		setNavbarHtml(navbar);
		navbar.style.display = "flex";
		const userDropdown = document.getElementById("userDropdown");
		userDropdown.textContent = data.alias;
		const userAvatar = document.getElementById("userAvatar");
		userAvatar.src = data.avatar;
		// userAvatar.src = "./media/default-pp.jpg";
		//to change to have the good avatar picture src
		userAvatar.style.display = "block";
	}
	// cleanup only if user is logged in
	if (isLoggedIn === "true") {
		if (state.chatSocket) {
			state.chatSocket.close();
			state.chatSocket = null;
		}
		if (page !== "game") {closeGameWebSocket();}
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
					setHomePage(innerContent);
					break;
				case "game":
					setGameMenu(innerContent);
					break;
				case "leaderboard":
					setLeaderboardView(innerContent);
					break;
				case "profile":
					// will not be necessary, maybe it will
					setProfileView(innerContent, data.alias);
					break;
				case "friends":
					setFriendsView(innerContent);
					break;
				case "chat":
					setChatView(innerContent);
					break;
				case "about":
					setAboutPage(innerContent);
					break;
				case "login":
					setLoginView(innerContent);
					break;
				case "register":
					setRegisterView(innerContent);
					break;
				case "personal-data":
					setpersonalDataView(innerContent);
					break;
				case "chat":
					setChatView(innerContent);
					break;
				default:
					if (page.startsWith("profile/")) {
						const profileUsername = page.split("/")[1] || data.alias;
						setProfileView(innerContent, profileUsername);
					// } else if (page.startsWith("friends/")) {
					// 	console.log('ausidjaziefjaiezjfaizjefiajzefijazijefija');
					// 	const activeTab = page.split("/")[1] || "friends";
					// 	console.log(activeTab);
					// 	if (!['friends', 'friend-requests', 'sent-requests', 'block'].includes(activeTab)) {
					// 		set404View(contentContainer);
						// } else {
						// 	setFriendsView(contentContainer, activeTab);
						// } this could be implemented to make the perosn be able to load one tab for friends, and to have history on it
					} else {
						set404View(innerContent);
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
	}
}

export function attachNavigationListeners() {
	const links = document.querySelectorAll("a[href^='#']");
	links.forEach((link) => {
		link.removeEventListener("click", handleNavigation);
		link.addEventListener("click", handleNavigation);
	});
}

window.addEventListener("hashchange", () => {
	const newPage = window.location.hash.substring(1);
	loadPage(newPage);
});


document.addEventListener("DOMContentLoaded", function () {

	// /!\PR [by Alex] I commented the lines below because they would setup the login localStorage as false everytime we refresh, even after having logged in
	// Clear any stale login state on fresh page load
	const savedFontSize = localStorage.getItem("fontSize") || "medium";
	changeFontSize(savedFontSize);

	const savedLanguage = localStorage.getItem("language") || "en";
	changeLanguage(savedLanguage);

	const savedColor = localStorage.getItem("color") || "light";
	changeColorMode(savedColor);

	const currentPage = window.location.hash.substring(1) || "home";
	loadPage(currentPage);

	attachNavigationListeners();

	window.addEventListener("popstate", function (event) {
		const page = event.state ? event.state.page : "home";
		loadPage(page);
	});


});
