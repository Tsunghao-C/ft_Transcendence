import { playerDatas } from "./data_test.js";
import { translations } from "./language_pack.js";
import { setContainerHtml } from './app.js'

export function setFriendsView(contentContainer) {
	const currentLogin = localStorage.getItem("currentLogin");
	const currentPlayer = playerDatas.players[currentLogin];
	const currentLanguage = localStorage.getItem("language");

	// setContainerHtml(contentContainer, "./html/friends.html");

	contentContainer.innerHTML = `
		<!-- Onglets Bootstrap -->
		<div class="friends-view">
			<ul class="nav nav-tabs" id="friendsBlockTabs" role="tablist">
				<li class="nav-item">
					<a class="nav-link active" id="friends-tab" data-bs-toggle="tab" href="#friends" role="tab" aria-controls="friends" aria-selected="true">${translations[currentLanguage].friendList}</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" id="block-tab" data-bs-toggle="tab" href="#block" role="tab" aria-controls="block" aria-selected="false">${translations[currentLanguage].blockList}</a>
				</li>
			</ul>
			<div class="tab-content">
				<!-- Contenu de Friends List -->
				<div class="tab-pane fade show active" id="friends" role="tabpanel" aria-labelledby="friends-tab">
					<h2>${translations[currentLanguage].friendList}</h2>
					<button id="addFriendButton" class="btn btn-success mb-3">${translations[currentLanguage].addNewFriend}</button>
					<ul id="friendsList" class="list-group"></ul>
				</div>
				<!-- Contenu de Block List -->
				<div class="tab-pane fade" id="block" role="tabpanel" aria-labelledby="block-tab">
					<h2>${translations[currentLanguage].blockList}</h2>
					<button id="addBlockButton" class="btn btn-success mb-3">${translations[currentLanguage].addBlock}</button>
					<ul id="blockList" class="list-group"></ul>
				</div>
			</div>
		</div>
	`;

	const friendsList = document.getElementById("friendsList");
	const blockList = document.getElementById("blockList");
	const addFriendButton = document.getElementById("addFriendButton");
	const addBlockButton = document.getElementById("addBlockButton");

	const statusClasses = {
		online: "text-success",
		offline: "text-secondary",
		ingame: "text-warning",
	};

	function renderFriends() {
		friendsList.innerHTML = "";
		currentPlayer.friends.forEach((friendUsername) => {
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
							<button class="btn btn-danger btn-sm float-right ml-2">${translations[currentLanguage].removeFriend}</button>
						</div>
					</div>
				`;

				const sendMessageButton = friendItem.querySelector("button.btn-info");
				sendMessageButton.addEventListener("click", () => sendMessage(friend.username));

				const sendDuelRequestButton = friendItem.querySelector("button.btn-warning");
				sendDuelRequestButton.addEventListener("click", () => sendDuelRequest(friend.username));

				const removeFriendButton = friendItem.querySelector("button.btn-danger");
				removeFriendButton.addEventListener("click", () => confirmRemoveFriend(friend.username));

				friendsList.appendChild(friendItem);
			}
		});
	}

	function renderBlocks() {
		blockList.innerHTML = "";
		currentPlayer.blocks.forEach((blockedUsername) => {
				const blockedUser = playerDatas.players[blockedUsername];
				if (blockedUser) {
					const blockItem = document.createElement("li");
					blockItem.classList.add("list-group-item");
					blockItem.innerHTML = `
						<div class="d-flex justify-content-between align-items-center">
							<a href="#profile/${blockedUser.username}" class="profile-link">${blockedUser.username}</a>
							<button class="btn btn-danger btn-sm">${translations[currentLanguage].unblock}</button>
						</div>
					`;

					const unblockButton = blockItem.querySelector("button");
					unblockButton.addEventListener("click", () => unblockUser(blockedUser.username));

					blockList.appendChild(blockItem);
				}
			});
	}

	function sendMessage(friendUsername) {
		console.log(`Sending message to ${friendUsername}`);
	}

	function sendDuelRequest(friendUsername) {
		console.log(`Requesting duel with ${friendUsername}`);
	}

	function confirmRemoveFriend(friendUsername) {
		const confirmation = confirm(
			`${translations[currentLanguage].validationRemovalFirst} ${friendUsername} ${translations[currentLanguage].validationRemovalSecond} ?`
		);
		if (confirmation) {
			const index = currentPlayer.friends.indexOf(friendUsername);
			if (index > -1) {
				currentPlayer.friends.splice(index, 1);
				renderFriends();
			}
		}
	}

	//REQUEST
	function unblockUser(blockedUsername) {
		const index = currentPlayer.blocks.indexOf(blockedUsername);
		if (index > -1) {
			currentPlayer.blocks.splice(index, 1);
			renderBlocks();
		}
	}

	//REQUEST
	addBlockButton.addEventListener("click", () => {
		const newBlockUsername = prompt(`${translations[currentLanguage].prompAddBLock}:`);
		if (newBlockUsername) {
			const newBlock = playerDatas.players[newBlockUsername];
			if (newBlock) {
				if (newBlock.username === currentPlayer.username) {
					alert(`${translations[currentLanguage].okSasuke}`);
				} else if (!currentPlayer.blocks.includes(newBlockUsername)) {
					currentPlayer.blocks.push(newBlockUsername);
					renderBlocks();
				} else {
					alert(`${newBlockUsername} ${translations[currentLanguage].alreadyBlock}.`);
				}
			} else {
				alert(`${translations[currentLanguage].user} ${newBlockUsername} ${translations[currentLanguage].notFound}.`);
			}
		}
		renderBlocks();
	});

	//REQUEST
	addFriendButton.addEventListener("click", () => {
		const newFriendUsername = prompt(`${translations[currentLanguage].promptAddFriend}:`);
		if (newFriendUsername) {
			const newFriend = playerDatas.players[newFriendUsername];
			if (newFriend) {
				if (newFriend.username === currentPlayer.username) {
					alert(`${translations[currentLanguage].lonelyTest}`);
				} else if (!currentPlayer.friends.includes(newFriendUsername)) {
					currentPlayer.friends.push(newFriendUsername);
					renderFriends();
				} else {
					alert(`${newFriendUsername} ${translations[currentLanguage].alreadyFriend}.`);
				}
			} else {
				alert(`${translations[currentLanguage].user} ${newFriendUsername} ${translations[currentLanguage].notFound}.`);
			}
		}
	});

	renderFriends();
	renderBlocks();

	const friendsTab = document.getElementById("friends-tab");
	const blockTab = document.getElementById("block-tab");

	const tabs = new bootstrap.Tab(friendsTab);
	tabs.show();

	const friendsTabElement = document.getElementById("friends-tab");
	const blockTabElement = document.getElementById("block-tab");

	friendsTabElement.addEventListener("shown.bs.tab", function () {
		document.getElementById('friends').classList.add('show', 'active');
		document.getElementById('block').classList.remove('show', 'active');
	});

	blockTabElement.addEventListener("shown.bs.tab", function () {
		document.getElementById('block').classList.add('show', 'active');
		document.getElementById('friends').classList.remove('show', 'active');
	});
}


