import { loadPage } from "./app.js";
import { attachNavigationListeners } from "./app.js";

export function setLoginView(contentContainer) {

	contentContainer.innerHTML = `
		<div class="login-view">
			<h1 data-i18n="loginTitle">Login</h1>
			<form id="loginForm">
				<div class="mb-3">
					<label for="loginInput" class="form-label" data-i18n="username">Username</label>
					<input type="text" class="form-control" id="loginInput" placeholder="Enter your username">
				</div>
				<div class="mb-3">
					<label for="passwordInput" class="form-label" data-i18n="password">Password</label>
					<input type="password" class="form-control" id="passwordInput" placeholder="Enter your password">
				</div>
				<button type="submit" class="btn btn-primary" data-i18n="loginButton">Log In</button>
			</form>
			<p data-i18n="noAccount">Don’t have an account?
				<a href="#create-profile" id="createAccountLink" data-i18n="createAccountLink">Create one here</a>
			</p>
		</div>
	`;

	const loginForm = document.getElementById("loginForm");
	if (loginForm) {
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
}




export function setCreateProfileView(contentContainer) {
	contentContainer.innerHTML = `
		<div class="create-profile-view">
			<h1 data-i18n="createAccountTitle">Create Account</h1>
			<form id="createProfileForm">
				<div class="mb-3">
					<label for="newLoginInput" class="form-label" data-i18n="newLogin">Login</label>
					<input type="text" class="form-control" id="newLoginInput" placeholder="Choose a Login">
				</div>
				<div class="mb-3">
					<label for="newUsernameInput" class="form-label" data-i18n="newUsername">Username</label>
					<input type="text" class="form-control" id="newUsernameInput" placeholder="Choose a username">
				</div>
				<div class="mb-3">
					<label for="newMailInput" class="form-label" data-i18n="newMail">Mail</label>
					<input type="text" class="form-control" id="newMailInput" placeholder="Enter your mail">
				</div>
				<div class="mb-3">
					<label for="newPasswordInput" class="form-label" data-i18n="newPassword">Password</label>
					<input type="password" class="form-control" id="newPasswordInput" placeholder="Choose a password">
				</div>
				<div class="mb-3">
					<label for="confirmPasswordInput" class="form-label" data-i18n="confirmPassword">Confirm Password</label>
					<input type="password" class="form-control" id="confirmPasswordInput" placeholder="Re-enter your password">
				</div>
				<button type="submit" class="btn btn-primary" data-i18n="createAccountButton">Create Account</button>
			</form>
		</div>
	`;

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


