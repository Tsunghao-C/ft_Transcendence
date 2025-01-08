//// We may fuse this with the search bar of profile view so that we can search for someone in the leaderboard
import { fetchWithToken, getLanguageCookie } from './fetch_request.js';
import { translations as trsl } from './language_pack.js';
import { state } from './app.js';


export async function setLeaderboardView(contentContainer) {
	const cl = getLanguageCookie() ||  "en";
	contentContainer.innerHTML = `
		<div class="leaderboard-view">
			<h2>${trsl[state.language].leaderboard}</h2>
			<div class="filter-bar">
				<input type="text" id="leaderboardFilterInput" class="form-control" placeholder="${trsl[state.language].searchByUsername} " maxlength="20" />
			</div>
			<table class="table">
				<thead>
					<tr>
						<th>#</th>
						<th>${trsl[state.language].alias}</th>
						<th>${trsl[state.language].mmr}</th>
					</tr>
				</thead>
				<tbody id="leaderboardTableBody">
				</tbody>
			</table>
			<nav>
				<ul class="pagination" id="paginationContainer">
				</ul>
			</nav>
		</div>
	`;

	let currentSearchQuery = "";
	let currentPage = 1;

	async function fetchLeaderboard(page = 1, searchQuery = "") {
		try {
			const response = await fetchWithToken(`/api/game/leaderboard/?page=${page}&search=${encodeURIComponent(searchQuery)}`);
			const leaderboardData = await response.json();
			populateLeaderboardTable(leaderboardData.leaderboard);
			setupPagination(leaderboardData.totalPages, page);
		} catch (error) {
			console.error(error);
			window.location.hash = "login";
		}
	}

	function populateLeaderboardTable(data) {
		const tableBody = document.getElementById("leaderboardTableBody");
		tableBody.innerHTML = "";
		if (!data || data.length === 0) {
			tableBody.innerHTML = `<tr><td colspan="3" class="text-muted">${trsl[state.language].noData}</td></tr>`;
			return;
		}
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

	function setupPagination(totalPages, currentPage) {
		const paginationContainer = document.getElementById("paginationContainer");
		paginationContainer.innerHTML = "";
		for (let i = 1; i <= totalPages; i++) {
			const pageItem = document.createElement("li");
			pageItem.className = `page-item ${i === currentPage ? "active" : ""}`;
			pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
			pageItem.addEventListener("click", (e) => {
				e.preventDefault();
				currentPage = i;
				fetchLeaderboard(currentPage, currentSearchQuery);
			});
			paginationContainer.appendChild(pageItem);
		}
	}

	document.getElementById("leaderboardFilterInput").addEventListener("input", (e) => {
		currentSearchQuery = e.target.value;
		currentPage = 1;
		fetchLeaderboard(currentPage, currentSearchQuery);
	});

	fetchLeaderboard();
}


