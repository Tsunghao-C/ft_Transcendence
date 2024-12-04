import { setRegisterViewHtml } from './login_html.js';
import { showError } from './login_validations.js';
import { showSuccess } from './login_validations.js';
///////////////////// UI Helpers /////////////////////

///////////////////// API Calls /////////////////////

async function registerUserInBackend(username, password, email, alias) {
    const response = await fetch('/api/user/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, alias })
    });
    return response;
}

///////////////////// Event Handlers /////////////////////

function setupRegisterFormEventHandler() {
	setCustomValidation("newLoginInput");
	setCustomValidation("newUsernameInput");
	setCustomValidation("newMailInput");
	setCustomValidation("newPasswordInput");

	validatePasswordMatch();
	validateProfilePicture();
	const registerForm = document.getElementById("registerForm");
	registerForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const username = document.getElementById('newUsername').value;
		const alias = document.getElementById('newAlias').value;
		const email = document.getElementById('newMailInput').value;
		const password = document.getElementById('newPasswordInput').value;
		try {
			const response = await registerUserInBackend(username, password, email, alias);
			const data = await response.json();
			if (response.ok) {
				showSuccess('Success! User profile has been created, you can now log in.');
			} else {
				showError(data.error || "Login failed. Please try again.");
			}
		} catch (error) {
			showError('An error occurred. Please try again later.');
		}
	});
}

///////////////////// Main function /////////////////////

export function setRegisterView(contentContainer) {
	setRegisterViewHtml(contentContainer);
	setupRegisterFormEventHandler();
}
