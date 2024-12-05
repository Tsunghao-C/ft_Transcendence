import { translations } from './language_pack.js';
import { attachNavigationListeners } from './app.js';
import { setContainerHtml } from './app.js'

export async function setSettingsView(contentContainer) {
	const currentLanguage = localStorage.getItem("language") || "en";
	const currentFontSize = localStorage.getItem("fontSize") || "medium";
	const currentColor = localStorage.getItem("color") || "light";
	
	await setContainerHtml(contentContainer, "./html/settings.html");
	
	changeLanguage(currentLanguage);
	changeColorMode(currentColor);
	changeFontSize(currentFontSize);

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
