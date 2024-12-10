import { translations } from './language_pack.js';
import { attachNavigationListeners } from './app.js';
import { getLanguageCookie } from './fetch_request.js';
import { setContainerHtml } from './app.js';

export function setSettingsView(contentContainer) {
	const currentLanguage = getLanguageCookie() ||  "en";
	const currentFontSize = localStorage.getItem("fontSize") || "medium";
	const currentColor = localStorage.getItem("color") || "light";
	
	contentContainer.innerHTML = `
		<div class="settings-view">
			<h2 data-i18n="settings">Settings</h2>
			<div class="form-floating">
				<select class="form-select" id="languageSelect" aria-label="Language selection">
					<option value="en">English</option>
					<option value="fr">Français</option>
					<option value="pt">Português</option>
				</select>
				<label for="floatingSelect" data-i18n="language">Languagexxx</label>
			</div>
			<div class="form-floating">
				<select class="form-select" id="colorSelect" aria-label="Color mode selection">
					<option value="light" data-i18n="lightMode">Light Mode</option>
					<option value="dark" data-i18n="darkMode">Dark Mode</option>
					<option value="colorblind" data-i18n="colorblindMode">Colorblind Mode</option>
				</select>
				<label for="floatingSelect" data-i18n="colorMode">Color Mode</label>
			</div>
			<div class="form-floating">
				<select class="form-select" id="fontSelect" aria-label="Font size selection">
					<option value="small" data-i18n="smallFont">Small</option>
					<option value="medium" data-i18n="mediumFont" selected>Medium</option>
					<option value="large" data-i18n="largeFont">Large</option>
				</select>
				<label for="floatingSelect" data-i18n="fontSize">Font Size</label>
			</div>
		</div>
	`;

	// await setContainerHtml(contentContainer, "./html/settings.html");
	
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
