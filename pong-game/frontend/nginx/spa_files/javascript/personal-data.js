import { translations } from "./language_pack.js";
import { loadPage } from "./app.js";
import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from './fetch_request.js';
import { setLanguageCookie } from "./fetch_request.js";
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
    languageSelect.value = getLanguageCookie() || "en";
    languageSelect.addEventListener("change", async (event) => {
        const selectedLanguage = event.target.value;
        console.log("selected language is : " + selectedLanguage)
        await fetchWithToken('/api/user/change-language/', JSON.stringify({ newLang: selectedLanguage }), 'POST');
        setLanguageCookie(selectedLanguage);
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

    const cl = getLanguageCookie() ||  "en";
    
    contentContainer.innerHTML = `
        <div class="personal-data-view">
            <h2 data-i18n="personalDataTitle">${translations[cl].personalData}</h2>
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
                    <label class="form-label" data-i18n="login">${translations[cl].username}</label>
                    <input type="text" class="form-control" value="${personal.username}" readonly>
                </div>
            </div>
            <form id="personalDataForm">
                <hr>
                <div class="mb-3">
                    <label for="aliasInput" class="form-label" data-i18n="alias">${translations[cl].newAlias}</label>
                    <div class="input-group">
                        <input type="text" class="form-control" id="aliasInput" value="${personal.alias}" required>
                        <div>
                            <p id="aliasError" class="errorMessage"></p>
                            <p id="aliasSuccess" class="successMessage"></p>
                        </div>
                        <button class="btn btn-success" type="button" id="aliasChangeButton" data-i18n="confirm">Confirm</button>
                    </div>
                </div>
                <hr>
                <div class="mb-3">
                    <label for="mailInput" class="form-label" data-i18n="email">Email</label>
                    <div class="input-group">
                        <input type="email" class="form-control" id="mailInput" value="${personal.email}" required>
                        <div>
                            <p id="emailError" class="errorMessage"></p>
                            <p id="emailSuccess" class="successMessage"></p>
                        </div>
                        <button class="btn btn-success" type="button" id="emailChangeButton" data-i18n="confirm">Confirm</button>
                    </div>
                </div>
                <hr>
                <div class="mb-3">
                    <label for="aliasInput" class="form-label" data-i18n="password">${translations[cl].password}</label>
                    <button type="button" class="btn btn-warning" id="changePasswordButton" data-i18n="changePassword">Change Password</button>
                </div>

                <div id="passwordChangeFields" style="display: none;">
                    <div class="mb-3">
                        <label for="oldPasswordInput" class="form-label" data-i18n="oldPassword">Old Password</label>
                        <input type="password" class="form-control" id="oldPasswordInput" required>
                    </div>
                    <div class="mb-3">
                        <label for="newPasswordInput" class="form-label" data-i18n="newPassword">New Password</label>
                        <input type="password" class="form-control" id="newPasswordInput" required>
                    </div>
                    <div class="mb-3">
                        <label for="confirmPasswordInput" class="form-label" data-i18n="confirmPassword">Confirm Password</label>
                        <input type="password" class="form-control" id="confirmPasswordInput" required>
                    </div>
                    <div>
                        <p id="passwordError" class="errorMessage"></p>
                        <p id="passwordSuccess" class="successMessage"></p>
                    </div>
                    <button type="button" class="btn btn-success" id="confirmPasswordChangeButton" data-i18n="confirmChange">Confirm Change</button>
                </div>
                <hr>
                <label for="aliasInput" class="form-label" data-i18n="language">${translations[cl].language}</label>
                <select id="languageSelect">
					<option value="en" data-i18n="english">English</option>
					<option value="fr" data-i18n="francais">Français</option>
					<option value="pt" data-i18n="Português">Português</option>
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
				alert(`${translations[currentLanguage].invalidFormat}`);
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
					alert("message for successs");
					loadPage("personal-data");
				} else {
					console.log("Error uploading avatar:", response);
					alert("soemerror");
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
                showMessage("Success, alias has been changed.", "aliasSuccess");
            } else {
                emptyMessage("aliasSuccess");
                if (data.error) {
                    showMessage("Error: " + data.error, "aliasError");
                } else {
                    showMessage("Error, please enter a correct value.", "aliasError");
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
                showMessage("Success, email has been changed.", "emailSuccess");
            } else {
                emptyMessage("emailSuccess");
                if (data.error) {
                    showMessage("Error: " + data.error, "emailError");
                } else {
                    showMessage("Error, please enter a correct value.", "emailError");
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
            showMessage("Error: New passwords do not match.", "passwordError");
            return;
        }

        try {
            const response = await fetchWithToken('/api/user/change-password/', JSON.stringify({ old_password: oldPassword, new_password: newPassword }), 'POST');
            const data = await response.json();
            if (response.ok && data.detail === "Password changed successfully") {
                emptyMessage("passwordError");
                showMessage("Success, password has been changed.", "passwordSuccess");
            } else {
                emptyMessage("passwordSuccess");
                if (data.error) {
                    showMessage("Error: " + data.error, "passwordError");
                } else {
                    showMessage("Error, please enter a correct value.", "passwordError");
                }
            }
        } catch(error) {
            console.log(error);
            window.location.hash = "login";
        }
    });

    languageEventListener();
}



