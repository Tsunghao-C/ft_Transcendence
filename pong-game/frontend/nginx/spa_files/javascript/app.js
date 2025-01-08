import { setGameMenu } from './game_menu.js';
import { setLoginView } from './login_login.js';
import { setRegisterView } from './login_register.js';
import { set404View } from './404.js';
import { setLeaderboardView } from './leaderboard.js';
import { setpersonalDataView } from './personal-data.js';
import { setProfileView } from './profile.js';
import { setFriendsView } from './friends.js';
import { setHomePage } from './home.js';
import { fetchWithToken } from './fetch_request.js';
import { setLanguageCookie } from './fetch_request.js';
import { getLanguageCookie } from './fetch_request.js';
import { setAboutPage } from './about.js';
import { setChatView } from './chat_view.js';
import { translations as trsl} from './language_pack.js';
import { setLobbyView } from './game_lobby.js';
import { setTournamentView } from './game_tournament.js';
import { setIsTournament } from "./game_utils.js";
import { setSoloLobby } from './game_solo.js';
import { setLocalLobby } from './game_local.js';

export const state = {
	chatSocket: null,
	gameSocket: null,
	language: null,
};

export async function setContainerHtml(container, url) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to load navbar.html: ${response.statusText}`);
		}
		const containerHtml = await response.text();
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
					<a class="nav-link" href="#game">${trsl[state.language].game}</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#leaderboard">${trsl[state.language].leaderboard}</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#profile">${trsl[state.language].profile}</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#friends">${trsl[state.language].friends}</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#chat">${trsl[state.language].chat}</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#about">${trsl[state.language].about}</a>
				</li>
			</ul>
			<ul class="navbar-nav">
				<li class="nav-item dropdown d-flex align-items-center">
					<img id="userAvatar" src="" alt="User Avatar" class="rounded-circle me-2" style="width: 30px; height: 30px; display: none;">
					<a class="nav-link dropdown-toggle" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false" role="button" tabindex="0">User</a>
					<ul class="dropdown-menu" aria-labelledby="userDropdown" role="menu">
						<li><a class="dropdown-item" href="#personal-data" role="menuitem" tabindex="0">${trsl[state.language].personnalData}</a></li>
						<li><a class="dropdown-item" href="#" id="logoutButton" role="menuitem" tabindex="0">${trsl[state.language].logout}</a></li>
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
		});
	}
}

export async function loadPage(page) {
	let data;
	let response;
	const contentContainer = document.getElementById("center-box");
	const innerContent = document.getElementById("innerContent");
	if (!state.language) {
		state.language = getLanguageCookie();
	}
	if (!state.language || !['pt', 'fr', 'en'].includes(state.language)) {
		console.log("invalid language");
		setLanguageCookie("en");
		state.language = "en";
	}

	if (state.chatSocket) {
		state.chatSocket.close();
		state.chatSocket = null;
		console.log("closing chatting socket");
	}
	if (state.gameSocket) {
		state.gameSocket.close();
		state.gameSocket = null;
	}
	if (page !== "tournament") {
		setIsTournament(false);
	}
	const navbar = document.getElementById("mainNavBar");
	try {
		response = await fetchWithToken('/api/user/getuser/');
		data = await response.json();
		setLanguageCookie(data.language);
	} catch (error) {
		console.log(error)
		if (page !== "login" && page !== "register") {
			navbar.innerHTML = '';
			window.location.hash = "login";
			return;
		} else if (page === "login") {
			setLoginView(innerContent);
		} else {
			setRegisterView(innerContent);
		}
		return;
	}
	const path = window.location.pathname;
	setNavbarHtml(navbar);
	navbar.style.display = "flex";
	const userDropdown = document.getElementById("userDropdown");
	userDropdown.textContent = data.alias;
	const userAvatar = document.getElementById("userAvatar");
	userAvatar.src = data.avatar;
	userAvatar.style.display = "block";
	console.log("page is ", page);
	if (path !== '/') {
		set404View(contentContainer);
		return;
	} else if (page === "login" || page === "register") {
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
					setProfileView(innerContent);
					break;
				case "friends":
					setFriendsView(innerContent);
					break;
				case "solo":
					setSoloLobby(innerContent);
					break;
				case "duel":
					setLocalLobby(innerContent);
					break;
				case "chat":
					setChatView(innerContent);
					break;
				case "about":
					setAboutPage(innerContent);
					break;
				case "lobby":
					setLobbyView(innerContent);
					break;
				case "personal-data":
					setpersonalDataView(innerContent);
					break;
				case "tournament":
					setTournamentView(innerContent);
					break;
				default:
					if (page.startsWith("profile/")) {
						if (page.split("/").length > 2) {
							set404View(innerContent);
						}
						const profileUsername = page.split("/")[1] || data.alias;
						setProfileView(innerContent, profileUsername);
					} else if (page.startsWith("chat/")) {
						const pageSplit = page.split("/");
						if (pageSplit.length > 3) {
							set404View(innerContent);
						} else {
							const roomType = page.split("/")[1];
							if (roomType) {
								const aliasOrRoomToJoin = page.split("/")[2];
								if (!['public', 'private', 'tournament'].includes(roomType)) {
									set404View(innerContent);
								} else if (aliasOrRoomToJoin) {
									setChatView(innerContent, roomType, aliasOrRoomToJoin);
								} else {
									setChatView(innerContent, roomType);
								}
							} else {
								if (page.split("/").length > 2) {
									set404View(innerContent);
								} else {
									setChatView(innerContent);
								}
							}
						}

					} else if (page.startsWith("friends/")) {
							const activeTab = page.split("/")[1] || "friends";
							if (['friends', 'friend-requests', 'sent-friend-requests', 'blocks'].includes(activeTab)) {
									setFriendsView(innerContent, activeTab);
								} else {
										set404View(innerContent);
								}
					} else if (page.startsWith("lobby/")) {
						const roomId = page.split("/")[1] || "";
						setLobbyView(innerContent, roomId);
					} else if (page.startsWith("game/")) {
						const pageSplit = page.split("/");
						const menu = pageSplit[1] || "main";
						if (menu) {
							if (pageSplit.length > 2) {
								set404View(innerContent);
							} else if (['main', 'solo', 'multiplayer', 'local', 'online'].includes(menu)) {
									setGameMenu(innerContent, menu);
							} else {
								set404View(innerContent);
							}
						} else {
							setGameMenu(innerContent);
						}
					} else {
						set404View(innerContent);
					}
				}
		} catch (error) {
			console.log("Error in setView:", error);
		}
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
	const currentPage = window.location.hash.substring(1) || "home";
	loadPage(currentPage);

	attachNavigationListeners();
});