//// We may fuse this with the search bar of profile view so that we can search for someone in the leaderboard

export function setLeaderboardView(contentContainer) {
	contentContainer.innerHTML = `
		<div class="leaderboard-view">
			<h1 data-i18n="leaderboard">Leaderboard</h1>
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


//v1 of async function to get data using apis
// async function fetchLeaderboardData() {
// 	try {
// 		const response = await fetch('/api/leaderboard');
// 		const leaderboardData = await response.json();

// 		populateLeaderboardTable(leaderboardData);
// 	} catch (error) {
// 		console.error("Failed to fetch leaderboard data:", error);
// 		const tableBody = document.getElementById("leaderboardTableBody");
// 		tableBody.innerHTML = '<tr><td colspan="3">Error loading leaderboard</td></tr>';
// 	}
// }

const playerData = [
	{ username: "Player1", mmr: 1500 },
	{ username: "Player2", mmr: 1450 },
	{ username: "Player3", mmr: 1400 },
];

function fetchLeaderboardData() {
	populateLeaderboardTable(playerData);
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

