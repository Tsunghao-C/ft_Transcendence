import { setGameView } from './game.js';
import { closeGameWebSocket } from './game.js';
import { changeLanguage } from './settings.js';
import { changeFontSize } from './settings.js';
import { changeColorMode } from './settings.js';
import { setSettingsView } from './settings.js';
import { translations } from './language_pack.js';
import { setLoginView } from './profile.js';
import { setCreateProfileView } from './profile.js';

export function loadPage(page) {
	const contentContainer = document.getElementById("content");
	const currentLanguage = localStorage.getItem("language") || "en";
	const isLoggedIn = localStorage.getItem("isLoggedIn") || "false" ;

	if (page !== "game") {
		closeGameWebSocket();
	}
	if (isLoggedIn != "true" && page !== "login" && page !== "create-profile") {
		setLoginView(contentContainer);
	}
	if (isLoggedIn === "true" && page === "login") {
		page = "home";
	}
	if (page === "home") {
		contentContainer.innerHTML = '<h1 data-i18n="home">Home</h1><p>Welcome!</p>';
	} else if (page === "about") {
		contentContainer.innerHTML = '<h1 data-i18n="about">About</h1><p>To fill.</p>';
	} else if (page === "game") {
		setGameView(contentContainer);
	} else if (page === "settings") {
		setSettingsView(contentContainer);
	} else if (page === "login") {
		setLoginView(contentContainer);
	} else if (page === "create-profile") {
		setCreateProfileView(contentContainer);
	} else {
contentContainer.innerHTML = `
		<h1 data-i18n="error404Title">${translations[currentLanguage].error404Title}</h1>
		<p data-i18n="error404Message">${translations[currentLanguage].error404Message}</p>
	`;
	}
	changeLanguage(currentLanguage);
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

	const savedFontSize = localStorage.getItem("fontSize") || "medium";
	changeFontSize(savedFontSize);

	const savedLanguage = localStorage.getItem("language") || "en";
	changeLanguage(savedLanguage);

	const savedColor = localStorage.getItem("color") || "light";
	changeColorMode(savedColor);

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

	const logoutButton = document.getElementById("logoutButton");
	if (logoutButton) {
		logoutButton.addEventListener("click", function (event) {
			event.preventDefault();
			console.log("Logout clicked!");
			localStorage.setItem("isLoggedIn", "false");
			updateDropdownMenu(false);
			loadPage("login");
		});
	}

	window.addEventListener('hashchange', updateActiveLink);
});
