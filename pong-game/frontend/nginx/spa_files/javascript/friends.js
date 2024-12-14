import { translations } from "./language_pack.js";
import { fetchWithToken } from "./fetch_request.js";
import { loadPage } from "./app.js";
import { sendMessage } from "./manage_social.js";
import { sendDuelRequest } from "./manage_social.js";
import { confirmRemoveFriend } from "./manage_social.js";
import { addFriend } from "./manage_social.js";
import { acceptFriendRequest } from "./manage_social.js";
import { rejectFriendRequest } from "./manage_social.js";
import { cancelFriendRequest } from "./manage_social.js";
import { unblockUser } from "./manage_social.js";
import { blockUser } from "./manage_social.js";
import { getLanguageCookie } from './fetch_request.js';
import { setContainerHtml } from './app.js';

export async function setFriendsView(contentContainer) {
    const currentLanguage = getLanguageCookie() ||  "en";
    let friendRequest;
    let sentFriendRequest;
    let friendData;
    let blockData;
    let response;
    try {
        // console.log("friendRequest data: ", friendRequest);
        // console.log("sentFriendRequest data: ", sentFriendRequest);


    contentContainer.innerHTML = `
        <!-- Onglets Bootstrap -->
        <div class="friends-view">
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
                <div class="tab-pane fade show active" id="friends" role="tabpanel" aria-labelledby="friends-tab">
                    <h3>${translations[currentLanguage].friendList}</h3>
                    <button id="addFriendButton" class="btn btn-success mb-3">${translations[currentLanguage].addNewFriend}</button>
                    <ul id="friendsList" class="list-group"></ul>
                </div>
                <div class="tab-pane fade" id="friend-requests" role="tabpanel" aria-labelledby="friend-requests-tab">
                    <h3>${translations[currentLanguage].friendRequests}</h3>
                    <ul id="friendRequestList" class="list-group"></ul>
                </div>
                <div class="tab-pane fade" id="sent-requests" role="tabpanel" aria-labelledby="sent-requests-tab">
                    <h3>${translations[currentLanguage].sentRequests}</h3>
                    <ul id="sentFriendRequestList" class="list-group"></ul>
                </div>
                <div class="tab-pane fade" id="block" role="tabpanel" aria-labelledby="block-tab">
                    <h3>${translations[currentLanguage].blockList}</h3>
                    <button id="addBlockButton" class="btn btn-success mb-3">${translations[currentLanguage].addBlock}</button>
                    <ul id="blockList" class="list-group"></ul>
                </div>
            </div>
        </div>
    `;

    function switchTab(tabToShowId) {
        const tabs = ['friends', 'friend-requests', 'sent-requests', 'block'];

        tabs.forEach(tabId => {
            const tabElement = document.getElementById(tabId);

            if (tabElement) {
                if (tabId === tabToShowId) {
                    tabElement.classList.add('show', 'active');
                } else {
                    tabElement.classList.remove('show', 'active');
                }
            }
        });
    }


    const friendsList = document.getElementById("friendsList");
    const friendRequestList = document.getElementById("friendRequestList");
    const sentFriendRequestList = document.getElementById("sentFriendRequestList");
    const blockList = document.getElementById("blockList");
    const addFriendButton = document.getElementById("addFriendButton");
    const addBlockButton = document.getElementById("addBlockButton");

    async function renderFriends() {
        friendsList.innerHTML = "";
        response = await fetchWithToken('/api/user/get-friends');
        friendData = await response.json()

        if (friendData && friendData.count > 0) {
            friendData.requests.forEach((friend) => {
                const friendItem = document.createElement("li");
                friendItem.classList.add("list-group-item");
                friendItem.innerHTML = `
					<div class="row align-items-center">
						<div class="col-md-2 text-center">
							<img
								src="${friend.avatar || '/media/default.jpg'}"
								alt="${friend.alias}'s avatar"
								class="img-fluid rounded-circle"
								style="width: 50px; height: 50px; object-fit: cover;">
						</div>
						<div class="col-md-4">
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
				sendMessageButton.addEventListener("click", () => sendMessage(friend.alias, contentContainer));

				const sendDuelRequestButton = friendItem.querySelector("button.btn-warning");
				sendDuelRequestButton.addEventListener("click", () => sendDuelRequest(friend.alias));

				const removeFriendButton = friendItem.querySelector("button.btn-danger");
				removeFriendButton.addEventListener("click", () => {
                    try {
                        confirmRemoveFriend(friend.alias);
                        renderFriends();
                    } catch(error) {
                        console.log(error);
                        window.location.hash = "login";
                        loadPage("login");
                        return;
                    }
                });

            });
        } else {
            friendsList.innerHTML = `<p>${translations[currentLanguage].noFriends}</p>`;
        }
    }

    async function renderFriendRequests() {
        friendRequestList.innerHTML = "";
        response = await fetchWithToken('/api/user/get-friend-requests/');
        friendRequest = await response.json()
        if (friendRequest && friendRequest.count > 0) {
            friendRequest.requests.forEach((friendRequesto) => {
                const requestItem = document.createElement("li");
                requestItem.classList.add("list-group-item");
                //We could use the time stamp later
                requestItem.innerHTML = `
                        <div class="col-md-6">
                            <a href="#profile/${friendRequesto.from_user}" class="profile-link">${friendRequesto.from_user}</a>
                        </div>
                        <div class="col-md-6 text-right">
                            <button class="btn btn-success btn-sm">${translations[currentLanguage].accept}</button>
                            <button class="btn btn-danger btn-sm">${translations[currentLanguage].cancel}</button>
                        </div>
                    </div>
                `;
                requestItem.querySelector(".btn-success").addEventListener("click", async() => {
                    await acceptFriendRequest(friendRequesto.from_user);
                    renderFriends();
                    renderFriendRequests();
                });
                requestItem.querySelector(".btn-danger").addEventListener("click", async() => {
                    await rejectFriendRequest(friendRequesto.from_user);
                    renderFriendRequests();
                });
                friendRequestList.appendChild(requestItem);
            });
        } else {
            friendRequestList.innerHTML = `<p>${translations[currentLanguage].noFriendRequests}</p>`;
        }
    }

    async function renderSentRequests() {
        sentFriendRequestList.innerHTML = "";
        response = await fetchWithToken('/api/user/get-sent-friend-requests/');
        sentFriendRequest = await response.json();
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
                sentItem.querySelector(".btn-danger").addEventListener("click", async () => {
                    try {
                        await cancelFriendRequest(sentRequest.to_user);
                        renderSentRequests();
                    } catch(error) {
                        console.log(error);
                        window.location.hash = "login";
                        loadPage("login");
                        return;
                    }
                });
                sentFriendRequestList.appendChild(sentItem);
            });
        } else {
            sentFriendRequestList.innerHTML = `<p>${translations[currentLanguage].noSentRequests}</p>`;
        }
    }

    async function renderBlockList() {
        blockList.innerHTML = "";

        response = await fetchWithToken('/api/user/get-blocks');
        blockData = await response.json();
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
                blockItem.querySelector(".btn-danger").addEventListener("click", async() => {
                    try {
                        await unblockUser(block.alias);
                        renderBlockList();
                    } catch(error) {
                        console.log(error);
                        window.location.hash = "login";
                        loadPage("login");
                        return;
                    }
                });
                blockList.appendChild(blockItem);
            });
        } else {
            blockList.innerHTML = `<p>${translations[currentLanguage].noBlocks}</p>`;
        }
    }

	addBlockButton.addEventListener("click", async () => {
		const newBlockUsername = prompt(`${translations[currentLanguage].prompAddBLock}:`);
		if (newBlockUsername) {
            try {
                await blockUser(newBlockUsername);
            } catch(error) {
                console.log(error);
                window.location.hash = "login";
                loadPage("login");
                return;
            }
        }
		renderBlockList();
        renderSentRequests();
        renderFriendRequests();
        renderFriends();
	});

	//REQUEST
	addFriendButton.addEventListener("click", async () => {
		const newfriend = prompt(`${translations[currentLanguage].promptAddFriend}:`);
		if (newfriend) {
            try {
                await addFriend(newfriend);
            } catch(error) {
                console.log(error);
                window.location.hash = "login";
                loadPage("login");
                return;
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
        switchTab('friends');
	});

	friendRequestsTab.addEventListener("shown.bs.tab", function () {
        switchTab('friend-requests');
	});

	sentRequestsTab.addEventListener("shown.bs.tab", function () {
        switchTab('sent-requests');
	});

	blockTab.addEventListener("shown.bs.tab", function () {
        switchTab('block');
	});
    } catch (error) {
        window.location.hash = "login";
        console.log(error);
        loadPage("login");
        return;
    }
}
