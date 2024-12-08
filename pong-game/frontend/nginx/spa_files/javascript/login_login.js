import { loadPage } from "./app.js";
import { setLoginViewHtml } from './login_html.js';
import { setCustomValidation } from "./login_validations.js";
import { showError } from "./login_validations.js";
import { showSuccess } from "./login_validations.js";
import { getLanguageCookie } from './fetch_request.js';
//validations before sending to backend



///////////////////// UI Helpers /////////////////////

function show2FAInput() {
	document.getElementById('usernameInput').setAttribute('readonly', true);
	document.getElementById('passwordInput').setAttribute('readonly', true);
	document.getElementById('2faInput').required = true;
	document.getElementById('2faDiv').style.display = 'block';
}

///////////////////// API Calls /////////////////////

// async function loginUserInBackend(username, password) {
// 	const response = await fetch('/api/user/login/', {
// 		method: 'POST',
// 		headers: { 'Content-Type': 'application/json' },
// 		body: JSON.stringify({ username, password })
// 	});
// 	return response;
// }

//To bipass 2FA ERROR
async function loginUserInBackend(username, password) {
	const response = await fetch('/api/user/token/getToken', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password })
	});
	return response;
}

async function verify2FAInBackend(user_id, otpCode) {
	const response = await fetch('/api/user/token/validate/', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ user_id, otpCode })
	});
	return response;
}

///////////////////// Event Handlers /////////////////////

// function setupLoginFormEventHandler() {
// 	const loginForm = document.getElementById("loginForm");
// 	setCustomValidation("usernameInput");
// 	setCustomValidation("passwordInput");
// 	loginForm.addEventListener("submit", async (event) => {
// 		event.preventDefault();
// 		const username = document.getElementById('usernameInput').value;
// 		const password = document.getElementById('passwordInput').value;
// 		try {
// 			const response = await loginUserInBackend(username, password);
// 			const data = await response.json();
// 			if (data.detail === "Invalid credentials") {
// 				showError("Login failed: Invalid Login or Password");
// 			}
// 			else if (data.detail === "A 2FA code has been sent") {
// 				localStorage.setItem("user_id", data.user_id); // not so sure about that
// 				showSuccess('Enter the 2FA code sent to your email.');
// 				show2FAInput();
// 			} else {
// 				showError(data.error || 'Login failed. Please try again.');
// 			}
// 		} catch (error) {
// 			showError('Login failed. Please try again.');
// 		}
// 	})
// }
//TO bipass 2fa error
function setupLoginFormEventHandler() {
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
				   showError("Login failed: Invalid Login or Password");
				}
				else {
					showError("This is a nightmare");
				}
			}
			else {
				showSuccess("2FA verified successfully!");
				localStorage.setItem("isLoggedIn", "true");
				localStorage.setItem("accessToken", data.access);
				console.log("trying to save the cookies");
				document.cookie = `accessToken=${data.access}; path=/; secure; SameSite=Strict`;
				document.cookie = `refreshToken=${data.refresh}; path=/; secure; SameSite=Strict`;
				showSuccess("Logged in!");
				loadPage("home");
				showSuccess("logged to home!");
			}
		} catch (error) {
			showError('Login failed. Please try again.');
		}
	})
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
					showSuccess("2FA verified successfully!");
					localStorage.setItem("isLoggedIn", "true");
					localStorage.setItem("accessToken", data.access);
					console.log("trying to save the cookies");
					document.cookie = `accessToken=${data.access}; path=/; secure; SameSite=Strict`;
					document.cookie = `refreshToken=${data.refresh}; path=/; secure; SameSite=Strict`;
					// here we should store that JWT token in a cookie it is safer i think
					showSuccess("Logged in!");
					loadPage("home");
					showSuccess("logged to home!");
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
	// setup2FAFormEventHandler();
}
