import { loadPage } from "./app.js";
import { playerDatas } from "./data_test.js";
import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from './fetch_request.js';

export async function setPersonnalDataView(contentContainer) {
    let personnal;
    let response;
    try {
        response = await fetchWithToken('/api/user/getuser/');
        personnal = await response.json();
        console.log("User data: ", personnal);
    } catch(error) {
        console.log(error);
        window.location.hash = "login";
		loadPage("login");
    }

    contentContainer.innerHTML = `
        <div class="personal-data-view">
            <h1 data-i18n="personalDataTitle">Personal Information</h1>
            <div class="d-flex align-items-center mb-4">
                <div>
                    <img 
                        src="${personnal.profilePicture}" 
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
                    <label class="form-label" data-i18n="login">Login</label>
                    <input type="text" class="form-control" value="${personnal.username}" readonly>
                </div>
            </div>

            <form id="personalDataForm">
                <div class="mb-3">
                    <label for="aliasInput" class="form-label" data-i18n="alias">Alias</label>
                    <div class="input-group">
                        <input type="text" class="form-control" id="aliasInput" value="${personnal.alias}" required>
                        <button class="btn btn-success" type="button" id="aliasChangeButton" data-i18n="confirm">Confirm</button>
                    </div>
                </div>

                <div class="mb-3">
                    <label for="mailInput" class="form-label" data-i18n="email">Email</label>
                    <div class="input-group">
                        <input type="email" class="form-control" id="mailInput" value="${personnal.email}" required>
                        <button class="btn btn-success" type="button" id="emailChangeButton" data-i18n="confirm">Confirm</button>
                    </div>
                </div>

                <div class="mb-3">
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
                    <button type="button" class="btn btn-success" id="confirmPasswordChangeButton" data-i18n="confirmChange">Confirm Change</button>
                </div>
				<select id="languageSelect" class="form-select mt-2">
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
    const languageSelect = document.getElementById("languageSelect");

	languageSelect.value = getLanguageCookie() || "en";


	profilePictureInput.addEventListener("change", async (event) => {
		const file = event.target.files[0];
	
		if (file) {
			if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
				alert(`${translations[currentLanguage].invalidFormat}`);
				return;
			}
	
			const reader = new FileReader();
			reader.onload = (e) => {
				profilePicturePreview.src = e.target.result;
			};
			reader.readAsDataURL(file);
	
			const formData = new FormData();
			formData.append('avatar', file);
	
			try {
				const response = await fetchWithToken("api/user/change-avatar/", formData, 'POST', false);
				if (response.ok) {
					console.log("Avatar uploaded successfully:", response);
					alert("message for successs");
				} else {
					console.log("Error uploading avatar:", response);
					alert("soemerror");
				}
            } catch(error) {
                console.log(error);
                window.location.hash = "login";
                loadPage("login");
            }
		}
	});

    document.getElementById("aliasChangeButton").addEventListener("click", async () => {
        const newAlias = document.getElementById("aliasInput").value;
        let response;
        try {
            response = await fetchWithToken('/api/user/change-alias/', JSON.stringify({ alias: newAlias }), 'POST');
            if (!response.ok) {
                alert(`${response.detail}`);
            }
            else {
                alert('Alias updated successfully!');
                loadPage("personnal-data")
            }
        } catch(error) {
            console.log(error);
            window.location.hash = "login";
            loadPage("login");
        }
    });

    document.getElementById("emailChangeButton").addEventListener("click", async () => {
        const newEmail = document.getElementById("mailInput").value;
        try {
            await fetchWithToken('/api/user/change-email/', JSON.stringify({ email: newEmail }), 'POST');
            alert('Email updated successfully!');
            loadPage("personnal-data")
        } catch(error) {
            console.log(error);
            window.location.hash = "login";
            loadPage("login");
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
            alert('New passwords do not match.');
            return;
        }

        try {
            await fetchWithToken('/api/user/change-password/', JSON.stringify({ old_password: oldPassword, new_password: newPassword }), 'POST');
            alert('Password changed successfully!');
        } catch(error) {
            console.log(error);
            window.location.hash = "login";
            loadPage("login");
        }
    });


    languageSelect.addEventListener("change", async (event) => {
        const selectedLanguage = event.target.value;
		try {
            await fetchWithToken('/api/user/change-language/', JSON.stringify({ newLang: selectedLanguage }), 'POST');
            alert('language changed successfully!');
			loadPage("personnal-data");
        } catch(error) {
            console.log(error);
            window.location.hash = "login";
            loadPage("login");
        }
    });
}



