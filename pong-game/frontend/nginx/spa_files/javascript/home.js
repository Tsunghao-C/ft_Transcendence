async function testgetuser() {
	const token = localStorage.getItem('accessToken');
	if (!token) {
		console.error("Access token is missing");
		throw new Error("Access token is missing");
	}

	console.log("Access token is:", token);

	const response = await fetch('/api/user/getuser/', {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	return response.json();
}

export function setHomePage(contentContainer) {
	const currentLanguage = localStorage.getItem("language");
	contentContainer.innerHTML = `
		<button type="button" id="test" class="btn btn-light" data-i18n="loginButton">Test Stuff</button>
	`;

	document.getElementById("test").addEventListener("click", async (event) => {
		event.preventDefault();
		console.log("this is doing something ?");
		try {
			const data = await testgetuser();
			console.log("data is ", data);
		} catch (error) {
			console.error("Error fetching user data:", error);
		}
	});
}
