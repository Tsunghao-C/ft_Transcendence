import { playerDatas } from "./data_test.js";
import { translations } from "./language_pack.js";

export function setFriendsView(contentContainer) {
	const currentLogin = localStorage.getItem("currentLogin");
	const currentPlayer = playerDatas.players[currentLogin];
	const currentLanguage = localStorage.getItem("language")

	contentContainer.innerHTML = `
		<h2>${translations[currentLanguage].friendList}</h2>
		<button id="addFriendButton" class="btn btn-success mb-3">${translations[currentLanguage].addNewFriend}</button>
		<ul id="friendsList" class="list-group"></ul>
	`;

	const friendsList = document.getElementById("friendsList");
	const addFriendButton = document.getElementById("addFriendButton");

	const statusClasses = {
		online: "text-success",
		offline: "text-secondary",
		ingame: "text-warning",
	};

	currentPlayer.friends.forEach(friendUsername => {
		const friend = playerDatas.players[friendUsername];
		if (friend) {
			const friendItem = document.createElement("li");
			friendItem.classList.add("list-group-item");
			const statusText = translations[currentLanguage][friend.status];
			friendItem.innerHTML = `
				<div class="row">
					<div class="col-md-2">
						<img src="${friend.profilePicture}" alt="${friend.username}" class="img-thumbnail" style="max-width: 50px;">
					</div>
					<div class="col-md-6">
						<a href="#profile/${friend.username}" class="profile-link">${friend.username}</a>
						<p class="${statusClasses[friend.status]}" title="${friend.status}">${statusText}</p>
						<p>${translations[currentLanguage].rank}: ${friend.rank} - ${translations[currentLanguage].mmr}: ${friend.mmr}</p>
					</div>
					<div class="col-md-4 text-right">
						<button class="btn btn-info btn-sm float-right ml-2">${translations[currentLanguage].sendMessage}</button>
						<button class="btn btn-warning btn-sm float-right">${translations[currentLanguage].requestDuel}</button>
						<button class="btn btn-danger btn-sm float-right ml-2" id="removeFriendButton">${translations[currentLanguage].removeFriend}</button>
					</div>
				</div>
			`;

			const sendMessageButton = friendItem.querySelector('button.btn-info');
			sendMessageButton.addEventListener("click", () => {
				sendMessage(friend.username);
			});

			const sendDuelRequestButton = friendItem.querySelector('button.btn-warning');
			sendDuelRequestButton.addEventListener("click", () => {
				sendDuelRequest(friend.username);
			});

			const removeFriendButton = friendItem.querySelector('button#removeFriendButton');
			removeFriendButton.addEventListener("click", () => {
				removeFriend(friend.username);
			});

			friendsList.appendChild(friendItem);
		}
	});

	function sendMessage(friendUsername) {
		console.log(`Sending message to ${friendUsername}`);
	}

	function sendDuelRequest(friendUsername) {
		console.log(`Requesting duel with ${friendUsername}`);
	}

	function removeFriend(friendUsername) {
		const confirmation = confirm(`${translations[currentLanguage].validationRemovalFirst} ${friendUsername} ${translations[currentLanguage].validationRemovalSecond} ?`);
		if (confirmation) {
			const index = currentPlayer.friends.indexOf(friendUsername);
			if (index > -1) {
				currentPlayer.friends.splice(index, 1);
				setFriendsView(contentContainer);
			}
		}
	}
	//this will need to change, kinda disgusting to be honest
	addFriendButton.addEventListener("click", () => {
		const newFriendUsername = prompt(`${translations[currentLanguage].promptAddFriend}:`);
		if (newFriendUsername) {
			const newFriend = playerDatas.players[newFriendUsername];
			if (newFriend) {
				if (newFriend.username === currentPlayer.username) {
					alert(`${translations[currentLanguage].lonelyTest}`);
				} else if (!currentPlayer.friends.includes(newFriendUsername)) {
					currentPlayer.friends.push(newFriendUsername);
					setFriendsView(contentContainer);
				} else {
					alert(`${newFriendUsername} ${translations[currentLanguage].alreadyFriend}.`);
				}
			} else {
				alert(`${translations[currentLanguage].user} ${newFriendUsername} ${translations[currentLanguage].notFound}.`);
			}
		}
	});
}
