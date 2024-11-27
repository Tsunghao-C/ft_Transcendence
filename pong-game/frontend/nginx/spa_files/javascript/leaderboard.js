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

const mockLeaderboardData = [
	{ username: "Player1", mmr: 1500 },
	{ username: "Player2", mmr: 1450 },
	{ username: "Player3", mmr: 1400 },
];

function fetchLeaderboardData() {
	populateLeaderboardTable(mockLeaderboardData);
}

function populateLeaderboardTable(data) {
	const tableBody = document.getElementById("leaderboardTableBody");
	tableBody.innerHTML = "";

	data.sort((a, b) => b.mmr - a.mmr);

	data.forEach((user, index) => {
		const row = `
			<tr>
				<td>${index + 1}</td>
				<td>${user.username}</td>
				<td>${user.mmr}</td>
			</tr>
		`;
		tableBody.innerHTML += row;
	});
}
