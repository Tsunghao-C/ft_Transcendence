import { translations as trsl } from "./language_pack.js";
import { loadPage } from "./app.js";
import { fetchWithToken } from "./fetch_request.js";
import { setLanguageCookie } from "./fetch_request.js";
import { state } from "./app.js";
//  import { showError, showSuccess } from "./login_validations.js";

function emptyMessage(elemId) {
	const containter = document.getElementById(elemId)
	containter.textContent = "";
}

function showMessage(message, elemId) {
	const containter = document.getElementById(elemId)
	containter.textContent = message;
}

function languageEventListener() {
	const languageSelect = document.getElementById("languageSelect");
	languageSelect.value = state.language;
	languageSelect.addEventListener("change", async (event) => {
		state.language = event.target.value;
		await fetchWithToken('/api/user/change-language/', JSON.stringify({ newLang: state.language }), 'POST');
		setLanguageCookie(state.language);
		loadPage("personal-data");
	});
}

export async function setpersonalDataView(contentContainer) {
	let personal;
	let response;
	try {
		response = await fetchWithToken('/api/user/getuser/');
		personal = await response.json();
		console.log("User data: ", personal);
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
	}

	contentContainer.innerHTML = `
		<div class="personal-data-view">
			<h2>${trsl[state.language].personnalData}</h2>
			<div class="pp-and-login">
				<div>
					<img
						src="${personal.avatar}"
						alt="Profile Picture"
						class="img-thumbnail"
						id="profilePicturePreview"
						style="max-width: 150px; cursor: pointer;"
						title="Click to change"
					>
					<input
						type="file"
						id="profilePictureInput"
						accept=".jpg, .jpeg, .png"
						style="display: none;"
					>
				</div>
				<div class="ms-3">
					<label class="form-label">${trsl[state.language].loginInput}</label>
					<input type="text" class="form-control" value="${personal.username}" readonly>
				</div>
			</div>
			<form id="personalDataForm">
				<hr>
				<div class="mb-3">
					<label for="aliasInput" class="form-label">${trsl[state.language].alias}</label>
					<div class="input-group">
						<input type="text" class="form-control" id="aliasInput" value="${personal.alias}" required>
						<div>
							<p id="aliasError" class="errorMessage"></p>
							<p id="aliasSuccess" class="successMessage"></p>
						</div>
						<button class="btn btn-success" type="button" id="aliasChangeButton">${trsl[state.language].confirm}</button>
					</div>
				</div>
				<hr>
				<div class="mb-3">
					<label for="mailInput" class="form-label">${trsl[state.language].mail}</label>
					<div class="input-group">
						<input type="email" class="form-control" id="mailInput" value="${personal.email}" required>
						<div>
							<p id="emailError" class="errorMessage"></p>
							<p id="emailSuccess" class="successMessage"></p>
						</div>
						<button class="btn btn-success" type="button" id="emailChangeButton">${trsl[state.language].confirm}</button>
					</div>
				</div>
				<hr>
				<div class="mb-3">
					<label for="aliasInput" class="form-label">${trsl[state.language].password}</label>
					<button type="button" class="btn btn-warning" id="changePasswordButton">${trsl[state.language].changePassword}</button>
				</div>

				<div id="passwordChangeFields" style="display: none;">
					<div class="mb-3">
						<label for="oldPasswordInput" class="form-label">${trsl[state.language].oldPassword}</label>
						<input type="password" class="form-control" id="oldPasswordInput" required>
					</div>
					<div class="mb-3">
						<label for="newPasswordInput" class="form-label">${trsl[state.language].newPassword}</label>
						<input type="password" class="form-control" id="newPasswordInput" required>
					</div>
					<div class="mb-3">
						<label for="confirmPasswordInput" class="form-label">${trsl[state.language].confirmNewPassword}</label>
						<input type="password" class="form-control" id="confirmPasswordInput" required>
					</div>
					<div>
						<p id="passwordError" class="errorMessage"></p>
						<p id="passwordSuccess" class="successMessage"></p>
					</div>
					<button type="button" class="btn btn-success" id="confirmPasswordChangeButton">${trsl[state.language].confirm}</button>
				</div>
				<hr>
				<label for="aliasInput" class="form-label" data-i18n="language">${trsl[state.language].language}</label>
				<select id="languageSelect">
					<option value="en">English</option>
					<option value="fr">Français</option>
					<option value="pt">Português</option>
				</select>
			</form>
		</div>
	`;

	const profilePicturePreview = document.getElementById("profilePicturePreview");
	const profilePictureInput = document.getElementById("profilePictureInput");
	profilePicturePreview.addEventListener("click", () => profilePictureInput.click());


	profilePictureInput.addEventListener("change", async (event) => {
		const file = event.target.files[0];

		if (file) {
			if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
				alert(`${trsl[state.language].invalidFormat}`);
				return;
			}

			const reader = new FileReader();
			reader.readAsDataURL(file);

			const formData = new FormData();
			formData.append('avatar', file);

			try {
				const response = await fetchWithToken("api/user/change-avatar/", formData, 'POST', false);
				if (response.ok) {
					console.log("Avatar uploaded successfully:", response);
					// alert("message for successs");
					loadPage("personal-data");
				} else {
					console.log("Error uploading avatar:", response);
					alert(trsl[state.language].errorUploading);
				}
			} catch(error) {
				console.log(error);
				window.location.hash = "login";
			}
		}
	});

	document.getElementById("aliasChangeButton").addEventListener("click", async () => {
		const newAlias = document.getElementById("aliasInput").value;
		try {
			const response = await fetchWithToken('/api/user/change-alias/', JSON.stringify({ alias: newAlias }), 'POST');
			const data = await response.json();
			if (response.ok && data.detail === "alias successfully changed") {
				emptyMessage("aliasError");
				showMessage(trsl[state.language].aliasChanged, "aliasSuccess");
			} else {
				emptyMessage("aliasSuccess");
				if (data.error) {
					if (data.error === "alias is already in use") {
						showMessage(trsl[state.language].aliasTaken, "aliasError");
					} else if (data.error === "this alias contains bad language") {
						showMessage(`${trsl[state.language].alias} ${trsl[state.language].badLanguage} `, "aliasError");
					}
				} else {
					showMessage(trsl[state.language].IncorrectValue, "aliasError");
				}
			}
		} catch(error) {
			console.log(error);
			window.location.hash = "login";
		}
	});

	document.getElementById("emailChangeButton").addEventListener("click", async () => {
		const newEmail = document.getElementById("mailInput").value;
		try {
			const response = await fetchWithToken('/api/user/change-email/', JSON.stringify({ "new_email": newEmail }), 'POST');
			const data = await response.json();
			if (response.ok && data.detail === "email change success") {
				emptyMessage("emailError");
				showMessage(trsl[state.language].mailChanged, "emailSuccess");
			} else {
				emptyMessage("emailSuccess");
				if (data.error) {
					if (data.error === "invalid email format") {
						showMessage(`${trsl[language].invalidMail}`, "emailError");
					} else if (data.error === "user with this email already exists.") {
						showMessage(`${trsl[language].emailTaken}`, "emailError");
					}
				} else {
					showMessage(trsl[state.language].IncorrectValue, "emailError");
				}
			}
		} catch(error) {
			console.log(error);
			window.location.hash = "login";
		}
	});

	document.getElementById("changePasswordButton").addEventListener("click", () => {
		const passwordFields = document.getElementById("passwordChangeFields");
		passwordFields.style.display = passwordFields.style.display === "none" ? "block" : "none";
	});

	document.getElementById("confirmPasswordChangeButton").addEventListener("click", async () => {
		const oldPassword = document.getElementById("oldPasswordInput").value;
		const newPassword = document.getElementById("newPasswordInput").value;
		const confirmPassword = document.getElementById("confirmPasswordInput").value;

		if (newPassword !== confirmPassword) {
			emptyMessage("passwordSuccess");
			showMessage(trsl[state.language].passwordMismatch, "passwordError");
			return;
		}

		try {
			const response = await fetchWithToken('/api/user/change-password/', JSON.stringify({ old_password: oldPassword, new_password: newPassword }), 'POST');
			const data = await response.json();
			if (response.ok && data.detail === "Password changed successfully") {
				emptyMessage("passwordError");
				showMessage(trsl[language].passwordChanged, "passwordSuccess");
			} else {
				emptyMessage("passwordSuccess");
				if (data.error) {
					showMessage(trsl[language].passwordRule, "passwordError");
				} else {
					showMessage(trsl[state.language].IncorrectValue, "passwordError");
				}
			}
		} catch(error) {
			console.log(error);
			window.location.hash = "login";
		}
	});

	languageEventListener();
}



