import { translations as trsl } from "./language_pack.js";
import { fetchWithToken } from "./fetch_request.js";
import { loadPage } from "./app.js";
import { sendMessage } from "./manage_social.js";
import { sendDuelRequestFromAlias } from "./manage_social.js";
import { confirmRemoveFriend } from "./manage_social.js";
import { addFriend } from "./manage_social.js";
import { acceptFriendRequest } from "./manage_social.js";
import { rejectFriendRequest } from "./manage_social.js";
import { cancelFriendRequest } from "./manage_social.js";
import { unblockUser } from "./manage_social.js";
import { blockUser } from "./manage_social.js";
import { getLanguageCookie } from './fetch_request.js';
import { setContainerHtml } from './app.js';

export async function setFriendsView(contentContainer, displayedTab = "friends") {
    const lng = getLanguageCookie() ||  "en";
    let friendRequest;
    let sentFriendRequest;
    let friendData;
    let blockData;
    let response;
    try {
        // console.log("friendRequest data: ", friendRequest);
        // console.log("sentFriendRequest data: ", sentFriendRequest);

    contentContainer.innerHTML = `
        <div class="friends-view">
            <ul class="nav nav-tabs" id="friendsBlockTabs" role="tablist">
                <li class="nav-item">
                    <a class="nav-link active" id="friends-tab" data-bs-toggle="tab" href="#friends" role="tab" aria-controls="friends" aria-selected="true">${trsl[lng].friendList}</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="friend-requests-tab" data-bs-toggle="tab" href="#friend-requests" role="tab" aria-controls="friend-requests" aria-selected="false">${trsl[lng].friendRequests}</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="sent-requests-tab" data-bs-toggle="tab" href="#sent-requests" role="tab" aria-controls="sent-requests" aria-selected="false">${trsl[lng].sentRequests}</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="block-tab" data-bs-toggle="tab" href="#block" role="tab" aria-controls="block" aria-selected="false">${trsl[lng].blockList}</a>
                </li>
            </ul>
            <div class="tab-content">
                <div class="tab-pane fade show active" id="friends" role="tabpanel" aria-labelledby="friends-tab">
                    <button id="addFriendButton" class="btn btn-success mb-3">${trsl[lng].addNewFriend}</button>
                    <ul id="friendsList" class="list-group"></ul>
                </div>
                <div class="tab-pane fade" id="friend-requests" role="tabpanel" aria-labelledby="friend-requests-tab">
                    <ul id="friendRequestList" class="list-group"></ul>
                </div>
                <div class="tab-pane fade" id="sent-requests" role="tabpanel" aria-labelledby="sent-requests-tab">
                    <ul id="sentFriendRequestList" class="list-group"></ul>
                </div>
                <div class="tab-pane fade" id="block" role="tabpanel" aria-labelledby="block-tab">
                    <button id="addBlockButton" class="btn btn-success mb-3">${trsl[lng].addBlock}</button>
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
					<div class="row vcenter">
						<div class="col-md-2 text-center">
							<img
								src="${friend.avatar || '/media/default.jpg'}"
								alt="${friend.alias}'s avatar"
								class="img-fluid rounded-circle"
								style="width: 50px; height: 50px; object-fit: cover;">
						</div>
						<div class="col-md-6">
							<a href="#profile/${friend.alias}" class="profile-link">${friend.alias}</a>
							<p>
								MMR: <span>${friend.mmr}</span>
								<br>
								Wins: <span>${friend.wins}</span>
								<br>
								Losses: <span>${friend.losses}</span>
							</p>
						</div>
						<div class="col-md-4 text-right">
							<button class="btn btn-info btn-sm">${trsl[lng].sendMessage}</button>
							<button class="btn btn-warning btn-sm">${trsl[lng].requestDuel}</button>
							<button class="btn btn-danger btn-sm">${trsl[lng].removeFriend}</button>
						</div>
					</div>
                `;
                friendsList.appendChild(friendItem);
				const sendMessageButton = friendItem.querySelector("button.btn-info");
				sendMessageButton.addEventListener("click", () => sendMessage(friend.alias, contentContainer));

				const sendDuelRequestButton = friendItem.querySelector("button.btn-warning");
				sendDuelRequestButton.addEventListener("click", () => sendDuelRequestFromAlias(friend.alias));

				const removeFriendButton = friendItem.querySelector("button.btn-danger");
				removeFriendButton.addEventListener("click", () => {
                    try {
                        confirmRemoveFriend(friend.alias);
                        renderFriends();
                    } catch(error) {
                        console.log(error);
                        window.location.hash = "login";
                        return;
                    }
                });

            });
        } else {
            friendsList.innerHTML = `<p>${trsl[lng].noFriends}</p>`;
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
                    <div class="row">
                        <div class="col-md-6 vcenter">
                            <a href="#profile/${friendRequesto.from_user}" class="profile-link">${friendRequesto.from_user}</a>
                        </div>
                        <div class="col-md-6 hright">
                            <button class="btn btn-success btn-sm" style="width=50%;">${trsl[lng].accept}</button>
                            <button class="btn btn-danger btn-sm" style="width=50% !important;">${trsl[lng].cancel}</button>
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
            friendRequestList.innerHTML = `<p>${trsl[lng].noFriendRequests}</p>`;
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
                        <div class="col-md-6 vcenter">
                            <a href="#profile/${sentRequest.to_user}" class="profile-link">${sentRequest.to_user}</a>
                        </div>
                        <div class="col-md-6 vcenter hright">
                            <button class="btn btn-danger btn-sm">${trsl[lng].cancel}</button>
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
                        return;
                    }
                });
                sentFriendRequestList.appendChild(sentItem);
            });
        } else {
            sentFriendRequestList.innerHTML = `<p>${trsl[lng].noSentRequests}</p>`;
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
                    <div class="row">
                        <div class="col-md-6 vcenter">
                            <a href="#profile/${block.alias}" class="profile-link">${block.alias}</a>
                        </div>
                        <div class="col-md-6 vcenter hright">
                            <button class="btn btn-danger btn-sm">${trsl[lng].unblock}</button>
                        </div>
                    </div>
                `;
                blockItem.querySelector(".btn-danger").addEventListener("click", async() => {
                    try {
                        await unblockUser(block.alias);
                        renderBlockList();
                    } catch(error) {
                        console.log(error);
                        window.location.hash = "login";
                        return;
                    }
                });
                blockList.appendChild(blockItem);
            });
        } else {
            blockList.innerHTML = `<p>${trsl[lng].noBlocks}</p>`;
        }
    }

	addBlockButton.addEventListener("click", async () => {
		const newBlockUsername = prompt(`${trsl[lng].prompAddBLock}:`);
		if (newBlockUsername) {
            try {
                await blockUser(newBlockUsername);
            } catch(error) {
                console.log(error);
                window.location.hash = "login";
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
		const newfriend = prompt(`${trsl[lng].promptAddFriend}:`);
		if (newfriend) {
            try {
                await addFriend(newfriend);
            } catch(error) {
                console.log(error);
                window.location.hash = "login";
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

    let tabs
    switch (displayedTab) {
        case "friends":
            tabs = new bootstrap.Tab(friendsTab);
            break;
        case "blocks":
            tabs = new bootstrap.Tab(blockTab);
            break;
        case "friend-requests":
            tabs = new bootstrap.Tab(friendRequestsTab);
            break;
        case "sent-friend-requests":
            tabs = new bootstrap.Tab(sentRequestsTab);
            break;
    }
	tabs.show();



	friendsTab.addEventListener("shown.bs.tab", function () {
        window.location.hash = "friends/friends";
	});

	friendRequestsTab.addEventListener("shown.bs.tab", function () {
        window.location.hash = "friends/friend-requests";
	});

	sentRequestsTab.addEventListener("shown.bs.tab", function () {
        window.location.hash = "friends/sent-friend-requests";
	});

	blockTab.addEventListener("shown.bs.tab", function () {
        window.location.hash = "friends/blocks";
	});
    } catch (error) {
        window.location.hash = "login";
        console.log(error);
        return;
    }
}
