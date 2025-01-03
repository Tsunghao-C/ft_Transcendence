import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from "./fetch_request.js";
import { getCookie } from "./fetch_request.js";
import { state } from "./app.js";
import { clearInput, hideElem, showElem, hideClass, showClass } from "./utils.js";
import { sendDuelRequestFromGameRoom } from "./manage_social.js";
import { translations as trsl } from "./language_pack.js";
import { isAlphanumeric } from "./utils.js";

////////////////////////////////// Utils //////////////////////////////////

function showError(message, roomType) {
	let errorMessage;
	let successMessage;
	if (roomType === "private") {
		errorMessage = document.getElementById("pmErrorMessage");
		successMessage = document.getElementById("pmSuccessMessage");
	} else if (roomType === "public") {
		errorMessage = document.getElementById("chatRoomsErrorMessage");
		successMessage = document.getElementById("chatRoomsSuccessMessage");
	}
	successMessage.textContent = "";
	errorMessage.textContent = message;
}

////////////////////////////////// Fetch data //////////////////////////////////

async function fetchChatRoomsData() {
	try {
		const response = await fetchWithToken('/api/chat/user_chatrooms');
		const userRoomData = await response.json();
		return {
			success: true,
			roomData: userRoomData.rooms,
			userAlias: userRoomData.userAlias
		};
	} catch (error) {
		console.log(error);
		window.location.hash = "login";
		console.log("Failed to fetch chat room data.");
		return { success: false };
	}
}

////////////////////////////////// Setup Html //////////////////////////////////

function setChatViewHtml(contentContainer) {
	contentContainer.innerHTML = `
		<div class="chat-view">
			<ul class="nav nav-tabs" id="chatBlockTabs" role="tablist">
				<li class="nav-item">
					<a class="nav-link active" id="private-message-tab" data-bs-toggle="tab" href="#private-message" role="tab" aria-controls="private-message" aria-selected="true">${trsl[state.language].privateMessages}</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" id="chat-rooms-tab" data-bs-toggle="tab" href="#chat-rooms" role="tab" aria-controls="chat-rooms" aria-selected="false">${trsl[state.language].chatRooms}</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" id="tournament-tab" data-bs-toggle="tab" href="#tournament-rooms" role="tab" aria-controls="chat-rooms" aria-selected="false">${trsl[state.language].tournamentRooms}</a>
				</li>
			</ul>
			<div class="tab-content">
				<div class="tab-pane fade show active" id="private-message" role="tabpanel" aria-labelledby="private-message-tab">
					<div class="chat-views-searchbar">
						<input type="text" id="recipientUser" placeholder="${trsl[state.language].searchByUsername}">
						<button id="start-private-chat">${trsl[state.language].searchButton}</button>
					</div>
					<div>
						<p id="pmErrorMessage" class="errorMessage"></p>
						<p id="pmSuccessMessage" class="successMessage"></p>
					</div>
					<div class="room-list" id="pm-list" style="margin-bottom: 20px;"></div>
					<div class="chat-content" id="chat-content" style="display:none;">
						<div id="chat-content-top">
							<h4 id="pm-recipient"></h4>
							<button class="go-back">${trsl[state.language].goBackButton}</button>
						</div>
						<div id="messages" style="height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;"></div>
						<div id="chat-content-bottom">
							<input class="message-input" type="text" placeholder="${trsl[state.language].typeMessage}">
							<button class="send-message"">${trsl[state.language].send}</button>
							<button id="send-private-invite">${trsl[state.language].play}</button>
						</div>
					</div>
				</div>
				<div class="tab-pane fade" id="chat-rooms" role="tabpanel" aria-labelledby="chat-rooms-tab">
					<div class="chat-views-searchbar">
						<input type="text" id="room-name" placeholder="${trsl[state.language].enterRoomName}">
						<button id="create-public-room">${trsl[state.language].createOrJoinRoom}</button>
					</div>
					<div>
						<p id="chatRoomsErrorMessage" class="errorMessage"></p>
						<p id="chatRoomsSuccessMessage" class="successMessage"></p>
					</div>
					<div class="room-list" id="public-room-list" style="margin-bottom: 20px;"></div>
					<div class="chat-content" id="room-chat-content" style="display:none;">
						<div id="chat-content-top">
							<h4 id="chat-room-title"></h4>
							<button class="go-back">${trsl[state.language].goBackButton}</button>
						</div>
						<div id="chat-room-messages" style="height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;"></div>
						<div id="chat-content-bottom">
							<input class="message-input" id="message-input" type="text" placeholder="${trsl[state.language].typeMessage}">
							<button class="send-message" id="send-message">${trsl[state.language].send}</button>
							<button id="send-public-invite">${trsl[state.language].play}</button>
						</div>
					</div>
				</div>
				<div class="tab-pane fade" id="tournament" role="tabpanel" aria-labelledby="tournament-tab">
					<div class="room-list" id="tournament-list" style="margin-bottom: 20px;"></div>
					<div class="chat-content" id="tournament-content" style="display:none;">
						<div id="tournament-content-top">
							<h4 id="tournament-title"></h4>
							<button class="go-back">${trsl[state.language].goBackButton}</button>
						</div>
						<div id="tournament-messages" style="height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;"></div>
					</div>
				</div>
			</div>
		</div>
		`
}

function handleTabs(roomType = "") {
	const pmNavTab = document.getElementById("private-message-tab");
	const chatRoomsNavTab = document.getElementById("chat-rooms-tab");
	const tournamentNavTab = document.getElementById("tournament-tab");
	const pmTabPane = document.getElementById("private-message");
	const chatRoomsTabPane = document.getElementById("chat-rooms");
	const tournamentTabPane = document.getElementById("tournament");

	if (roomType == "public") {
		pmNavTab.className = "nav-link";
		chatRoomsNavTab.className = "nav-link active";
		tournamentNavTab.className = "nav-link";
		pmTabPane.className = "tab-pane fade";
		tournamentTabPane.className = "tab-pane fade";
		chatRoomsTabPane.className = "tab-pane fade show active";
	} else if (roomType == "tournament") {
		pmNavTab.className = "nav-link";
		chatRoomsNavTab.className = "nav-link";
		tournamentNavTab.className = "nav-link active";
		pmTabPane.className = "tab-pane fade";
		chatRoomsTabPane.className = "tab-pane fade";
		tournamentTabPane.className = "tab-pane fade show active";
	} else {
		pmNavTab.className = "nav-link active";
		chatRoomsNavTab.className = "nav-link";
		tournamentNavTab.className = "nav-link";
		pmTabPane.className = "tab-pane fade show active";
		chatRoomsTabPane.className = "tab-pane fade";
		tournamentTabPane.className = "tab-pane fade";
	}
	pmNavTab.addEventListener("shown.bs.tab", function () {
		window.location.hash = "chat/private";
	});
	chatRoomsNavTab.addEventListener("shown.bs.tab", function () {
		window.location.hash = "chat/public";
	});

	tournamentNavTab.addEventListener("shown.bs.tab", function () {
		window.location.hash = "chat/tournament";
	});
}

////////////////////////////////// Setup Lists //////////////////////////////////

function setPmList(roomData) {
	const pmList = document.getElementById("pm-list");
	pmList.innerHTML = roomData
	.map(room => {
		const roomType = room.is_private ? "private" : "public";
		if (roomType === "private" && !room.is_tournament) {
			const aliasOrRoomName = room.other_member || "Unknown";
			const roomDisplayName = `${aliasOrRoomName}`;
				return `<div class="room-item"
						data-room-type="${roomType}"
						data-alias-or-room-name="${aliasOrRoomName}"
						style="cursor: pointer; margin: 5px 0; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
							<p>${roomDisplayName}</p>
					</div>`;
		}
	})
	.join("");
}

function setTournamentList(roomData) {
	const pmList = document.getElementById("tournament-list");
	pmList.innerHTML = roomData
	.map(room => {
		const roomType = room.is_tournament ? "tournament" : "no tournament";
		if (roomType === "tournament") {
			const aliasOrRoomName = room.name;
			const roomDisplayName = aliasOrRoomName.split("_").slice(2);
			return `<div class="room-item"
					data-room-type="${roomType}"
					data-alias-or-room-name="${aliasOrRoomName}"
					style="cursor: pointer; margin: 5px 0; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
						<p>${roomDisplayName}</p>
				</div>`;
		}
	})
	.join("");
}

function setRoomsList(roomData) {
	const roomList = document.getElementById("public-room-list");
	roomList.innerHTML = roomData
	.map(room => {
		const roomType = room.is_private ? "private" : "public";
		if (roomType === "public") {
			const roomName = room.name;
			return `<div class="room-item"
						data-room-type="${roomType}"
						data-alias-or-room-name="${roomName}"
						style="cursor: pointer; margin: 5px 0; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
							<p>${roomName}</p>
					</div>`;
		}
	})
	.join("");
}

////////////////////////////////// Event listeners //////////////////////////////////

function startPrivateChatEventListener() {
	document.getElementById("start-private-chat").addEventListener("click", async () => {
		const recipientUser = document.getElementById("recipientUser").value;
		try {
			if (recipientUser) {
				if (isAlphanumeric(recipientUser)) {
					console.log("Opening chat with", recipientUser);
					window.location.hash = `chat/private/${recipientUser}`;
				}
			}
		} catch(error) {
			console.log(error);
			window.location.hash = "login";
		}
	})
}

function createOrJoinRoomButtonEventListener() {
	document.getElementById("create-public-room").addEventListener('click', async () => {
		const roomName = document.getElementById("room-name").value;
		if (roomName) {
			try {
				if (!isAlphanumeric(roomName, "Room Name")) {
					return;
				}
				const response = await fetchWithToken(
					'/api/chat/create/',
					JSON.stringify({ name: roomName, is_private: false }),
					'POST'
				);
				const responseData = await response.json();
				if (response.ok) {
					window.location.hash = `chat/public/${responseData.room.name}`;
				} else if (responseData.error === "A room with this name already exists.") {
					window.location.hash = `chat/public/${roomName}`;
				} else {
					const errorData = responseData;
					showError(`Failed to create room: ${errorData.error}`, "public");
				}
			} catch (error) {
				console.error("Error creating public room:", error);
				showError(`Failed to create room: ${error}`, "public");
			}
		} else {
			showError("Room name is empty", "public");
		}
	});
}

function roomButtonsEventListener() {
	document.querySelectorAll(".room-item").forEach(item => {
		item.addEventListener("click", (event) => {
			console.log("In rooms button event listener");
			const roomType = event.currentTarget.getAttribute("data-room-type");
			const aliasOrRoomName = event.currentTarget.getAttribute("data-alias-or-room-name");
			window.location.hash = `chat/${roomType}/${aliasOrRoomName}`;
		});
	});
}

function backButtonEventListener() {
	const goBackButtons = document.querySelectorAll('.go-back');
	goBackButtons.forEach(button => {
		button.addEventListener('click', () => {
			console.log("Go back button clicked!");
			window.history.back();
		});
	});
}

function sendMessageEventListener(userAlias) {
	const sendButtons = document.querySelectorAll(".send-message");
	const messageInputs = document.querySelectorAll(".message-input");

	sendButtons.forEach((button) => {
		button.addEventListener("click", async () => {
			console.log("in SendMessage");
			const input = button.closest(".chat-content").querySelector(".message-input");
			if (input.value && state.chatSocket) {
				const messageData = {
					message: input.value,
					alias: userAlias,
					time: new Date().toLocaleTimeString(),
				};
				state.chatSocket.send(JSON.stringify(messageData));
				input.value = "";
			} else {
				alert("Message input is empty or WebSocket is not connected.");
			}
		});
	});

	messageInputs.forEach((input) => {
		input.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				const button = input.closest(".chat-content").querySelector(".send-message");
				button.click();
			}
		});
	});
}

////////////////////////////////// Get Chat Rooms //////////////////////////////////

async function loadChatRoom(roomName, userAlias, roomType, roomNameDisplay = roomName) {
	console.log("at loadChatRoom, user alias is :", userAlias);
	if (state.chatSocket) {
		console.log("Closing existing WebSocket connection.");
		state.chatSocket.close();
		state.chatSocket = null;
	}
	let messagesDiv;
	let chatRoomTitle;
	if (roomType == "private") {
		messagesDiv = document.getElementById("messages");
		chatRoomTitle = document.getElementById("pm-recipient");
	} else if (roomType == "public") {
		messagesDiv = document.getElementById("chat-room-messages");
		chatRoomTitle = document.getElementById("chat-room-title");
	} else {
		messagesDiv = document.getElementById("tournament-messages");
		chatRoomTitle = document.getElementById("tournament-title");
	}

	chatRoomTitle.textContent = `${roomNameDisplay}`;
	messagesDiv.innerHTML = "<p>Loading messages...</p>";

	const wsScheme = 'wss'

	const token = getCookie("accessToken");
	const wsUrl = `${wsScheme}://${window.location.host}/ws/chat-server/${roomName}/?token=${encodeURIComponent(token)}`;
	console.log("Connecting to WebSocket:", wsUrl);

	state.chatSocket = new WebSocket(wsUrl);
	state.chatSocket.onopen = function () {
		console.log("WebSocket connected.");
	};
	state.chatSocket.onerror = function (error) {
		console.error("WebSocket error:", error);
	};

	state.chatSocket.onmessage = function (e) {
		const messageData = JSON.parse(e.data);
		console.log("message received", messageData);
		addMessage(userAlias, messageData.alias, messageData.message, messageData.time, messageData.is_invite, messageData.game_room, roomType);
	};

	try {
		const response = await fetchWithToken(`/api/chat/${roomName}/messages/`);
		if (response.ok) {
			console.log("RESPONSE IS OKKKK");
			hideClass("chat-views-searchbar");
			hideClass("room-list");
			showClass("chat-content", "block");
			const listMessageData = await response.json();
			messagesDiv.innerHTML = "";
			console.log("listMessageData is : ", listMessageData);
			listMessageData.forEach(msg => {
				console.log("before addMessage2 roomType is : ", roomType);
				addMessage(userAlias, msg.sender, msg.content, msg.timestamp, msg.is_invite, msg.game_room, roomType);
			});
			showClass("chat-content", "block");
			// showElem("room-chat-content", "block");

			console.log("showing elem");
		} else {
			messagesDiv.innerHTML = "<p>Error loading messages.</p>";
		}
	} catch (error) {
		console.error("Error fetching messages:", error);
		messagesDiv.innerHTML = "<p>Error loading messages.</p>";
	}

	sendMessageEventListener(userAlias);

	if (roomType == "private") {
		document.getElementById("send-private-invite").addEventListener("click", sendInvite);
	} else if (roomType == "public") {
		document.getElementById("send-public-invite").addEventListener("click", sendInvite);
	}

	async function sendInvite() {
		sendDuelRequestFromGameRoom(roomName);
	}
}

async function getOrCreatePrivateChatRoom(alias, userAlias, roomType) {

	console.log("ZZZZZZ roomType is :", roomType);
	try {
		const response = await fetchWithToken(
			'/api/chat/create-private/',
			JSON.stringify({ alias: alias }),
			'POST'
		);
		if (response.ok) {
			const roomData = await response.json();
			loadChatRoom(roomData.name, userAlias, roomType, `${alias}`);
		} else {
			const errorData = await response.json();
			if (errorData.detail === "You are blocking this user") {
				showError("You blocked this user", "private");
			} else if (errorData.detail === "This user is blocking you") {
				showError("You have been blocked by this user", "private");
			} else if (errorData.detail === "You cannot create a private room with yourself.") {
				showError("You cannot create a private room with yourself.", "private");
			} else if (errorData.error === "User not found.") {
				showError("User not found", "private");
			} else {
				showError("An unattended error occured, please try again later", "private");
			}
		}
	} catch (error) {
		console.log(error);
		window.location.hash = "login";
		return;
	}
}

function addMessage(userAlias, alias, message, time, isInvite = false, gameRoom = null, roomType) {
	// console.log("adding message : ", message);
	// console.log("roomtype is : ", roomType);
	// console.log("is invite is : ", isInvite);
	// console.log("alias is  : ", alias);
	// console.log("userAlias is  : ", userAlias);
	const lng = getLanguageCookie() || "en";
	let messagesDiv;
	if (roomType === "public") {
		messagesDiv = document.getElementById("chat-room-messages");
	} else if (roomType === "private") {
		messagesDiv = document.getElementById("messages");
	} else {
		messagesDiv = document.getElementById("tournament-messages");
	}
	const messageElement = document.createElement("div");
	if (roomType == "tournament") {
		messageElement.style.textAlign = "left";
		const teams = message.split("/");
		const formattedMessage = teams.length === 2 ? `${teams[0]} vs ${teams[1]}` : `${trsl[state.language].tournamentIsOver} ${message}`;

		messageElement.innerHTML = `
			<strong>
				<a style="text-decoration: none; color: #007bff;">
					Tournament
				</a>
			</strong>
			<em>(${time})</em>:<br>
			<div style="display: inline-block; background-color: #f1f1f1; padding: 10px; border-radius: 10px; max-width: 70%;">
				<a href="#tournament" style="text-decoration: none; color: #007bff;">${formattedMessage}</a>
			</div>`;
	} else {
		if (alias === userAlias) {
			messageElement.style.textAlign = "right";
			messageElement.innerHTML = `
				<div style="display: inline-block; text-align: left; background-color: #e1f5fe; padding: 10px; border-radius: 10px; max-width: 70%;">
					<em>${time}</em><br>
					${isInvite && gameRoom ? `<a href="#lobby/${gameRoom}" style="text-decoration: none; color: #007bff;">You Sent an Invite</a>` : message}
				</div>`;
		} else {
			messageElement.style.textAlign = "left";
			messageElement.innerHTML = `
				<strong>
					<a href="#profile/${alias}" style="text-decoration: none; color: #007bff;">
						${alias}
					</a>
				</strong>
				<em>(${time})</em>:<br>
				<div style="display: inline-block; background-color: #f1f1f1; padding: 10px; border-radius: 10px; max-width: 70%;">
					${isInvite && gameRoom ? `<a href="#lobby/${gameRoom}" style="text-decoration: none; color: #007bff;">${message}</a>` : message}
				</div>`;
		}
	}
	messagesDiv.appendChild(messageElement);
	messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

////////////////////////////////// Main function //////////////////////////////////

export async function setChatView(contentContainer, roomType = "", aliasOrRoomToJoin = "") {
	console.log("******** AT THE BEGINNING OF SET CHAT VIEW ********");

	// Fetch Chat Rooms Data
	const { success, roomData, userAlias } = await fetchChatRoomsData();
	console.log("at beginning, user alias is :", userAlias);
	if (!success)
		return;

	// Set innerHtml
	setChatViewHtml(contentContainer);
	handleTabs();

	// Set room lists
	setPmList(roomData);
	setRoomsList(roomData);
	setTournamentList(roomData);
	// Event listeners - In list display
	startPrivateChatEventListener();
	createOrJoinRoomButtonEventListener();
	roomButtonsEventListener();

	// Event listeners - In chat display
	backButtonEventListener();
	if (!aliasOrRoomToJoin) {
		return ;
	}
	if (roomType === "public") {
		loadChatRoom(aliasOrRoomToJoin, userAlias, roomType);
	} else if (roomType == "tournament") {
		loadChatRoom(aliasOrRoomToJoin, userAlias, roomType, "Tournament " + aliasOrRoomToJoin.split("_").slice(2));
	} else if (roomType === "private"){
		if (aliasOrRoomToJoin !== "") {
				console.log("opening chat with", aliasOrRoomToJoin);
				getOrCreatePrivateChatRoom(aliasOrRoomToJoin, userAlias, roomType);
		}
	}
}
