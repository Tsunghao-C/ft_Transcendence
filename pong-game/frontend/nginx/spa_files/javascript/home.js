import { fetchWithToken } from "./fetch_request.js";
import { translations } from "./language_pack.js";
import { state } from "./app.js";

export async function setHomePage(contentContainer, userdata) {

	let response;
	let data;

	const usernameInHash = userdata.alias;

	try {
		response = await fetchWithToken(`/api/user/get-profile/?alias=${usernameInHash}`);
		data = await response.json();
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
		return;
	}

	contentContainer.innerHTML = `
		<div class="home-view">
			<h2>${translations[state.language].welcome}, ${userdata.username} !</h2>
			<div id="profile">
			</div>
		</div>
	`;

	const profileResult = document.getElementById("profile");

	if (!response.ok && data.detail === "No CustomUser matches the given query.") {
		profileResult.innerHTML = `<p>User not found.</p>`;
	} else {
		displayProfile(data.profile);
	}
}

function displayProfile(profile) {
		const profileResult = document.getElementById("profile");

		profileResult.innerHTML = `
		<div class="data-container">
			<hr>
			<h3>${translations[state.language].currentStats}</h3>
			<h4>${translations[state.language].rank}: ${profile.rank || translations[state.language].unranked}</h4>
			<h4>${translations[state.language].mmr}: ${profile.mmr}</h4>
			<h4>${translations[state.language].winRate}: ${calculateWinRate(profile.wins, profile.losses)}%</h4>
			<hr>
			<h4>${translations[state.language].matchHistory}</h4>
			<p title="${translations[state.language].wins}: ${profile.wins}, ${translations[state.language].losses}: ${profile.losses}">
				${profile.wins}${translations[state.language].w} / ${profile.losses}${translations[state.language].l}
			</p>
			<table class="table">
				<hr style="color: white; background-color: white; margin: 0px;">
				<tbody id="matchHistoryTableBody">
				</tbody>
			</table>
			<div class="match-history-scroll" style="max-height: 150px; overflow-y: auto;">
				${
					profile.matchHistory && profile.matchHistory.length > 0
						? profile.matchHistory.slice().reverse().map(match => {
							const isP1 = match.p1 === profile.alias;
							const p1Won = match.matchOutcome === "Player 1 Wins";
							const isWin = (isP1 && p1Won) || (!isP1 && !p1Won);
							const opponent = isP1 ? match.p2 : match.p1;
							const outcomeText = isWin ? translations[state.language].win : translations[state.language].loss;
							const matchDate = new Date(match.time).toLocaleString(state.language);
							return `
								<p>
									${matchDate} - <strong>${outcomeText}</strong> versus
									<a href="#profile/${opponent}" class="opponent-link">${opponent}</a>
								</p>
							`;
							}).join('')
						: `<p class="text-muted">${translations[state.language].noMatchHistory}</p>`
				}
			</div>
		</div>
		`;

}

function calculateWinRate(wins, losses) {
	if (losses === 0) {
		return (100.00);
	}
	return ((wins / (wins + losses)) * 100).toFixed(2);
}
