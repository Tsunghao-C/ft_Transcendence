import { setRegisterViewHtml } from './login_html.js';
import { showError } from './login_validations.js';
import { showSuccess } from './login_validations.js';
import { setCustomValidation } from './login_validations.js';
import { validatePasswordMatch } from './login_validations.js';
import { validateProfilePicture } from './login_validations.js';
import { getLanguageCookie } from './fetch_request.js';
import { setLanguageCookie } from "./fetch_request.js";
import { loadPage } from './app.js';
import { isAlphanumeric } from './utils.js';
///////////////////// UI Helpers /////////////////////

///////////////////// API Calls /////////////////////

async function registerUserInBackend(formData) {
	const response = await fetch("/api/user/register/", {
		method: "POST",
		body: formData,
	});
	return response;
}

///////////////////// Event Handlers /////////////////////

function setupRegisterFormEventHandler() {
	setCustomValidation("newUsername");
	setCustomValidation("newAlias");
	setCustomValidation("newMailInput");
	setCustomValidation("newPasswordInput");

	validatePasswordMatch();
	const registerForm = document.getElementById("registerForm");
	const languageSelect = document.getElementById("languageSelect");
	const language = getLanguageCookie() || "en";
	languageSelect.value = language;
	registerForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const username = document.getElementById('newUsername').value;
		const alias = document.getElementById('newAlias').value;
		if (!isAlphanumeric(alias)) {
			return ;
		}	
		const email = document.getElementById('newMailInput').value;
		const password = document.getElementById('newPasswordInput').value;
		const formData = new FormData();
		formData.append("username", username);
		formData.append("alias", alias);
		formData.append("email", email);
		formData.append("password", password);
		try {
			const response = await registerUserInBackend(formData);
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
				else if (data.password) {
					showError(data.password);
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
