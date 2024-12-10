import { setRegisterViewHtml } from './login_html.js';
import { showError } from './login_validations.js';
import { showSuccess } from './login_validations.js';
import { setCustomValidation } from './login_validations.js';
import { validatePasswordMatch } from './login_validations.js';
import { validateProfilePicture } from './login_validations.js';
import { getLanguageCookie } from './fetch_request.js';
import { setLanguageCookie } from "./fetch_request.js";
import { loadPage } from './app.js';
///////////////////// UI Helpers /////////////////////

///////////////////// API Calls /////////////////////

async function registerUserInBackend(username, password, email, alias, language) {
    const response = await fetch('/api/user/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, alias, language})
    });
    return response;
}

///////////////////// Event Handlers /////////////////////

function setupRegisterFormEventHandler() {
	setCustomValidation("newUsername");
	setCustomValidation("newAlias");
	setCustomValidation("newMailInput");
	setCustomValidation("newPasswordInput");

	validateProfilePicture();
	validatePasswordMatch();
	const registerForm = document.getElementById("registerForm");
	const languageSelect = document.getElementById("languageSelect");
	const language = getLanguageCookie() || "en";
	languageSelect.value = language;
	registerForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const username = document.getElementById('newUsername').value;
		const alias = document.getElementById('newAlias').value;
		const email = document.getElementById('newMailInput').value;
		const password = document.getElementById('newPasswordInput').value;
		const profilePictureInput = document.getElementById("profilePictureInput");
		try {
			const response = await registerUserInBackend(username, password, email, alias, language);
			const data = await response.json();
			if (response.ok) {
				showSuccess('Success! User profile has been created, you can now log in.');
			} else {
				//translations to be made
				if (data.username) {
					showError(data.username);
				}
				else if (data.alias) {
					showError(data.alias);
				}
				else if (data.email) {
					showError(data.email);
				}
				else {
					showError("Register failed, please try again later.")
				}
			}
		} catch (error) {
			showError('An error occurred. Please try again later.');
		}
	});
	languageSelect.addEventListener("change", async (event) => {
			const selectedLanguage = event.target.value;
			setLanguageCookie(selectedLanguage);
			loadPage("register");
	});
}

///////////////////// Main function /////////////////////

export function setRegisterView(contentContainer) {
	const navbar = document.getElementById("mainNavBar");
	navbar.style.display = "none";
	setRegisterViewHtml(contentContainer);
	setupRegisterFormEventHandler();
}
