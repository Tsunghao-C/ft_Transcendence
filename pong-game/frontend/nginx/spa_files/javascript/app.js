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

export async function loadPage(page) {
	//add a checker to check there is no more than one /
	const contentContainer = document.getElementById("center-box");
	const navbar = document.getElementById("mainNavBar");
	const innerContent = document.getElementById("innerContent");
	const currentLanguage = localStorage.getItem("language") || "en";
	const isLoggedIn = localStorage.getItem("isLoggedIn") || "false" ;
	const path = window.location.pathname;

	if (page !== "game") {
		closeGameWebSocket();
	}
	if (isLoggedIn === "true")
			await setContainerHtml(navbar, "./html/navbar.html");

	if (isLoggedIn === "true") {
		const currentLogin = localStorage.getItem("currentLogin");
		const userAvatar = document.getElementById("userAvatar");
        const userDropdown = document.getElementById("userDropdown");
        
        // Update user dropdown text if element exists
        if (userDropdown && currentLogin) {
            userDropdown.textContent = currentLogin;
        }

        if (userAvatar) {
            if (playerDatas && 
                playerDatas.players && 
                playerDatas.players[currentLogin] && 
                playerDatas.players[currentLogin].profilePicture) {
                // Use profile picture if available
                userAvatar.src = playerDatas.players[currentLogin].profilePicture;
            } else {
                // Set a default avatar or placeholder
                userAvatar.src = "wtf.jpeg";  // Currently NULL, or set a default avatar picture to user who didn't upload picture
            }
            userAvatar.style.display = "block";
        }
		// userAvatar.src = playerDatas.players[currentLogin].profilePicture;
		// userDropdown.textContent = currentLogin;
		// // ici afficher la bonne pp
		// userAvatar.style.display = "block";
	}
	if (path !== '/') {
		set404View(contentContainer);
	} else if (isLoggedIn != "true" && page !== "login" && page !== "register") {
		window.location.hash = "login";
		loadPage("login")
	} else if (isLoggedIn === "true" && (page === "login" || page === "register")) {
		window.location.hash = "home";
		loadPage("home");
	} else {
		// Handle different page views
        switch (page) {
            case "home":
                innerContent.innerHTML = '<h2 data-i18n="home">Home</h2><p>Welcome!</p>';
                break;
            case "about":
				innerContent.innerHTML = '<h1 data-i18n="about">About</h1><p>To fill.</p>';
                break;
            case "game":
                setGameMenu(innerContent);
                break;
            case "leaderboard":
                setLeaderboardView(innerContent);
                break;
            case "profile":
                const username = localStorage.getItem("currentLogin");
                setProfileView(innerContent, username);
                break;
            case "settings":
                setSettingsView(innerContent);
                break;
            case "friends":
                setFriendsView(innerContent);
                break;
            case "login":
                setLoginView(innerContent);
                break;
            case "register":
                setRegisterView(innerContent);
                break;
            case "personnal-data":
                setPersonnalDataView(innerContent);
                break;
            default:
                if (page.startsWith("profile/")) {
                    const profileUsername = page.split("/")[1] || localStorage.getItem("currentLogin");
                    setProfileView(innerContent, profileUsername);
                } else {
                    set404View(innerContent);
                }
        }
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

	// /!\PR [by Alex] I commented the lines below because they would setup the login localStorage as false everytime we refresh, even after having logged in
	// Clear any stale login state on fresh page load
	// if (!localStorage.getItem("currentLogin")) {
	// 	localStorage.setItem("isLoggedIn", "false");
	// }
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
