import { loadPage } from "./app.js";
import { setLoginViewHtml } from './login_html.js';
import { setCustomValidation } from "./login_validations.js";
import { showError } from "./login_validations.js";
import { showSuccess } from "./login_validations.js";
import { getLanguageCookie } from './fetch_request.js';
import { setLanguageCookie } from "./fetch_request.js";

///////////////////// UI Helpers /////////////////////

function show2FAInput() {
	document.getElementById('usernameInput').setAttribute('readonly', true);
	document.getElementById('passwordInput').setAttribute('readonly', true);
	document.getElementById('2faInput').required = true;
	document.getElementById('2faDiv').style.display = 'block';
}

///////////////////// API Calls /////////////////////

// Bring back 2FA
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

//TO bipass 2fa error
function setupLoginFormEventHandler() {
	const loginForm = document.getElementById("loginForm");
	const languageSelect = document.getElementById("languageSelect");
	languageSelect.value = getLanguageCookie() || "en";
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
				   showError("Login failed: Invalid Login or Password");
				} else if (data.detail === "Invalid credentials") {
					showError("Login failed: Invalid Login or Password");
				 } else {
					showError("Error: an inattended error occured.");
				}
			} else if (response.ok && data.detail === "A 2FA code has been sent") {
				localStorage.setItem("user_id", data.user_id);
				showSuccess("Enter the 2FA code sent to your email.");
				show2FAInput();
			}
		} catch (error) {
			showError('Login failed. Please try again.');
		}
	});
	languageSelect.addEventListener("change", async (event) => {
		const selectedLanguage = event.target.value;
		setLanguageCookie(selectedLanguage);
		loadPage("login");
	});
}

function setup2FAFormEventHandler() {
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
					console.log("2FA code has been validated by backend");

					console.log("trying to save the cookies");
					document.cookie = `accessToken=${data.access}; path=/; secure; SameSite=Strict`;
					document.cookie = `refreshToken=${data.refresh}; path=/; secure; SameSite=Strict`;
					// here we should store that JWT token in a cookie it is safer i think
					window.history.pushState({ page: "home" }, "home", "#home");
					loadPage("home");
					console.log("logged to home!");
				} else {
					showError('2FA verification failed.');
				}
			} catch (error) {
				showError('An error occurred during 2FA verification.');
			}
		})
		languageSelect.addEventListener("change", async (event) => {
			const selectedLanguage = event.target.value;
			setLanguageCookie(selectedLanguage);
			loadPage("login");
		});
	}
}

///////////////////// Main function /////////////////////

export function setLoginView(contentContainer) {
	setLoginViewHtml(contentContainer);
	setupLoginFormEventHandler();
	setup2FAFormEventHandler();
}
