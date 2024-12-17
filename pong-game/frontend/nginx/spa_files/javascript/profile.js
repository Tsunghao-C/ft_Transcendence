

import { translations } from "./language_pack.js";
import { fetchWithToken } from "./fetch_request.js";
import { sendMessage } from "./manage_social.js";
import { sendDuelRequest } from "./manage_social.js";
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
		// const body = JSON.stringify({
		// 	alias : usernameInHash
		//   });
		// response = await fetchWithToken(`/api/user/get-profile/?${usernameInHash}`, body, 'POST');
		response = await fetchWithToken(`/api/user/get-profile/?alias=${usernameInHash}`);
		data = await response.json();
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
		return;
	}
	contentContainer.innerHTML = `
		<div class="profile-view">
			<h2 data-i18n="profileTitle">Search Profile</h2>
			<div class="search-bar mb-3">
				<input type="text" id="searchInput" class="form-control" placeholder="Enter a username..." />
				<button id="searchButton" class="btn btn-primary mt-2" data-i18n="searchButton">Search</button>
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
		const currentLanguage = getLanguageCookie() ||  "en";
		// const statusClasses = {
		// 	online: "text-success",
		// 	offline: "text-secondary",
		// 	ingame: "text-warning",
		// };
		// const statusText = translations[currentLanguage][profile.status];

		profileResult.innerHTML = `
		<div class="card">
			<div class="card-body">
				<div class="row">
					<!-- Avatar and Alias -->
					<div class="col-md-4">
						<img src="${profile.avatar}" alt="${profile.alias}" class="img-thumbnail" style="max-width: 150px;">
						<h3>${profile.alias}</h3>
						<p>${profile.onlineStatus}</p>
					</div>
					<div class="col-md-4">
						<h4>${translations[currentLanguage].rank}: ${profile.rank || "Unranked"}</h4>
						<h4>${translations[currentLanguage].mmr}: ${profile.mmr}</h4>
						<h4>${translations[currentLanguage].winRate}: ${calculateWinRate(profile.wins, profile.losses)}%</h4>
						<p title="${translations[currentLanguage].wins}: ${profile.wins}, ${translations[currentLanguage].losses}: ${profile.losses}">
							${profile.wins}${translations[currentLanguage].w} / ${profile.losses}${translations[currentLanguage].l}
						</p>
					</div>
					<div class="col-md-4">
						<h4 data-i18n="matchHistory">${translations[currentLanguage].matchHistory}</h4>
						<div class="match-history-scroll" style="max-height: 150px; overflow-y: auto;">
							${
								profile.matchHistory && profile.matchHistory.length > 0
									? profile.matchHistory.map(match => {
										const isP1 = match.p1 === profile.alias;
										const p1Won = match.matchOutcome === "Player 1 Wins";
										const isWin = (isP1 && p1Won) || (!isP1 && !p1Won);
										const opponent = isP1 ? match.p2 : match.p1;
										const outcomeText = isWin ? translations[currentLanguage].win : translations[currentLanguage].loss;
										const matchDate = new Date(match.time).toLocaleString(currentLanguage);
										return `
											<p>
												${matchDate} - <strong>${outcomeText}</strong> versus
												<a href="#profile/${opponent}" class="opponent-link">${opponent}</a>
											</p>
										`;
									  }).join('')
									: `<p class="text-muted" data-i18n="noMatchHistory">${translations[currentLanguage].noMatchHistory}</p>`
							}
						</div>
					</div>
					${!profile.isCurrent ? `
						<div class="mt-3">
							<button class="btn btn-info btn-sm" id="sendMessageBtn">${translations[currentLanguage].sendMessage}</button>
							<button class="btn btn-warning btn-sm" id="sendDuelRequestBtn">${translations[currentLanguage].requestDuel}</button>
							<button class="btn btn-success btn-sm" id="addFriendBtn">${translations[currentLanguage].addFriend}</button>
							<button class="btn btn-danger btn-sm" id="removeFriendBtn">${translations[currentLanguage].removeFriend}</button>
							<button class="btn btn-danger btn-sm" id="acceptFriendBtn">${translations[currentLanguage].accept}</button>
							<button class="btn btn-danger btn-sm" id="rejectFriendBtn">${translations[currentLanguage].cancel}</button>
							<button class="btn btn-danger btn-sm" id="cancelFriendBtn">${translations[currentLanguage].cancel}</button>
							<button class="btn btn-danger btn-sm" id="blockUserBtn">${translations[currentLanguage].block}</button>
							<button class="btn btn-danger btn-sm" id="unblockUserBtn">${translations[currentLanguage].unblock}</button>
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
				sendDuelRequest(profile.alias);
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
