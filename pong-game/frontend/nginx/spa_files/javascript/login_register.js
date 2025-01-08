import { setRegisterViewHtml } from './login_html.js';
import { showError } from './login_validations.js';
import { showSuccess } from './login_validations.js';
import { setCustomValidation } from './login_validations.js';
import { validatePasswordMatch } from './login_validations.js';
import { validateProfilePicture } from './login_validations.js'; // why is it not used anymore ??
import { setLanguageCookie } from "./fetch_request.js";
import { loadPage } from './app.js';
import { isAlphanumeric } from './utils.js';
import { translations as trsl } from "./language_pack.js";
import { state } from './app.js';
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
	languageSelect.value = state.language;
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
				showSuccess(trsl[state.language].registerSucceeded);
			} else {
				if (data.username) {
					if (data.username == "this username contains bad language") {
						showError(`${trsl[state.language].login} ${trsl[state.language].badLanguage}`);
					} else if (data.username == "A user with that username already exists.") {
						showError(`${trsl[state.language].loginTaken}`);
					}
				}
				else if (data.alias) {
					if (data.alias == "this alias contains bad language") {
						showError(`${trsl[state.language].alias} ${trsl[state.language].badLanguage}`);
					} else if (data.alias == "user with this alias already exists.") {
						showError(`${trsl[state.language].aliasTaken}`);
					} else if (data.alias == "alias length cannot exceed 10 characters") {
						showError(`${trsl[state.language].alias} ${trsl[state.language].tooLong}`);
					}
				}
				else if (data.email) {
					if (data.email == "Enter a valid email address.") {
						showError(`${trsl[state.language].invalidMail}`);
					} else if (data.email == "user with this email already exists.") {
						showError(`${trsl[state.language].emailTaken}`);
					}
				}
		// 		if len(value) < 12:
		// 	raise serializers.ValidationError("Password must be longer than 12 characters")
		// elif not re.search("[A-Z]", value):
		// 	raise serializers.ValidationError("Password must contain at least one uppercase letter")
		// elif not re.search("[a-z]", value):
		// 	raise serializers.ValidationError("Password must contain at least one lowercase letter")
		// elif not re.search("[0-9]", value):
		// 	raise serializers.ValidationError("Password must contain at least one number")
		// elif not re.search("[!@#$%^&*(),.?\":{}|<>:;\'_+-=~`]", value):
		// 	raise serializers.ValidationError("Password must contain at least one special character")
		// return value
				else if (data.password) {
					if (data.password == "Password must be longer than 12 characters") {
						showError(`${trsl[state.language].pwWrongSize}`);
					} else if (data.password == "Password must contain at least one uppercase letter") {
						showError(`${trsl[state.language].pwMissingUpper}`);
					} else if (data.password == "Password must contain at least one lowercase letter") {
						showError(`${trsl[state.language].pwMissingLower}`);
					} else if (data.password == "Password must contain at least one number") {
						showError(`${trsl[state.language].pwMissingNumber}`);
					} else if (data.password == "Password must contain at least one special character") {
						showError(`${trsl[state.language].pwMissingSpecial}`);
					}
				}
				else {
					showError(trsl[state.language].registerFailed)
				}
			}
		} catch (error) {
			showError(trsl[state.language].internalError);
		}
	});
	languageSelect.addEventListener("change", async (event) => {
		const selectedLanguage = event.target.value;
		setLanguageCookie(selectedLanguage);
		state.language = selectedLanguage;
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
