import { setRegisterViewHtml } from './login_html.js';

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
	const registerForm = document.getElementById("registerForm");
	if (registerForm) {
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
}

///////////////////// Main function /////////////////////

export function setRegisterView(contentContainer) {
	setRegisterViewHtml(contentContainer);
	setupRegisterFormEventHandler();
}
