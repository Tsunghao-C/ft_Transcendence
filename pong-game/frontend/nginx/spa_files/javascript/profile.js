

import { playerDatas } from "./data_test.js";
import { translations } from "./language_pack.js";

export function setProfileView(contentContainer, usernameInHash) {
	contentContainer.innerHTML = `
		<div class="profile-view">
			<h1 data-i18n="profileTitle">Search Profile</h1>
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

	const foundPlayer = Object.values(playerDatas.players).find(
		(player) => player.username === usernameInHash
	);
	if (foundPlayer) {
		displayProfile(foundPlayer);
	} else {
		profileResult.innerHTML = `<p data-i18n="userNotFound">User not found.</p>`;
	}

	searchButton.addEventListener("click", () => {
		const searchQuery = searchInput.value.trim();
		//2 possibilities, the button can do nothing if the field is empty or trigger a warning
		if (!searchQuery) {
			// searchInput.classList.add("is-invalid");
			// const errorMessage = document.createElement("div");
			// errorMessage.className = "invalid-feedback";
			// errorMessage.textContent = "This field is required.";
			// if (!searchInput.nextElementSibling) {
			// 	searchInput.parentNode.appendChild(errorMessage);
			// }
			return;
		// } else {
		// 	searchInput.classList.remove("is-invalid");
		// 	if (searchInput.nextElementSibling) {
		// 		searchInput.nextElementSibling.remove();
		// 	}
		}

		const foundPlayer = Object.values(playerDatas.players).find(
			(player) => player.username === searchQuery
		);

		window.history.pushState(
			{ page: `profile/${searchQuery}` },
			`Profile of ${searchQuery}`,
			`#profile/${searchQuery}`
		);
		if (foundPlayer) {
			displayProfile(foundPlayer);
		} else {
			profileResult.innerHTML = `<p data-i18n="userNotFound">User not found.</p>`;
		}
	});

	function displayProfile(player) {
		const currentLanguage = localStorage.getItem("language") || "en";
		const currentLogin = localStorage.getItem("currentLogin");
		const currentPlayer = playerDatas.players[currentLogin];
		const statusClasses = {
			online: "text-success",
			offline: "text-secondary",
			ingame: "text-warning",
		};
		const statusText = translations[currentLanguage][player.status];
		const isCurrentPlayer = player.username === currentLogin;

		profileResult.innerHTML = `
			<div class="card">
				<div class="card-body">
					<div class="row">
						<div class="col-md-4">
							<img src="${player.profilePicture}" alt="${player.username}" class="img-thumbnail" style="max-width: 150px;">
							<h3>${player.username}</h3>
							<p class="${statusClasses[player.status]}">${statusText}</p>
						</div>
						<div class="col-md-4">
							<h4>${translations[currentLanguage].rank}: ${player.rank}</h4>
							<h4>${translations[currentLanguage].mmr}: ${player.mmr}</h4>
							<h4>${translations[currentLanguage].winRate}: ${calculateWinRate(player.win, player.lose)}%</h4>
							<p title="${translations[currentLanguage].wins}: ${player.win}, ${translations[currentLanguage].losses}: ${player.lose}">${player.win}${translations[currentLanguage].w} / ${player.lose}${translations[currentLanguage].l}</p>
						</div>
						<div class="col-md-4">
							<h4 data-i18n="matchHistory">Match History</h4>
							<ul class="list-group">
							${player.matchHistory
								.map(
									(match) =>
										`<li class="list-group-item">
											<span>${match[0]}</span> -
											<span>${match[1] === "W" ? translations[currentLanguage].win : translations[currentLanguage].loss}</span> vs
											<a href="#profile/${match[2]}" class="profile-link">${match[2]}</a>
											<span>[${match[3][0]}-${match[3][1]}]</span>
										</li>`
								)
								.join("")}
							</ul>
						</div>
					</div>
					${!isCurrentPlayer ? `
						<div class="mt-3">
							<button class="btn btn-info btn-sm" id="sendMessageBtn">${translations[currentLanguage].sendMessage}</button>
							<button class="btn btn-warning btn-sm" id="sendDuelRequestBtn">${translations[currentLanguage].requestDuel}</button>
							<button class="btn btn-success btn-sm" id="addFriendBtn">${translations[currentLanguage].addFriend}</button>
							<button class="btn btn-danger btn-sm" id="removeFriendBtn">${translations[currentLanguage].removeFriend}</button>
						</div>
					` : ""}
				</div>
			</div>
		`;
		if (!isCurrentPlayer) {
			const sendMessageButton = document.getElementById("sendMessageBtn");
			sendMessageButton.addEventListener("click", () => {
				sendMessage(player.username);
			});
			const sendDuelRequestButton = document.getElementById("sendDuelRequestBtn");
			sendDuelRequestButton.addEventListener("click", () => {
				sendDuelRequest(player.username);
			});
			updateFriendshipButtons(player);
		}
	}

	function updateFriendshipButtons(player) {
		const currentLanguage = localStorage.getItem("language") || "en";
		const currentLogin = localStorage.getItem("currentLogin");
		const currentPlayer = playerDatas.players[currentLogin];


		const addFriendButton = document.getElementById("addFriendBtn");
		const removeFriendButton = document.getElementById("removeFriendBtn");
		if (!currentPlayer.friends.includes(player.username)) {
			addFriendButton.style.display = 'inline-block';
			removeFriendButton.style.display = 'none';

			addFriendButton.addEventListener('click', () => {
				addFriend(player.username);
				addFriendButton.style.display = 'none';
				removeFriendButton.style.display = 'inline-block';
			});
		} else {
			removeFriendButton.style.display = 'inline-block';
			addFriendButton.style.display = 'none';

			removeFriendButton.addEventListener('click', () => {
				const confirmation = confirm(`Are you sure you want to remove ${player.username} from your friends list?`);
				if (confirmation) {
					removeFriend(player.username);
					removeFriendButton.style.display = 'none';
					addFriendButton.style.display = 'inline-block';
				}
			});
		}
	}

	function calculateWinRate(wins, losses) {
		return ((wins / (wins + losses)) * 100).toFixed(2);
	}

	function sendMessage(friendUsername) {
		console.log(`Sending message to ${friendUsername}`);
	}

	function sendDuelRequest(friendUsername) {
		console.log(`Requesting duel with ${friendUsername}`);
	}

	function addFriend(friendUsername) {
		const currentLogin = localStorage.getItem("currentLogin");
		const currentPlayer = playerDatas.players[currentLogin];
		if (currentPlayer && !currentPlayer.friends.includes(friendUsername)) {
			currentPlayer.friends.push(friendUsername);
			console.log(`${friendUsername} added to ${currentLogin}'s friends list.`);
			updateFriendshipButtons(currentPlayer);
		} else {
			console.log(`${friendUsername} is already a friend or not found.`);
		}
	}

	function removeFriend(friendUsername) {
		const currentLogin = localStorage.getItem("currentLogin");
		const currentPlayer = playerDatas.players[currentLogin];

			const index = currentPlayer.friends.indexOf(friendUsername);
			if (index > -1) {
				currentPlayer.friends.splice(index, 1);
				console.log(`${friendUsername} removed from ${currentLogin}'s friends list.`);
				updateFriendshipButtons(currentPlayer);
			}
	}
}
