// async function loadHtmlxxx(url) {
//     try {
//         const response = await fetch(url);
//         if (!response.ok) {
//             throw new Error(`Failed to load ${url}: ${response.statusText}`);
//         }
//         const text = await response.text();
//         console.log(`Content loaded from ${url}:\n\n\n`, text); // Log pour vérifier le contenu
//         return text;
//     } catch (error) {
//         console.error(`Error loading ${url}:`, error);
//         return ''; // Retourne une chaîne vide en cas d'erreur
//     }
// }

// export async function setLoginViewHtml(contentContainer) {
//     try {
//         const htmlContent = await loadHtmlxxx('./login_view.html'); // Remplacez par le chemin réel
//         contentContainer.innerHTML = htmlContent;
//     } catch (error) {
//         console.error('Error loading login view:', error);
//     }
// }

// export async function setRegisterViewHtml(contentContainer) {
//     try {
//         const htmlContent = await loadHtmlxxx('./register_view.html'); // Remplacez par le chemin réel
//         contentContainer.innerHTML = htmlContent;
//     } catch (error) {
//         console.error('Error loading register view:', error);
//     }
// }

export function setLoginViewHtml(contentContainer) {
	contentContainer.innerHTML = `
		<div class="centered-box login-view">
			<h1 id="block-title">ponGx</h1>
			<h2 data-i18n="loginTitle">Login</h2>
			<form id="loginForm">
				<div class="mb-3">
					<label for="usernameInput" class="form-label" data-i18n="username">Username</label>
					<input type="text" class="form-control" id="usernameInput" placeholder="Enter your username">
				</div>
				<div class="mb-3">
					<label for="passwordInput" class="form-label" data-i18n="password">Password</label>
					<input type="password" class="form-control" id="passwordInput" placeholder="Enter your password">
				</div>
				<div>
					<p id="errorMessage"></p>
					<p id="successMessage"></p>
				</div>
				<button type="submit" class="btn btn-light" data-i18n="loginButton">Log In</button>
			</form>
			<form id="2faForm">
				<div class="mb-3" id="2faDiv" style="display: none;">
					<label for="2faInput" class="form-label" data-i18n="2fa">2FA Code</label>
					<input type="text" class="form-control" id="2faInput" placeholder="Enter 2FA Code">
					<button type="submit" class="btn btn-primary" class="login-button">Verify 2FA</button>
				</div>
			</form>
			<p data-i18n="noAccount">Don’t have an account?
				<a href="#register" id="registerLink" data-i18n="registerLink">Create one here</a>
			</p>
		</div>
	`;
}

export function setRegisterViewHtml(contentContainer) {
	contentContainer.innerHTML = `
		<div class="centered-box register-view">
			<h1 data-i18n="registerTitle">Register</h1>
			<form id="registerForm">
				<div class="mb-3">
					<label for="newUsername" class="form-label" data-i18n="newUsername">Login</label>
					<input type="text" class="form-control" id="newUsername" placeholder="Choose a Login">
				</div>
				<div class="mb-3">
					<label for="newAlias" class="form-label" data-i18n="newAlias">Alias</label>
					<input type="text" class="form-control" id="newAlias" placeholder="Choose an alias">
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
				<div>
					<p id="errorMessage"></p>
					<p id="successMessage"></p>
				</div>
				<button type="submit" class="btn btn-primary" data-i18n="registerButton">Register</button>
			</form>
		</div>
	`;
}