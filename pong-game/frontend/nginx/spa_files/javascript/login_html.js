import { translations as trsl } from "./language_pack.js";
import { getLanguageCookie } from './fetch_request.js';

export function setRegisterViewHtml(contentContainer) {
	const currentLanguage = getLanguageCookie() || "en";
	contentContainer.innerHTML = `
			<div class="register-view">
				<h1>pQnGx</h1>
				<select id="languageSelect">
					<option value="en" >En</option>
					<option value="fr" >Fr</option>
					<option value="pt" >Pt</option>
				</select>
				<h2 data-i18n="registerTitle">Register</h2>
				<form id="registerForm">
						<label for="newUsername" class="form-label" >${trsl[currentLanguage].loginInput}</label>
						<input type="text" class="form-control" id="newUsername" placeholder="${trsl[currentLanguage].chooseLogin}" required>
						<label for="newAlias" class="form-label" data-i18n="newAlias">${trsl[currentLanguage].alias}</label>
						<input type="text" class="form-control" id="newAlias" placeholder="${trsl[currentLanguage].chooseAlias}" required>
						<label for="newMailInput" class="form-label" >${trsl[currentLanguage].mail}</label>
						<input type="text" class="form-control" id="newMailInput" placeholder="${trsl[currentLanguage].enterMail}" required>
						<label for="newPasswordInput" class="form-label" >${trsl[currentLanguage].password}</label>
						<input type="password" class="form-control" id="newPasswordInput" placeholder="${trsl[currentLanguage].choosePassword}" required>
						<label for="confirmPasswordInput" class="form-label" >${trsl[currentLanguage].confirmPassword}</label>
						<input type="password" class="form-control" id="confirmPasswordInput" placeholder="${trsl[currentLanguage].reenterPassword}" required>
					<div>
						<p id="errorMessage" class="errorMessage"></p>
						<p id="successMessage" class="successMessage"></p>
					</div>
					<button type="submit" class="btn btn-primary" >${trsl[currentLanguage].registerButton}</button>
				</form>
				<p>${trsl[currentLanguage].alreadyAccount}
					<a href="#login" id="loginLink">${trsl[currentLanguage].loginLink}</a>
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
				<h2>${trsl[currentLanguage].loginTitle}</h2>
				<form id="loginForm">
						<label for="usernameInput" class="form-label">${trsl[currentLanguage].loginInput}</label>
						<input type="text" class="form-control" id="usernameInput" placeholder="${trsl[currentLanguage].enterLogin}" required>
						<label for="passwordInput" class="form-label">${trsl[currentLanguage].password}</label>
						<input type="password" class="form-control" id="passwordInput" placeholder="${trsl[currentLanguage].enterPassword}" required>
					<div>
						<p id="errorMessage" class="errorMessage"></p>
						<p id="successMessage" class="successMessage"></p>
					</div>
					<button type="submit" class="btn btn-light">${trsl[currentLanguage].login}</button>
				</form>
				<form id="2faForm">
					<div id="2faDiv" style="display: none;">
						<label for="2faInput" class="form-label">${trsl[currentLanguage].twoFactorCode}</label>
						<input type="text" class="form-control" id="2faInput" placeholder="${trsl[currentLanguage].enter2FA}">
						<button type="submit" class="btn btn-primary" class="login-button">${trsl[currentLanguage].check2FA}</button>
					</div>
				</form>
				<p>${trsl[currentLanguage].noAccount}
					<a href="#register" id="registerLink">${trsl[currentLanguage].registerLink}</a>
				</p>
		</div>
	`;
}