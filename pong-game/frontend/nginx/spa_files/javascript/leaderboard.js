//// We may fuse this with the search bar of profile view so that we can search for someone in the leaderboard
import { fetchWithToken, getLanguageCookie } from './fetch_request.js';
import { loadPage } from './app.js';
import { translations } from './language_pack.js';

import { setContainerHtml } from './app.js'

export async function setLeaderboardView(contentContainer) {
	// await setContainerHtml(contentContainer, "./html/leaderboard.html");

	contentContainer.innerHTML = `
		<div class="leaderboard-view">
			<h2 data-i18n="leaderboard">Leaderboard</h2>
			<table class="table">
				<thead>
					<tr>
						<th>#</th>
						<th data-i18n="username">Username</th>
						<th >MMR</th>
					</tr>
				</thead>
				<tbody id="leaderboardTableBody">
				</tbody>
			</table>
		</div>
	`;
	let response;
	try {
		const response = await fetchWithToken('/api/game/leaderboard/');
		const leaderboardData = await response.json();
		console.log(leaderboardData);
		populateLeaderboardTable(leaderboardData);
	} catch (error) {
		window.location.hash = "login";
		console.log(error);
		loadPage("login");
		return;
	}
}



function populateLeaderboardTable(data) {
	const tableBody = document.getElementById("leaderboardTableBody");
	tableBody.innerHTML = "";
	data.forEach((user) => {
		const row = `
			<tr>
				<td>${user.rank}</td>
				<td><a href="#profile/${user.alias}" class="profile-link">${user.alias}</a></td>
				<td>${user.mmr}</td>
			</tr>
		`;
		tableBody.innerHTML += row;
	});
}

