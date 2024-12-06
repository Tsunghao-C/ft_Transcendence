

function getCookie(name) {
	const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
		const [key, value] = cookie.split("=");
		acc[key] = value;
		return acc;
	}, {});
	return cookies[name];
}


export async function fetchWithToken(url, body = null, method = 'GET') {
	let token = getCookie("accessToken");
	if (!token) {
		throw new Error("No refresh token available.");
	}

	const fetchWithAccessToken = async (token) => {
		const options = {
			method: method,
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		};

		if (body) {
			options.body = body
		}

		const response = await fetch(url, options);

		if (response.status === 401) {
			console.log("Access token expired, refreshing...");
			const refreshToken = getCookie("refreshToken");
			if (!refreshToken) {
				throw new Error("No refresh token available.");
			}

			const refreshResponse = await fetch('/api/user/token/refresh/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ refresh: refreshToken }),
			});

			if (refreshResponse.ok) {
				const refreshData = await refreshResponse.json();
				document.cookie = `accessToken=${refreshData.access}; path=/; secure; SameSite=Strict`;
				token = refreshData.access;

				return fetchWithAccessToken(token);
			} else {
				throw new Error("Failed to refresh token.");
			}
		}
		// console.log("response after fectch" , response);
		return response.json();
	};

	return fetchWithAccessToken(token);
}

