import { loadPage } from "./app.js";
import { translations } from "./language_pack.js";

function setCustomValidation(inputId) {
	const inputElement = document.getElementById(inputId);
	const currentLanguage = localStorage.getItem("language") || "en";
	if (!inputElement) {
		console.error(`Element with ID ${inputId} not found.`);
		return;
	}

	inputElement.addEventListener("invalid", (event) => {
		event.target.setCustomValidity(translations[currentLanguage].emptyField);
	});

	inputElement.addEventListener("input", (event) => {
		event.target.setCustomValidity("");
	});
}

function validateProfilePicture() {
	const profilePictureInput = document.getElementById("profilePictureInput");
	const currentLanguage = localStorage.getItem("language") || "en";
	const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;

	profilePictureInput.addEventListener("change", (event) => {
		const file = event.target.files[0];

		if (!allowedExtensions.test(file.name)) {
			profilePictureInput.setCustomValidity(translations[currentLanguage].invalidFormat);
		} else {
			profilePictureInput.setCustomValidity("");
		}
	});
}


function validatePasswordMatch() {
	const passwordInput = document.getElementById("newPasswordInput");
	const confirmPasswordInput = document.getElementById("confirmPasswordInput");
	const currentLanguage = localStorage.getItem("language") || "en";
	console.log("we have passwordInput.value = ", passwordInput.value, " and confirm = ", confirmPasswordInput.value);
	confirmPasswordInput.addEventListener("input", () => {
		if (passwordInput.value !== confirmPasswordInput.value) {
			confirmPasswordInput.setCustomValidity(translations[currentLanguage].passwordMismatch || "Passwords do not match");
		} else {
			confirmPasswordInput.setCustomValidity("");
		}
	});

	passwordInput.addEventListener("input", () => {
		if (passwordInput.value !== confirmPasswordInput.value) {
			confirmPasswordInput.setCustomValidity(translations[currentLanguage].passwordMismatch || "Passwords do not match");
		} else {
			confirmPasswordInput.setCustomValidity("");
		}
	});
}

export function setLoginView(contentContainer) {

	const currentLanguage = localStorage.getItem("language") || "en";
	contentContainer.innerHTML = `
		<div class="login-view">
			<h1 data-i18n="loginTitle">Login</h1>
			<form id="loginForm">
				<div class="mb-3">
					<label for="loginInput" class="form-label" data-i18n="username">Username</label>
					<input type="text" class="form-control" id="loginInput" placeholder="Enter your username" required>
				</div>
				<div class="mb-3">
					<label for="passwordInput" class="form-label" data-i18n="password">Password</label>
					<input type="password" class="form-control" id="passwordInput" placeholder="Enter your password" required>
				</div>
				<button type="submit" class="btn btn-primary" data-i18n="loginButton">Log In</button>
				<p class="error-message" id="errorMessage"></p>
				<div class="input-group" id="twoFaInput" style="display: none;">
					<label for="otpCode">2FA Code</label>
					<input type="text" id="otpCode" name="otpCode">
					<button type="button" onclick="verify2FA()" class="login-button">Verify 2FA</button>
				</div>
			</form>
			<p data-i18n="noAccount">Don’t have an account?
				<a href="#create-profile" id="createAccountLink" data-i18n="createAccountLink">Create one here</a>
			</p>
		</div>
	`;
	setCustomValidation("loginInput");
	setCustomValidation("passwordInput");

	const loginForm = document.getElementById("loginForm");
	loginForm.addEventListener("submit", (event) => {
		event.preventDefault();
		const newPage = "home"
		loadPage(newPage);
		window.history.pushState({ page: newPage }, newPage, "#" + newPage);
		localStorage.setItem("isLoggedIn", "true");
		loadPage("home");
		console.log("need to check the login and password with database");
	});
}






export function setCreateProfileView(contentContainer) {
	contentContainer.innerHTML = `
		<div class="create-profile-view">
			<h1 data-i18n="createAccountTitle">Create Account</h1>
			<form id="createProfileForm">
				<div class="mb-3">
					<label for="newLoginInput" class="form-label" data-i18n="newLogin">Login</label>
					<input type="text" class="form-control" id="newLoginInput" placeholder="Choose a Login" required>
				</div>
				<div class="mb-3">
					<label for="newUsernameInput" class="form-label" data-i18n="newUsername">Username</label>
					<input type="text" class="form-control" id="newUsernameInput" placeholder="Choose a username" required>
				</div>
				<div class="mb-3">
					<label for="newMailInput" class="form-label" data-i18n="newMail">Mail</label>
					<input type="text" class="form-control" id="newMailInput" placeholder="Enter your mail" required>
				</div>
				<div class="mb-3">
					<label for="newPasswordInput" class="form-label" data-i18n="newPassword">Password</label>
					<input type="password" class="form-control" id="newPasswordInput" placeholder="Choose a password" required>
				</div>
				<div class="mb-3">
					<label for="confirmPasswordInput" class="form-label" data-i18n="confirmPassword">Confirm Password</label>
					<input type="password" class="form-control" id="confirmPasswordInput" placeholder="Re-enter your password" required>
				</div>
				<div class="mb-3">
						<label for="profilePictureInput" class="form-label" data-i18n="profilePicture">Profile Picture</label>
						<input type="file" class="form-control" id="profilePictureInput" accept=".jpg, .jpeg, .png">
						<small class="form-text text-muted" data-i18n="profilePictureHint">Only .jpg and .png files are allowed.</small>
				</div>
				<button type="submit" class="btn btn-primary" data-i18n="createAccountButton">Create Account</button>
			</form>
		</div>
	`;

	setCustomValidation("newLoginInput");
	setCustomValidation("newUsernameInput");
	setCustomValidation("newMailInput");
	setCustomValidation("newPasswordInput");

	validatePasswordMatch();
	validateProfilePicture();
	//photo de profile pas obligatoire, en mettre une par defaut si pas de pp
	const createProfileForm = document.getElementById("createProfileForm");
	if (createProfileForm) {
		createProfileForm.addEventListener("submit", (event) => {
			event.preventDefault();
			const newPage = "login"
			loadPage(newPage);
			window.history.pushState({ page: newPage }, newPage, "#" + newPage);
			loadPage("login");
			console.log("Create Account button clicked! Implement account creation logic here.");
		});
	}
}
