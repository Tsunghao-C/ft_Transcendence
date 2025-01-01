

export function getCookie(name) {
	const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
		const [key, value] = cookie.split("=");
		acc[key] = value;
		return acc;
	}, {});
	return cookies[name];
}

export function getLanguageCookie() {
	const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
		const [key, value] = cookie.split("=");
		acc[key] = value;
		return acc;
	}, {});

	return cookies.language || null;
}

export function setLanguageCookieIfNotExists() {
	if (!getLanguageCookie()) {
		document.cookie = "language=en; path=/; secure; SameSite=Strict";
		console.log("Language cookie was not set. Defaulting to 'en'.");
	} else {
		console.log("Language cookie already exists:", getLanguageCookie());
	}
}

export function setLanguageCookie(language) {
	document.cookie = `language=${language}; path=/; secure; SameSite=Strict`;
}



export async function fetchWithToken(url, body = null, method = 'GET', needForContent = true) {
	let token = getCookie("accessToken");
	if (!token) {
		throw new Error("No access token available.");
	}

	let hasTriedRefresh = false;

	const fetchWithAccessToken = async (token) => {
		const options = {
			method: method,
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		};

		if (needForContent) {
			options.headers['Content-Type'] = 'application/json';
		}

		if (body) {
			options.body = body;
		}

		console.log(options);

		const response = await fetch(url, options);
		if (response.status === 401 && !hasTriedRefresh) {
			console.log("Access token expired, attempting to refresh...");
			hasTriedRefresh = true;

			const refreshToken = getCookie("refreshToken");
			if (!refreshToken) {
				throw new Error("No refresh token available for renewal.");
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
				console.error("Failed to refresh token:", await refreshResponse.text());
				throw new Error("Failed to refresh token. Please log in again.");
			}
		} else if (response.status === 401 && hasTriedRefresh) {
			throw new Error("Failed to refresh token. Please log in again.");
		}
		return response;
	};

	return fetchWithAccessToken(token);
}


