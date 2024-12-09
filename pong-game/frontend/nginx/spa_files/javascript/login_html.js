import { translations } from "./language_pack.js";
import { getLanguageCookie } from './fetch_request.js';

async function loadHtml(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
        const text = await response.text();
        console.log(`Content loaded from ${url}:\n\n`, text); // Log pour vérifier le contenu
        return text;
    } catch (error) {
        console.error(`Error loading ${url}:`, error);
        return ''; // Retourne une chaîne vide en cas d'erreur
    }
}

// export async function setLoginViewHtml(contentContainer) {
//     try {
//         const htmlContent = await loadHtml('./html/login_view.html');
//         contentContainer.innerHTML = htmlContent;
//     } catch (error) {
//         console.error('Error loading login view:', error);
//     }
// }

// export async function setRegisterViewHtml(contentContainer) {
//     try {
//         const htmlContent = await loadHtml('./html/register_view.html');
//         contentContainer.innerHTML = htmlContent;
//     } catch (error) {
//         console.error('Error loading register view:', error);
//     }
// }

export function setLoginViewHtml(contentContainer) {
	const currentLanguage = getLanguageCookie() || "en";
	contentContainer.innerHTML = `
		<div class="login-view">
				<h1>pQnGx</h1>
				<h2 data-i18n="loginTitle">Login</h2>
				<form id="loginForm">
						<label for="usernameInput" class="form-label" data-i18n="username">Username</label>
						<input type="text" class="form-control" id="usernameInput" placeholder="Enter your username" required>
						<label for="passwordInput" class="form-label" data-i18n="password">Password</label>
						<input type="password" class="form-control" id="passwordInput" placeholder="Enter your password" required>
					<div>
						<p id="errorMessage"></p>
						<p id="successMessage"></p>
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
				<select id="languageSelect" class="form-select mt-2">
					<option value="en" data-i18n="english">English</option>
					<option value="fr" data-i18n="francais">Français</option>
					<option value="pt" data-i18n="Português">Português</option>
				</select>
		</div>
	`;
}

export function setRegisterViewHtml(contentContainer) {
	contentContainer.innerHTML = `
			<div class="register-view">
				<h1>pQnGx</h1>
				<h2 data-i18n="registerTitle">Register</h2>
				<form id="registerForm">
						<label for="newUsername" class="form-label" data-i18n="newUsername">Login</label>
						<input type="text" class="form-control" id="newUsername" placeholder="Choose a Login" required>
						<label for="newAlias" class="form-label" data-i18n="newAlias">Alias</label>
						<input type="text" class="form-control" id="newAlias" placeholder="Choose an alias" required>
						<label for="newMailInput" class="form-label" data-i18n="newMail">Mail</label>
						<input type="text" class="form-control" id="newMailInput" placeholder="Enter your mail" required>
						<label for="newPasswordInput" class="form-label" data-i18n="newPassword">Password</label>
						<input type="password" class="form-control" id="newPasswordInput" placeholder="Choose a password" required>
						<label for="confirmPasswordInput" class="form-label" data-i18n="confirmPassword">Confirm Password</label>
						<input type="password" class="form-control" id="confirmPasswordInput" placeholder="Re-enter your password" required>
						<label for="profilePictureInput" class="form-label" data-i18n="profilePicture">Profile Picture</label>
						<input type="file" class="form-control" id="profilePictureInput" accept=".jpg, .jpeg, .png">
						<small class="form-text text-muted" data-i18n="profilePictureHint">Only .jpg and .png files are allowed.</small>
					<div>
						<p id="errorMessage"></p>
						<p id="successMessage"></p>
					</div>
					<button type="submit" class="btn btn-primary" data-i18n="registerButton">Register</button>
					<a href="#login" class="btn btn-primary">Back to log in</a>
				</form>
				<select id="languageSelect" class="form-select mt-2">
					<option value="en" data-i18n="english">English</option>
					<option value="fr" data-i18n="francais">Français</option>
					<option value="pt" data-i18n="Português">Português</option>
				</select>
			</div>
	`;
}
