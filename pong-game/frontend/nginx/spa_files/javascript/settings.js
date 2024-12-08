import { translations } from './language_pack.js';
import { attachNavigationListeners } from './app.js';
import { getLanguageCookie } from './fetch_request.js';

export function setSettingsView(contentContainer) {
	const currentLanguage = getLanguageCookie() ||  "en";
	const currentFontSize = localStorage.getItem("fontSize") || "medium";
	const currentColor = localStorage.getItem("color") || "light";
	contentContainer.innerHTML = `
	<h1 data-i18n="settings">Settings</h1>
	<div>
		<h3 data-i18n="language"></h3>
		<select id="languageSelect">
			<option value="en">English</option>
			<option value="fr">Français</option>
			<option value="pt">Português</option>
		</select>
	</div>
	<div>
		<h3 data-i18n="colorMode"></h3>
		<select id="colorSelect">
			<option value="light" data-i18n="lightMode">Light Mode</option>
			<option value="dark" data-i18n="darkMode">Dark Mode</option>
			<option value="colorblind" data-i18n="colorblindMode">Colorblind Mode</option>
		</select>
	</div>
	</div>
		<h3 data-i18n="fontSize">Font Size</h3>
		<select id="fontSelect">
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

	const colorSelect = document.getElementById("colorSelect");
	colorSelect.value = currentColor;
	colorSelect.addEventListener("change", (event) => {
		changeColorMode(event.target.value);
	});

	const fontSelect = document.getElementById("fontSelect");
	fontSelect.value = currentFontSize;
	fontSelect.addEventListener("change", (event) => {
		changeFontSize(event.target.value);
	});
}

export function changeLanguage(language) {
	localStorage.setItem("language", language);
	const elements = document.querySelectorAll("[data-i18n]");
	elements.forEach((el) => {
	  const key = el.getAttribute("data-i18n");
	  if (translations[language] && translations[language][key]) {
		  el.textContent = translations[language][key];
		}
	});
	attachNavigationListeners();
	}

export function changeColorMode(colortype) {
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
	localStorage.setItem("color", colortype);
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

export function changeFontSize(size) {
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
