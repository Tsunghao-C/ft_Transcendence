import { loadPage } from "./app.js";
import { setLoginViewHtml } from './profile_html.js';

///////////////////// UI Helpers /////////////////////

function showError(message) {
	console.error('Error:', error); // /!\ can be deleted in production
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
}

function showSuccess(message) {
	console.log(message) // /!\ can be deleted in production
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = message;
}

function show2FAInput() {
	document.getElementById('usernameInput').setAttribute('readonly', true);
	document.getElementById('passwordInput').setAttribute('readonly', true);
	document.getElementById('2faInput').required = true;
	document.getElementById('2faDiv').style.display = 'block';
}

///////////////////// API Calls /////////////////////

async function loginUserInBackend(username, password) {
	const response = await fetch('http://localhost:8000/api/user/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
	});
	return response;
}

async function verify2FAInBackend(user_id, otpCode) {
    const response = await fetch('http://localhost:8000/api/user/token/validate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, otpCode })
    });
    return response;
}

///////////////////// Event Handlers /////////////////////

function setupLoginFormEventHandler() {
	const loginForm = document.getElementById("loginForm");
	if (loginForm) {
		loginForm.addEventListener("submit", async (event) => {
			event.preventDefault();
			const username = document.getElementById('usernameInput').value;
			const password = document.getElementById('passwordInput').value;
			try {
				const response = await loginUserInBackend(username, password);
				const data = await response.json();
				if (response.ok && data.detail === "A 2FA code has been sent") {
					localStorage.setItem("user_id", data.user_id);
					showSuccess('Enter the 2FA code sent to your email.');
					show2FAInput();
				} else {
                    showError(data.error || 'Login failed. Please try again.');
				}
			} catch (error) {
				showError(data.error || 'Login failed. Please try again.');
			}
		})
	}
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
				if (response.ok && data.detail === "2FA code validated") {
					showSuccess("2FA verified successfully!");
                    localStorage.setItem("isLoggedIn", "true");
                    loadPage("home");
				} else {
                    showError('2FA verification failed.');
				}
			} catch (error) {
				showError('An error occurred during 2FA verification.');
			}
		})
	}
}

///////////////////// Main function /////////////////////

export function setLoginView(contentContainer) {
	setLoginViewHtml(contentContainer);
	setupLoginFormEventHandler();
	setup2FAFormEventHandler();
}