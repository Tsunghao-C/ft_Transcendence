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
import { translations as trsl } from "./language_pack.js";
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
				showSuccess(trsl[language].registerSucceeded);
			} else {
				//translations to be made
				if (data.username) {
					if (data.username === "this username contains bad language") {
						showError(`${trsl[language].login} ${trsl[language].badLanguage}`);
					} else if (data.username == "A user with that username already exists.") {
						showError(`${trsl[language].loginTaken}`);
					}
				}
				else if (data.alias) {
					if (data.alias === "this alias contains bad language") {
						showError(`${trsl[language].alias} ${trsl[language].badLanguage}`);
					} else if (data.alias == "user with this alias already exists.") {
						showError(`${trsl[language].aliasTaken}`);
					}
				}
				else if (data.email) {
					if (data.email === "Enter a valid email address.") {
						showError(`${trsl[language].invalidMail}`);
					} else if (data.alias == "user with this email already exists.") {
						showError(`${trsl[language].emailTaken}`);
					}
				}
				else {
					showError(trsl[language].registerFailed)
				}
			}
		} catch (error) {
			showError(trsl[language].internalError);
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
