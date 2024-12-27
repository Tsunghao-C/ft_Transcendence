import { translations } from "./language_pack.js";
import { getLanguageCookie } from './fetch_request.js';

export function setRegisterViewHtml(contentContainer) {
	const currentLanguage = getLanguageCookie() || "en";
	contentContainer.innerHTML = `
			<div class="register-view">
				<h1>pQnGx</h1>
				<select id="languageSelect">
					<option value="en" data-i18n="english">En</option>
					<option value="fr" data-i18n="francais">Fr</option>
					<option value="pt" data-i18n="Português">Pt</option>
				</select>
				<h2 data-i18n="registerTitle">Register</h2>
				<form id="registerForm">
						<label for="newUsername" class="form-label" data-i18n="newUsername">Login</label>
						<input type="text" class="form-control" id="newUsername" placeholder="Choose a Login" required>
						<label for="newAlias" class="form-label" data-i18n="newAlias">Alias</label>
						<input type="text" class="form-control" id="newAlias" placeholder="Choose an alias" required>
						<label for="newMailInput" class="form-label" data-i18n="newMail">Mail</label>
						<input type="text" class="form-control" id="newMailInput" placeholder="Enter your mail" required>
						<label for="newPasswordInput" class="form-label" data-i18n="password">Password</label>
						<input type="password" class="form-control" id="newPasswordInput" placeholder="Choose a password" required>
						<label for="confirmPasswordInput" class="form-label" data-i18n="confirmPassword">Confirm Password</label>
						<input type="password" class="form-control" id="confirmPasswordInput" placeholder="Re-enter your password" required>
					<div>
						<p id="errorMessage" class="errorMessage"></p>
						<p id="successMessage" class="successMessage"></p>
					</div>
					<button type="submit" class="btn btn-primary" data-i18n="registerButton">Register</button>
				</form>
				<p>${translations[currentLanguage].alreadyAccount}
					<a href="#login" id="loginLink">${translations[currentLanguage].loginLink}</a>
				</p>
			</div>
	`;
}

export function setLoginViewHtml(contentContainer) {
	const currentLanguage = getLanguageCookie() || "en";
	contentContainer.innerHTML = `
		<div class="login-view">
				<h1>pQnGx</h1>
				<select id="languageSelect">
					<option value="en">En</option>
					<option value="fr">Fr</option>
					<option value="pt">Pt</option>
				</select>
				<h2 data-i18n="loginTitle">Login</h2>
				<form id="loginForm">
						<label for="usernameInput" class="form-label" data-i18n="username">Username</label>
						<input type="text" class="form-control" id="usernameInput" placeholder="Enter your username" required>
						<label for="passwordInput" class="form-label" data-i18n="password">Password</label>
						<input type="password" class="form-control" id="passwordInput" placeholder="Enter your password" required>
					<div>
						<p id="errorMessage" class="errorMessage"></p>
						<p id="successMessage" class="successMessage"></p>
					</div>
					<button type="submit" class="btn btn-light" data-i18n="loginButton">Log In</button>
				</form>
				<form id="2faForm">
					<div id="2faDiv" style="display: none;">
						<label for="2faInput" class="form-label" data-i18n="2fa">2FA Code</label>
						<input type="text" class="form-control" id="2faInput" placeholder="Enter 2FA Code">
						<button type="submit" class="btn btn-primary" class="login-button">Verify 2FA</button>
					</div>
				</form>
				<p>${translations[currentLanguage].noAccount}
					<a href="#register" id="registerLink">${translations[currentLanguage].registerLink}</a>
				</p>
		</div>
	`;
}