import { translations } from "./language_pack.js";
import { getLanguageCookie } from './fetch_request.js';

export function setCustomValidation(inputId) {
	const inputElement = document.getElementById(inputId);
	const currentLanguage = getLanguageCookie() ||  "en";
	if (!inputElement) {
		console.error(`Element with ID ${inputId} not found.`);
		return;
	}

	inputElement.addEventListener("invalid", (event) => {
		event.target.setCustomValidity(translations[currentLanguage].emptyField);
	});

	inputElement.addEventListener("input", (event) => {
		event.target.setCustomValidity("");
	});
}

export function validateProfilePicture() {
	const profilePictureInput = document.getElementById("profilePictureInput");
	const currentLanguage = getLanguageCookie() ||  "en";
	const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;

	profilePictureInput.addEventListener("change", (event) => {
		const file = event.target.files[0];

		if (!allowedExtensions.test(file.name)) {
			profilePictureInput.setCustomValidity(translations[currentLanguage].invalidFormat);
		} else {
			profilePictureInput.setCustomValidity("");
		}
	});
}


export function validatePasswordMatch() {
	const passwordInput = document.getElementById("newPasswordInput");
	const confirmPasswordInput = document.getElementById("confirmPasswordInput");
	const currentLanguage = getLanguageCookie() ||  "en";
	console.log("we have passwordInput.value = ", passwordInput.value, " and confirm = ", confirmPasswordInput.value);
	confirmPasswordInput.addEventListener("input", () => {
		if (passwordInput.value !== confirmPasswordInput.value) {
			confirmPasswordInput.setCustomValidity(translations[currentLanguage].passwordMismatch || "Passwords do not match");
		} else {
			confirmPasswordInput.setCustomValidity("");
		}
	});

	passwordInput.addEventListener("input", () => {
		if (passwordInput.value !== confirmPasswordInput.value) {
			confirmPasswordInput.setCustomValidity(translations[currentLanguage].passwordMismatch || "Passwords do not match");
		} else {
			confirmPasswordInput.setCustomValidity("");
		}
	});
}

export function showError(message) {
	const errorMessage = document.getElementById('errorMessage');
	errorMessage.textContent = message;
	const successMessage = document.getElementById('successMessage');
	successMessage.textContent = "";
}

export function showSuccess(message) {
	const successMessage = document.getElementById('successMessage');
	successMessage.textContent = message;
	const errorMessage = document.getElementById('errorMessage');
	errorMessage.textContent = "";
}
