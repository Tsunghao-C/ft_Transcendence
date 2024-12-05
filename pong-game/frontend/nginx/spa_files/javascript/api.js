import { fetchWithToken } from "./fetch_request.js";

async function test() {
	try {
		const data = await fetchWithToken('/api/user/getuser/');
		console.log("User data:", data);
	} catch (error) {
		console.error("Error fetching user data:", error);
	}
}
