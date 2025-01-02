import { loadPage } from "./app.js";
import { setLoginViewHtml } from './login_html.js';
import { setCustomValidation } from "./login_validations.js";
import { showError } from "./login_validations.js";
import { showSuccess } from "./login_validations.js";
import { getLanguageCookie } from './fetch_request.js';
import { setLanguageCookie } from "./fetch_request.js";
import { translations as trsl } from "./language_pack.js";


///////////////////// UI Helpers /////////////////////

function show2FAInput() {
	document.getElementById('usernameInput').setAttribute('readonly', true);
	document.getElementById('passwordInput').setAttribute('readonly', true);
	document.getElementById('2faInput').required = true;
	document.getElementById('2faDiv').style.display = 'block';
}

///////////////////// API Calls /////////////////////

async function loginUserInBackend(username, password) {
	const response = await fetch('/api/user/2FA/generate/', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password })
	});
	return response;
}

async function verify2FAInBackend(user_id, otpCode) {
	const response = await fetch('/api/user/2FA/validate/', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ user_id, otpCode })
	});
	return response;
}

///////////////////// Event Handlers /////////////////////

function loginFormEventHandler() {
	const language = getLanguageCookie() || "en";
	const loginForm = document.getElementById("loginForm");
	setCustomValidation("usernameInput");
	setCustomValidation("passwordInput");
	loginForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const username = document.getElementById('usernameInput').value;
		const password = document.getElementById('passwordInput').value;
		try {
			const response = await loginUserInBackend(username, password);
			const data = await response.json();
			if (!response.ok) {
				if (data.detail === "No active account found with the given credentials") {
					showError(trsl[language].invalidCredential);
				} else if (data.detail === "Invalid credentials") {
					showError(trsl[language].invalidCredential);
				} else {
					showError(trsl[language].internalError);
				}
			} else if (response.ok && data.detail === "A 2FA code has been sent") {
				localStorage.setItem("user_id", data.user_id);
				showSuccess(trsl[language].enter2FA);
				show2FAInput();
			}
		} catch (error) {
			showError('Login failed. Please try again.');
		}
	});
}

function twoFAFormEventHandler() {
	const twoFAForm = document.getElementById("2faForm");
	if (twoFAForm) {
		twoFAForm.addEventListener("submit", async (event) => {
			event.preventDefault();
			const otpCode = document.getElementById('2faInput').value;
			const user_id = localStorage.getItem("user_id");
			try {
				const response = await verify2FAInBackend(user_id, otpCode);
				const data = await response.json();
				if (data.detail === "2FA code validated") {
					document.cookie = `accessToken=${data.access}; path=/; secure; SameSite=Strict`;
					document.cookie = `refreshToken=${data.refresh}; path=/; secure; SameSite=Strict`;
					// here we should store that JWT token in a cookie it is safer i think
					window.location.hash = "home";
				} else {
					showError(trsl[language].twoFactorFailed);
				}
			} catch (error) {
				showError(trsl[language].internalError);
			}
		})
	}
}

function languageEventListener() {
	const languageSelect = document.getElementById("languageSelect");
	languageSelect.value = getLanguageCookie() || "en";
	languageSelect.addEventListener("change", async (event) => {
		const selectedLanguage = event.target.value;
		setLanguageCookie(selectedLanguage);
		loadPage("login");
		show2FAInput();
	});
}

///////////////////// Main function /////////////////////

export function setLoginView(contentContainer) {
	setLoginViewHtml(contentContainer);
	loginFormEventHandler();
	twoFAFormEventHandler();
	languageEventListener();
}
