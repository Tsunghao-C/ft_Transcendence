import { setGameView } from './game.js';
import { closeGameWebSocket } from './game.js';
import { changeLanguage } from './settings.js';
import { changeFontSize } from './settings.js';
import { changeColorMode } from './settings.js';
import { setSettingsView } from './settings.js';
import { setLoginView } from './login.js';
import { setCreateProfileView } from './login.js';
import { set404View } from './404.js';
import { setLeaderboardView } from './leaderboard.js';
import { setPersonnalDataView } from './personnal-data.js';
import { setProfileView } from './profile.js';
import { setFriendsView } from './friends.js';

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
		userAvatar.src = "wtf.jpeg";
		userDropdown.textContent = localStorage.getItem("currentLogin");
		//ici afficher la bonne pp
		//rajouter plus tard le nom du user logged in
		userAvatar.style.display = "block";
	} else {
		userAvatar.style.display = "none";
	}
	console.log("page is ", page);
	if (path !== '/') {
		set404View(contentContainer);
	} else if (isLoggedIn != "true" && page !== "login" && page !== "create-profile") {
		window.location.hash = "login";
		loadPage("login")
	} else if (isLoggedIn === "true" && (page === "login" || page === "create-profile")) {
		window.location.hash = "home";
		loadPage("home");
	} else if (page === "home") {
		contentContainer.innerHTML = '<h1 data-i18n="home">Home</h1><p>Welcome!</p>';
	} else if (page === "about") {
		contentContainer.innerHTML = '<h1 data-i18n="about">About</h1><p>To fill.</p>';
	} else if (page === "game") {
		setGameView(contentContainer);
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
	} else if (page === "create-profile") {
		setCreateProfileView(contentContainer);
	} else if (page === "personnal-data") {
		setPersonnalDataView(contentContainer);
	} else {
		set404View(contentContainer);
	}
	changeLanguage(currentLanguage);
}


function handleNavigation(event) {
	event.preventDefault();

	const newPage = event.target.getAttribute("href").substring(1);
	window.history.pushState({ page: newPage }, newPage, '/#' + newPage);
	loadPage(newPage);
	updateActiveLink();
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
