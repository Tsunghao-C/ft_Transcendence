import { translations as trsl } from "./language_pack.js";
import { fetchWithToken } from "./fetch_request.js";
import { sendMessage } from "./manage_social.js";
import { sendDuelRequestFromAlias } from "./manage_social.js";
import { confirmRemoveFriend } from "./manage_social.js";
import { addFriend } from "./manage_social.js";
import { acceptFriendRequest } from "./manage_social.js";
import { rejectFriendRequest } from "./manage_social.js";
import { cancelFriendRequest } from "./manage_social.js";
import { unblockUser } from "./manage_social.js";
import { blockUser } from "./manage_social.js";
import { loadPage } from "./app.js";
import { getLanguageCookie } from './fetch_request.js';
import { setContainerHtml } from './app.js';

export async function setProfileView(contentContainer, usernameInHash) {
	let response;
	let data;
	try {
		response = await fetchWithToken(`/api/user/get-profile/?alias=${usernameInHash}`);
		data = await response.json();
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
		return;
	}
	const lng = getLanguageCookie() ||  "en";
	contentContainer.innerHTML = `
		<div class="profile-view">
			<h2 data-i18n="profileTitle">${trsl[lng].profileTitle}</h2>
			<div class="search-bar mb-3">
				<input type="text" id="searchInput" class="form-control" placeholder="${trsl[lng].searchByUsername}" />
				<button id="searchButton" class="btn btn-primary mt-2" data-i18n="searchButton">${trsl[lng].searchButton}</button>
			</div>
			<div id="profileResult"></div>
		</div>
	`;

	const searchInput = document.getElementById("searchInput");
	const searchButton = document.getElementById("searchButton");
	const profileResult = document.getElementById("profileResult");

	if (!response.ok && data.detail === "No CustomUser matches the given query.") {
		profileResult.innerHTML = `<p data-i18n="userNotFound">User not found.</p>`;
	} else {
		displayProfile(data.profile);
	}

	searchButton.addEventListener("click", () => {
		const searchQuery = searchInput.value.trim();
		console.log("Searching for:", searchQuery);
		if (!searchQuery) {
			return;
		}
		window.location.hash = `profile/${searchQuery}`;
		console.log("Redirecting to profile", searchQuery);
	});

	function displayProfile(profile) {
		const lng = getLanguageCookie() ||  "en";
		// const statusClasses = {
		// 	online: "text-success",
		// 	offline: "text-secondary",
		// 	ingame: "text-warning",
		// };
		// const statusText = trsl[lng][profile.status];
		
		profileResult.innerHTML = `
		<div class="card">
			<div class="card-body">
				<div class="row">
					<!-- Avatar and Alias -->
					<div class="col-md-4">
						<img src="${profile.avatar}" alt="${profile.alias}" class="img-thumbnail" style="max-width: 150px;">
					</div>
					<div class="col-md-4">
						<h3>${profile.alias}</h3>
						<p>${profile.onlineStatus || "offline"}</p>					
						<h4>${trsl[lng].rank}: ${profile.rank || "Unranked"}</h4>
						<h4>${trsl[lng].mmr}: ${profile.mmr}</h4>
						<h4>${trsl[lng].winRate}: ${calculateWinRate(profile.wins, profile.losses)}%</h4>
					</div>
					<div class="col-md-4">
						<h4 data-i18n="matchHistory">${trsl[lng].matchHistory}</h4>
						<p title="${trsl[lng].wins}: ${profile.wins}, ${trsl[lng].losses}: ${profile.losses}">
							${profile.wins}${trsl[lng].w} / ${profile.losses}${trsl[lng].l}
						</p>
						<div class="match-history-scroll" style="max-height: 150px; overflow-y: auto;">
							${
								profile.matchHistory && profile.matchHistory.length > 0
									? profile.matchHistory.map(match => {
										const isP1 = match.p1 === profile.alias;
										const p1Won = match.matchOutcome === "Player 1 Wins";
										const isWin = (isP1 && p1Won) || (!isP1 && !p1Won);
										const opponent = isP1 ? match.p2 : match.p1;
										const outcomeText = isWin ? trsl[lng].win : trsl[lng].loss;
										const matchDate = new Date(match.time).toLocaleString("fr-FR");
										return `
											<p>
												${matchDate} - <strong>${outcomeText}</strong> versus
												<a href="#profile/${opponent}" class="opponent-link">${opponent}</a>
											</p>
										`;
									  }).join('')
									: `<p class="text-muted" data-i18n="noMatchHistory">${trsl[lng].noMatchHistory}</p>`
							}
						</div>
					</div>
					${!profile.isCurrent ? `
						<div class="mt-3">
							<button class="btn btn-info btn-sm" id="sendMessageBtn">${trsl[lng].sendMessage}</button>
							<button class="btn btn-warning btn-sm" id="sendDuelRequestBtn">${trsl[lng].requestDuel}</button>
							<button class="btn btn-success btn-sm" id="addFriendBtn">${trsl[lng].addFriend}</button>
							<button class="btn btn-danger btn-sm" id="removeFriendBtn">${trsl[lng].removeFriend}</button>
							<button class="btn btn-danger btn-sm" id="acceptFriendBtn">${trsl[lng].accept}</button>
							<button class="btn btn-danger btn-sm" id="rejectFriendBtn">${trsl[lng].cancel}</button>
							<button class="btn btn-danger btn-sm" id="cancelFriendBtn">${trsl[lng].cancel}</button>
							<button class="btn btn-danger btn-sm" id="blockUserBtn">${trsl[lng].block}</button>
							<button class="btn btn-danger btn-sm" id="unblockUserBtn">${trsl[lng].unblock}</button>
						</div>
					` : ""}
				</div>
			</div>
		</div>
		`;

		if (!profile.isCurrent) {
			const sendMessageButton = document.getElementById("sendMessageBtn");
			const sendDuelRequestButton = document.getElementById("sendDuelRequestBtn");
			const addFriendButton = document.getElementById("addFriendBtn");
			const removeFriendButton = document.getElementById("removeFriendBtn");
			const acceptFriendButton = document.getElementById("acceptFriendBtn");
			const rejectFriendButton = document.getElementById("rejectFriendBtn");
			const cancelFriendButton = document.getElementById("cancelFriendBtn");
			const blockUserButton = document.getElementById("blockUserBtn");
			const unblockUserButton = document.getElementById("unblockUserBtn");

			sendMessageButton.addEventListener("click", () => {
				sendMessage(profile.alias, contentContainer);
				setProfileView(contentContainer, profile.alias);
			});
			sendDuelRequestButton.addEventListener("click", () => {
				sendDuelRequestFromAlias(profile.alias);
				setProfileView(contentContainer, profile.alias);
			});
			addFriendButton.addEventListener('click', () => {
				addFriend(profile.alias);
				setProfileView(contentContainer, profile.alias);
			});
			removeFriendButton.addEventListener('click', () => {
				confirmRemoveFriend(profile.alias);
				setProfileView(contentContainer, profile.alias);
			});
			acceptFriendButton.addEventListener('click', () => {
				acceptFriendRequest(profile.alias);
				setProfileView(contentContainer, profile.alias);
			});
			rejectFriendButton.addEventListener('click', () => {
				rejectFriendRequest(profile.alias);
				setProfileView(contentContainer, profile.alias);
			});
			cancelFriendButton.addEventListener('click', () => {
				cancelFriendRequest(profile.alias);
				setProfileView(contentContainer, profile.alias);
			});
			blockUserButton.addEventListener('click', () => {
				blockUser(profile.alias);
				setProfileView(contentContainer, profile.alias);
			});
			unblockUserButton.addEventListener('click', () => {
				unblockUser(profile.alias);
				setProfileView(contentContainer, profile.alias);
			});
			updateButtonsVisibility(profile);
		}
	}

	function updateButtonsVisibility(profile) {
		const sendMessageButton = document.getElementById("sendMessageBtn");
		const sendDuelRequestButton = document.getElementById("sendDuelRequestBtn");
		const addFriendButton = document.getElementById("addFriendBtn");
		const removeFriendButton = document.getElementById("removeFriendBtn");
		const acceptFriendButton = document.getElementById("acceptFriendBtn");
		const rejectFriendButton = document.getElementById("rejectFriendBtn");
		const cancelFriendButton = document.getElementById("cancelFriendBtn");
		const blockUserButton = document.getElementById("blockUserBtn");
		const unblockUserButton = document.getElementById("unblockUserBtn");

		// Reset visibility for all buttons
		const buttons = [
			sendMessageButton,
			sendDuelRequestButton,
			addFriendButton,
			removeFriendButton,
			acceptFriendButton,
			rejectFriendButton,
			cancelFriendButton,
			blockUserButton,
			unblockUserButton
		];
		buttons.forEach(button => {
			if (button) button.style.display = "none";
		});

		if (!profile.hasBlocked) {
			sendMessageButton.style.display = "inline-block";
			sendDuelRequestButton.style.display = "inline-block";
			blockUserButton.style.display = "inline-block";
		} else {
			unblockUserButton.style.display = "inline-block";
		}

		if (profile.isFriend) {
			removeFriendButton.style.display = "inline-block";
		} else if (!profile.isSent && !profile.isPending && !profile.hasBlocked) {
			addFriendButton.style.display = "inline-block";
		}

		if (profile.isPending) {
			acceptFriendButton.style.display = "inline-block";
			rejectFriendButton.style.display = "inline-block";
		}

		if (profile.isSent) {
			cancelFriendButton.style.display = "inline-block";
		}
	}

	function calculateWinRate(wins, losses) {
		if (losses === 0) {
			return (100.00);
		}
		return ((wins / (wins + losses)) * 100).toFixed(2);
	}
}
