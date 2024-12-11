//// We may fuse this with the search bar of profile view so that we can search for someone in the leaderboard
import { fetchWithToken, getLanguageCookie } from './fetch_request.js';
import { translations } from './language_pack.js';

import { setContainerHtml } from './app.js'

export async function setLeaderboardView(contentContainer) {
	// await setContainerHtml(contentContainer, "./html/leaderboard.html");
	let response;
	try {
		const response = await fetchWithToken('/api/game/leaderboard/');
		const leaderboardData = await response.json();
		console.leaderboardData;
		populateLeaderboardTable(leaderboardData);
	} catch (error) {
		console.error("Failed to fetch leaderboard data:", error);
		const tableBody = document.getElementById("leaderboardTableBody");
		tableBody.innerHTML = '<tr><td colspan="3">Error loading leaderboard</td></tr>';
	}

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
	fetchLeaderboardData();
}



function populateLeaderboardTable(data) {
	const tableBody = document.getElementById("leaderboardTableBody");
	tableBody.innerHTML = "";

	data.sort((a, b) => b.mmr - a.mmr); // we will deal with that in the backend i guess

	data.forEach((user, index) => {
		const row = `
			<tr>
				<td>${index + 1}</td>
				<td><a href="#profile/${user.username}" class="profile-link">${user.username}</a></td>
				<td>${user.mmr}</td>
			</tr>
		`;
		tableBody.innerHTML += row;
	});
}

