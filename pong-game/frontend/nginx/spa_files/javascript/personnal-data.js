import { playerDatas } from "./data_test.js";
import { fetchWithToken } from "./fetch_request.js";

export async function setPersonnalDataView(contentContainer) {
	const currentLogin = localStorage.getItem("currentLogin");
	if (!currentLogin || !playerDatas.players[currentLogin]) {
		contentContainer.innerHTML = `
			<h1 data-i18n="error">Error</h1>
			<p data-i18n="noUserFound">No user data found.</p>`;
		console.log("user doesn't exist");
		return;
	}
	let userData;
	// try {
	// 	userData = await fetchWithToken('/api/user/getpersonnal/');
	// 	console.log("User data: ", userData);
	// } catch (error) {
	// 	throw new Error(error);
	// }
	userData = playerDatas.players[currentLogin];

	contentContainer.innerHTML = `
		<div class="personal-data-view">
			<h1 data-i18n="personalDataTitle">Personal Information</h1>
			<form id="personalDataForm">
				<div class="mb-3">
					<label for="loginInput" class="form-label" data-i18n="login">Login</label>
					<input type="text" class="form-control" id="loginInput" value="${userData.login}" readonly>
				</div>
				<div class="mb-3">
					<label for="usernameInput" class="form-label" data-i18n="username">Username</label>
					<input type="text" class="form-control" id="usernameInput" value="${userData.username}" required>
				</div>
				<div class="mb-3">
					<label for="passwordInput" class="form-label" data-i18n="password">Password</label>
					<div class="input-group">
						<input type="password" class="form-control" id="passwordInput" value="${userData.password}" required>
						<button class="btn btn-outline-secondary" type="button" id="togglePasswordButton">
							<span data-i18n="showPassword">👁️</span>
						</button>
					</div>
				</div>
				<div class="mb-3">
					<label for="mailInput" class="form-label" data-i18n="email">Email</label>
					<input type="email" class="form-control" id="mailInput" value="${userData.mailAddress}" required>
				</div>
				<div class="mb-3">
					<label for="profilePictureInput" class="form-label" data-i18n="profilePicture">Profile Picture</label>
					<input type="file" class="form-control" id="profilePictureInput" accept=".jpg, .jpeg, .png">
					<img src="${userData.profilePicture}" alt="Profile Picture" class="img-thumbnail mt-2" style="max-width: 150px;">
				</div>
				<button type="submit" class="btn btn-primary" data-i18n="saveChanges">Save Changes</button>
			</form>
		</div>
	`;

	const personalDataForm = document.getElementById("personalDataForm");
	const togglePasswordButton = document.getElementById("togglePasswordButton");
	const passwordInput = document.getElementById("passwordInput");

	togglePasswordButton.addEventListener("click", () => {
		passwordInput.type = passwordInput.type === "password" ? "text" : "password";
	});

	personalDataForm.addEventListener("submit", (event) => {
		event.preventDefault();

		const updatedUsername = document.getElementById("usernameInput").value;
		const updatedPassword = document.getElementById("passwordInput").value;
		const updatedMail = document.getElementById("mailInput").value;
		const profilePictureInput = document.getElementById("profilePictureInput");
		let updatedProfilePicture = userData.profilePicture;

		if (profilePictureInput.files.length > 0) {
			const file = profilePictureInput.files[0];
			if (file && file.type.match(/image\/(jpeg|png)/)) {
				updatedProfilePicture = URL.createObjectURL(file);
			} else {
				alert("Invalid file type. Please upload a .jpg or .png file.");
				return;
			}
		}

		//Useless but for the tests
		playerDatas.players[currentLogin] = {
			...userData,
			username: updatedUsername,
			password: updatedPassword,
			mailAddress: updatedMail,
			profilePicture: updatedProfilePicture,
		};
		loadPage(personnal-data);
		alert("Your personal information has been updated!");
	});
}

