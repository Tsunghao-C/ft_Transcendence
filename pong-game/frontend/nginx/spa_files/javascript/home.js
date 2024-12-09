import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from './fetch_request.js';

async function testGetUser() {
	try {
		const data = await fetchWithToken('/api/user/getuser/');
		console.log("User data:", data);
	} catch (error) {
		console.error("Error fetching user data:", error);
	}
}

async function uploadAvatar(fileInput) {
    const file = fileInput.files[0];

    if (!file) {
        console.log('No file selected');
        return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

	try {
		const response = await fetchWithToken("api/user/change-avatar/", formData, 'POST', false);
		console.log(response);
	}
	catch (error) {
		console.log(error);
	}
}

export function setHomePage(contentContainer) {
	const currentLanguage = localStorage.getItem("language");
	contentContainer.innerHTML = `
	<label for="profilePictureInput" class="form-label" data-i18n="profilePicture">Profile Picture</label>
	<input type="file" class="form-control" id="profilePictureInput" accept=".jpg, .jpeg, .png">
	<small class="form-text text-muted" data-i18n="profilePictureHint">Only .jpg and .png files are allowed.</small>
	<button type="button" id="test" class="btn btn-light" data-i18n="loginButton">Test Stuff</button>
	`;
	
	
	const profilePictureInput = document.getElementById("profilePictureInput");
	const test = document.getElementById("test");
	test.addEventListener("click", async (event) => {
		event.preventDefault();
		console.log("this is doing something ?");
		testGetUser();
		uploadAvatar(profilePictureInput);
		testGetUser();
	});
}
