import { fetchWithToken } from "./fetch_request.js";

async function testGetUser() {
	try {
		const data = await fetchWithToken('/api/user/getuser/');
		console.log("User data:", data);
	} catch (error) {
		console.error("Error fetching user data:", error);
	}
}

export function setHomePage(contentContainer) {
	const currentLanguage = localStorage.getItem("language");
	contentContainer.innerHTML = `
		<button type="button" id="test" class="btn btn-light" data-i18n="loginButton">Test Stuff</button>
	`;

	document.getElementById("test").addEventListener("click", async (event) => {
		event.preventDefault();
		console.log("this is doing something ?");
		testGetUser();
	});
}
