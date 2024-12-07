import { playerDatas } from "./data_test.js";
import { translations } from "./language_pack.js";
import { fetchWithToken } from "./fetch_request.js";
import { loadPage } from "./app.js";

export async function setFriendsView(contentContainer) {
    const currentLanguage = localStorage.getItem("language") || "en";
    let friendRequest;
    let sentFriendRequest;
    let friendData;
    let blockData;
    try {
        friendData = await fetchWithToken('/api/user/get-friends');
        blockData = await fetchWithToken('/api/user/get-blocks');
        console.log("friend list is ", friendData);
        console.log("block list is ", blockData);
        friendRequest = await fetchWithToken('/api/user/get-friend-requests/');
        sentFriendRequest = await fetchWithToken('/api/user/get-sent-friend-requests/');
        // console.log("friendRequest data: ", friendRequest);
        // console.log("sentFriendRequest data: ", sentFriendRequest);
   

    contentContainer.innerHTML = `
        <!-- Onglets Bootstrap -->
        <ul class="nav nav-tabs" id="friendsBlockTabs" role="tablist">
            <li class="nav-item">
                <a class="nav-link active" id="friends-tab" data-bs-toggle="tab" href="#friends" role="tab" aria-controls="friends" aria-selected="true">${translations[currentLanguage].friendList}</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="friend-requests-tab" data-bs-toggle="tab" href="#friend-requests" role="tab" aria-controls="friend-requests" aria-selected="false">${translations[currentLanguage].friendRequests}</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="sent-requests-tab" data-bs-toggle="tab" href="#sent-requests" role="tab" aria-controls="sent-requests" aria-selected="false">${translations[currentLanguage].sentRequests}</a>
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
            <!-- Contenu de Friend Requests -->
            <div class="tab-pane fade" id="friend-requests" role="tabpanel" aria-labelledby="friend-requests-tab">
                <h2>${translations[currentLanguage].friendRequests}</h2>
                <ul id="friendRequestList" class="list-group"></ul>
            </div>
            <!-- Contenu de Sent Requests -->
            <div class="tab-pane fade" id="sent-requests" role="tabpanel" aria-labelledby="sent-requests-tab">
                <h2>${translations[currentLanguage].sentRequests}</h2>
                <ul id="sentFriendRequestList" class="list-group"></ul>
            </div>
            <!-- Contenu de Block List -->
            <div class="tab-pane fade" id="block" role="tabpanel" aria-labelledby="block-tab">
                <h2>${translations[currentLanguage].blockList}</h2>
                <button id="addBlockButton" class="btn btn-success mb-3">${translations[currentLanguage].addBlock}</button>
                <ul id="blockList" class="list-group"></ul>
            </div>
        </div>
    `;

    const friendsList = document.getElementById("friendsList");
    const friendRequestList = document.getElementById("friendRequestList");
    const sentFriendRequestList = document.getElementById("sentFriendRequestList");
    const blockList = document.getElementById("blockList");
    const addFriendButton = document.getElementById("addFriendButton");
    const addBlockButton = document.getElementById("addBlockButton");

    async function renderFriends() {
        friendsList.innerHTML = "";
        friendData = await fetchWithToken('/api/user/get-friends');
        blockData = await fetchWithToken('/api/user/get-blocks');

        if (friendData && friendData.count > 0) {
            friendData.requests.forEach((friend) => {
                const friendItem = document.createElement("li");
                friendItem.classList.add("list-group-item");
                friendItem.innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <a href="#profile/${friend.alias}" class="profile-link">${friend.alias}</a>
                            <p>
                                MMR: <span class="badge badge-primary">${friend.mmr}</span> | 
                                Wins: <span class="badge badge-success">${friend.wins}</span> | 
                                Losses: <span class="badge badge-danger">${friend.losses}</span>
                            </p>
                        </div>
                        <div class="col-md-4 text-right">
                            <button class="btn btn-info btn-sm">${translations[currentLanguage].sendMessage}</button>
                            <button class="btn btn-warning btn-sm">${translations[currentLanguage].requestDuel}</button>
                            <button class="btn btn-danger btn-sm">${translations[currentLanguage].removeFriend}</button>
                        </div>
                    </div>
                `;
                friendsList.appendChild(friendItem);
				const sendMessageButton = friendItem.querySelector("button.btn-info");
				sendMessageButton.addEventListener("click", () => sendMessage(friend.alias));
		
				const sendDuelRequestButton = friendItem.querySelector("button.btn-warning");
				sendDuelRequestButton.addEventListener("click", () => sendDuelRequest(friend.alias));
		
				const removeFriendButton = friendItem.querySelector("button.btn-danger");
				removeFriendButton.addEventListener("click", () => confirmRemoveFriend(friend.alias));
            });
        } else {
            friendsList.innerHTML = `<p>${translations[currentLanguage].noFriends}</p>`;
        }
    }

    async function renderFriendRequests() {
        friendRequest = await fetchWithToken('/api/user/get-friend-requests/');
        friendRequestList.innerHTML = "";
        if (friendRequest && friendRequest.count > 0) {
            friendRequest.requests.forEach((friendRequesto) => {
                const requestItem = document.createElement("li");
                requestItem.classList.add("list-group-item");
                //We could use the time stamp later
                requestItem.innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <a href="#profile/${friendRequesto.from_user}" class="profile-link">${friendRequesto.from_user}</a>
                        </div>
                        <div class="col-md-6 text-right">
                            <button class="btn btn-success btn-sm">${translations[currentLanguage].accept}</button>
                            <button class="btn btn-danger btn-sm">${translations[currentLanguage].cancel}</button>
                        </div>
                    </div>
                `;
                requestItem.querySelector(".btn-success").addEventListener("click", () => acceptFriendRequest(friendRequesto.from_user));
                requestItem.querySelector(".btn-danger").addEventListener("click", () => rejectFriendRequest(friendRequesto.from_user));
                friendRequestList.appendChild(requestItem);
            });
        } else {
            friendRequestList.innerHTML = `<p>${translations[currentLanguage].noFriendRequests}</p>`;
        }
    }

    async function renderSentRequests() {
        sentFriendRequest = await fetchWithToken('/api/user/get-sent-friend-requests/');
        sentFriendRequestList.innerHTML = "";
        if (sentFriendRequest && sentFriendRequest.count > 0) {
            sentFriendRequest.requests.forEach((sentRequest) => {
                const sentItem = document.createElement("li");
                sentItem.classList.add("list-group-item");
                //we could use the timestamp as well
                sentItem.innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <a href="#profile/${sentRequest.to_user}" class="profile-link">${sentRequest.to_user}</a>
                        </div>
                        <div class="col-md-6 text-right">
                            <button class="btn btn-danger btn-sm">${translations[currentLanguage].cancel}</button>
                        </div>
                    </div>
                `;
                sentItem.querySelector(".btn-danger").addEventListener("click", () => cancelFriendRequest(sentRequest.to_user));
                sentFriendRequestList.appendChild(sentItem);
            });
        } else {
            sentFriendRequestList.innerHTML = `<p>${translations[currentLanguage].noSentRequests}</p>`;
        }
    }

    async function renderBlockList() {
        blockData = await fetchWithToken('/api/user/get-blocks');

        blockList.innerHTML = "";
        if (blockData && blockData.count > 0) {
            blockData.requests.forEach((block) => {
                const blockItem = document.createElement("li");
                blockItem.classList.add("list-group-item");
                blockItem.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <a href="#profile/${block.alias}" class="profile-link">${block.alias}</a>
                        <button class="btn btn-danger btn-sm">${translations[currentLanguage].unblock}</button>
                    </div>
                `;
                blockItem.querySelector(".btn-danger").addEventListener("click", () => unblockUser(block.alias));
                blockList.appendChild(blockItem);
            });
        } else {
            blockList.innerHTML = `<p>${translations[currentLanguage].noBlocks}</p>`;
        }
    }

	function sendMessage(friendUsername) {
		console.log(`Sending message to ${friendUsername}`);
	}
	
	function sendDuelRequest(friendUsername) {
		console.log(`Requesting duel with ${friendUsername}`);
	}
	
	function confirmRemoveFriend(friendAlias) {
		const confirmation = confirm(
			`${translations[currentLanguage].validationRemovalFirst} ${friendAlias} ${translations[currentLanguage].validationRemovalSecond} ?`
		);
		if (confirmation) {
			removeFriend(friendAlias);
		}
	}

    async function removeFriend(friendAlias) {
		console.log(`removing friend from ${friendAlias}`);
        let data;
            try {
                const body = JSON.stringify({
                    alias : friendAlias
                  });
                data = await fetchWithToken('/api/user/delete-friend/', body, 'POST');
            } catch (error) {
                console.log(error);
                return;
            }
        renderFriends();
	}
	
	async function acceptFriendRequest(friendUsername) {
		console.log(`Accepting friend request from ${friendUsername}`);
        let data;
            try {
                const body = JSON.stringify({
                    fromAlias: friendUsername,
                  });
                data = await fetchWithToken('/api/user/accept-friend-request/', body, 'POST');
            } catch (error) {
                console.log(error);
                return;
            }
        renderFriends();
        renderFriendRequests();
	}
	
	async function rejectFriendRequest(notFriendUsername) {
		console.log(`Brutally Rejecting friend request from ${notFriendUsername}`);
        let data;
            try {
                const body = JSON.stringify({
                    fromAlias: notFriendUsername,
                  });
                data = await fetchWithToken('/api/user/reject-friend-request/', body, 'POST');
            } catch (error) {
                console.log(error);
                return;
            }
        renderFriendRequests();
	}
	
	async function cancelFriendRequest(friendAlias) {
		console.log(`Canceling sent friend request to ${friendAlias}`);
        let data;
            try {
                const body = JSON.stringify({
                    toAlias: friendAlias
                  });
                data = await fetchWithToken('/api/user/cancel-friend-request/', body, 'POST');
            } catch (error) {
                console.log(error);
                return;
            }
        renderSentRequests();
	}
	
    async function unblockUser(blockedUser) {
        console.log(`unblocking friend from ${blockedUser}`);
        let data;
            try {
                const body = JSON.stringify({
                    alias: blockedUser,
                    });
                data = await fetchWithToken('/api/user/unblock-user/', body, 'POST');
            } catch (error) {
                console.log(error);
                return;
            }
        renderBlockList();
    }

	addBlockButton.addEventListener("click", async () => {
		const newBlockUsername = prompt(`${translations[currentLanguage].prompAddBLock}:`);
		if (newBlockUsername) {
            let data;
            try {
                const body = JSON.stringify({ alias: newBlockUsername });
                data = await fetchWithToken('/api/user/block-user/', body, 'POST');
            } catch (error) {
                console.log(error);
                return;
            }
            if (data.detail === 'this user is already blocked') {
                alert(`${newBlockUsername} ${translations[currentLanguage].alreadyBlock}.`);
            } else if (data.detail === 'No CustomUser matches the given query.' ) {
                alert(`${translations[currentLanguage].user} ${newBlockUsername} ${translations[currentLanguage].notFound}.`);
            } else if (data.detail === 'you cannot befriend yourself' ) {
                alert(`${translations[currentLanguage].okSasuke}`);
            }
        }
		renderBlockList();
        renderFriends();
	});

	//REQUEST
	addFriendButton.addEventListener("click", async () => {
		const newfriend = prompt(`${translations[currentLanguage].promptAddFriend}:`);
		if (newfriend) {
			let data;
			try {
				const body = JSON.stringify({ toAlias: newfriend });
				data = await fetchWithToken('/api/user/send-friend-request/', body, 'POST');
				// console.log("User data: ", data);
			} catch (error) {
				console.log(error);
				return;
			}
			if (data.detail === 'Friend request was already sent.') {
						alert(`${newfriend} ${translations[currentLanguage].alreadyFriend}.`);
			} else if (data.detail === 'No CustomUser matches the given query.' ) {
				alert(`${translations[currentLanguage].user} ${newfriend} ${translations[currentLanguage].notFound}.`);
			} else if (data.detail === 'you cannot befriend yourself' ) {
				alert(`${translations[currentLanguage].lonelyTest}`);
			}
		}
        renderSentRequests();
	});

    renderFriends();
    renderFriendRequests();
    renderSentRequests();
    renderBlockList();

	const friendsTab = document.getElementById("friends-tab");
	const blockTab = document.getElementById("block-tab");
	const friendRequestsTab = document.getElementById("friend-requests-tab");
	const sentRequestsTab = document.getElementById("sent-requests-tab");

	const tabs = new bootstrap.Tab(friendsTab);
	tabs.show();



	friendsTab.addEventListener("shown.bs.tab", function () {
		document.getElementById('friends').classList.add('show', 'active');
		document.getElementById('friend-requests').classList.remove('show', 'active');
		document.getElementById('sent-requests').classList.remove('show', 'active');
		document.getElementById('block').classList.remove('show', 'active');
	});

	friendRequestsTab.addEventListener("shown.bs.tab", function () {
		document.getElementById('friend-requests').classList.add('show', 'active');
		document.getElementById('friends').classList.remove('show', 'active');
		document.getElementById('sent-requests').classList.remove('show', 'active');
		document.getElementById('block').classList.remove('show', 'active');
	});

	sentRequestsTab.addEventListener("shown.bs.tab", function () {
		document.getElementById('sent-requests').classList.add('show', 'active');
		document.getElementById('friends').classList.remove('show', 'active');
		document.getElementById('friend-requests').classList.remove('show', 'active');
		document.getElementById('block').classList.remove('show', 'active');
	});

	blockTab.addEventListener("shown.bs.tab", function () {
		document.getElementById('block').classList.add('show', 'active');
		document.getElementById('friends').classList.remove('show', 'active');
		document.getElementById('friend-requests').classList.remove('show', 'active');
		document.getElementById('sent-requests').classList.remove('show', 'active');
	});
    } catch (error) {
        window.location.hash = "login";
        console.log(error);
        loadPage("login");
        return;
    }
}
