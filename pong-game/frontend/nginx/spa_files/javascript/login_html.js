import { translations as trsl } from "./language_pack.js";
import { state } from "./app.js";

export function setRegisterViewHtml(contentContainer) {
	contentContainer.innerHTML = `
			<div class="register-view">
				<h1>pQnGx</h1>
				<select id="languageSelect">
					<option value="en" >En</option>
					<option value="fr" >Fr</option>
					<option value="pt" >Pt</option>
				</select>
				<h2>${trsl[state.language].registerTitle}</h2>
				<form id="registerForm">
						<label for="newUsername" class="form-label" >${trsl[state.language].loginInput}</label>
						<input type="text" class="form-control" id="newUsername" placeholder="${trsl[state.language].chooseLogin}" required>
						<label for="newAlias" class="form-label">${trsl[state.language].alias}</label>
						<input type="text" class="form-control" id="newAlias" placeholder="${trsl[state.language].chooseAlias}" required>
						<label for="newMailInput" class="form-label" >${trsl[state.language].mail}</label>
						<input type="text" class="form-control" id="newMailInput" placeholder="${trsl[state.language].enterMail}" required>
						<label for="newPasswordInput" class="form-label" >${trsl[state.language].password}</label>
						<input type="password" class="form-control" id="newPasswordInput" placeholder="${trsl[state.language].choosePassword}" required>
						<label for="confirmPasswordInput" class="form-label" >${trsl[state.language].confirmPassword}</label>
						<input type="password" class="form-control" id="confirmPasswordInput" placeholder="${trsl[state.language].reenterPassword}" required>
					<div>
						<p id="errorMessage" class="errorMessage"></p>
						<p id="successMessage" class="successMessage"></p>
					</div>
					<button type="submit" class="btn btn-primary" >${trsl[state.language].registerButton}</button>
				</form>
				<p>${trsl[state.language].alreadyAccount}
					<a href="#login" id="loginLink">${trsl[state.language].loginLink}</a>
				</p>
			</div>
	`;
}

export function setLoginViewHtml(contentContainer) {
	contentContainer.innerHTML = `
		<div class="login-view">
				<h1>pQnGx</h1>
				<select id="languageSelect">
					<option value="en">En</option>
					<option value="fr">Fr</option>
					<option value="pt">Pt</option>
				</select>
				<h2>${trsl[state.language].loginTitle}</h2>
				<form id="loginForm">
						<label for="usernameInput" class="form-label">${trsl[state.language].loginInput}</label>
						<input type="text" class="form-control" id="usernameInput" placeholder="${trsl[state.language].enterLogin}" required>
						<label for="passwordInput" class="form-label">${trsl[state.language].password}</label>
						<input type="password" class="form-control" id="passwordInput" placeholder="${trsl[state.language].enterPassword}" required>
					<div>
						<p id="errorMessage" class="errorMessage"></p>
						<p id="successMessage" class="successMessage"></p>
					</div>
					<button type="submit" class="btn btn-light">${trsl[state.language].login}</button>
				</form>
				<form id="2faForm">
					<div id="2faDiv" style="display: none;">
						<label for="2faInput" class="form-label">${trsl[state.language].twoFactorCode}</label>
						<input type="text" class="form-control" id="2faInput" placeholder="${trsl[state.language].enter2FA}">
						<button type="submit" class="btn btn-primary" class="login-button">${trsl[state.language].check2FA}</button>
					</div>
				</form>
				<p>${trsl[state.language].noAccount}
					<a href="#register" id="registerLink">${trsl[state.language].registerLink}</a>
				</p>
		</div>
	`;
}
