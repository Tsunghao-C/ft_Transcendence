import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from "./fetch_request.js";
import { getCookie } from "./fetch_request.js";
import { state } from "./app.js";
import { loadPage } from "./app.js";
import { clearInput, hideElem, showElem } from "./utils.js";

export async function setChatView(contentContainer, roomType = "", aliasOrRoomToJoin = "") {
	let userRoomData;
	let roomData;
	let userAlias;
	try {
		const response = await fetchWithToken('/api/chat/user_chatrooms');
		console.log(response);
		userRoomData = await response.json();
		roomData = userRoomData.rooms;
		userAlias = userRoomData.userAlias;
		console.log("User userRoomData: ", userRoomData);
	} catch (error) {
		console.log(error);
		window.location.hash = "login";
		return;
	}

	// contentContainer.innerHTML = `
	// 	<div class="chat-view">
	// 		<h2 data-i18n="leaderboard">Chat</h2>
	// 		<div id="room-list" style="margin-bottom: 20px;"></div>
	// 		<div style="margin-bottom: 20px;">
	// 			<button id="join-room">Join Room</button>
	// 			<button id="create-public-room">Create Public Room</button>
	// 			<button id="send-private-message">Send Private Message</button>
	// 		</div>
	// 		<div id="chat-content" style="display:none;">
	// 			<h3 id="chat-room-title"></h3>
	// 			<div id="messages" style="height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;"></div>
	// 			<div>
	// 				<input id="message-input" type="text" placeholder="Type your message">
	// 				<button id="send-message">Send</button>
	// 				<button id="send-invite">Send Invite</button>
	// 			</div>
	// 		</div>
	// 	</div>
	// `;

	contentContainer.innerHTML = `
		<div class="chat-view">
			<ul class="nav nav-tabs" id="chatBlockTabs" role="tablist">
				<li class="nav-item">
					<a class="nav-link" id="private-message-tab" data-bs-toggle="tab" href="#private-message" role="tab" aria-controls="private-message" aria-selected="true">Private messages</a>
				</li>
				<li class="nav-item">
					<a class="nav-link active" id="chat-rooms-tab" data-bs-toggle="tab" href="#chat-rooms" role="tab" aria-controls="chat-rooms" aria-selected="false">Chat Rooms</a>
				</li>
			</ul>
			<div class="tab-content">
				<div class="tab-pane fade" id="private-message" role="tabpanel" aria-labelledby="private-message-tab">
					<div id="chat-views-searchbar">
						<input type="text" id="recipientUser" placeholder="Find a user to chat with">
						<button id="start-private-chat">Start private chat</button>
					</div>
					<div id="pm-list" style="margin-bottom: 20px;"></div>
					<div id="chat-content" style="display:none;">
						<div id="chat-content-top">
							<h4 id="chat-room-title"></h4>
							<button id="go-back">↵ Go Back</button>
						</div>
						<div id="messages" style="height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;"></div>
						<div id="chat-content-bottom">
							<input id="message-input" type="text" placeholder="Type your message">
							<button id="send-message">Send</button>
							<button id="send-invite">Play</button>
						</div>
					</div>
				</div>
				<div class="tab-pane fade show active" id="chat-rooms" role="tabpanel" aria-labelledby="chat-rooms-tab">
					<div id="chat-views-searchbar">
						<input type="text" id="recipientUser" placeholder="Enter room name">
						<button id="create-public-room">Create Public Room</button>
					</div>
					<div id="room-list" style="margin-bottom: 20px;"></div>
				</div>
			</div>
		</div>
		`

				// <div class="tab-pane fade" id="join-room" role="tabpanel" aria-labelledby="join-room-tab">
				// 	<ul id="friendRequestList" class="list-group"></ul>
				// 	<div id="room-list" style="margin-bottom: 20px;"></div>
				// </div>
				// <div class="tab-pane fade" id="create-room" role="tabpanel" aria-labelledby="create-room-tab">
				// 	<button id="create-public-room">Create Public Room</button>
				// </div>

const pmList = document.getElementById("pm-list");
	const roomList = document.getElementById("room-list");

	pmList.innerHTML = roomData // a changer, mettre uniquement room privees
		.map(room => {
			const roomType = room.is_private ? "private" : "public";
			const aliasOrRoomName = room.is_private 
				? room.other_member || "Unknown" 
				: room.name;

			const roomDisplayName = room.is_private
				? `Private messages with ${aliasOrRoomName}`
				: room.name;

			return `<div class="room-item" 
						data-room-type="${roomType}" 
						data-alias-or-room-name="${aliasOrRoomName}" 
						style="cursor: pointer; margin: 5px 0; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
							<p>${roomDisplayName}</p>
					</div>`;
		})
		.join("");
		
	roomList.innerHTML = roomData // a changer, mettre uniquement room publiques
		.map(room => {
			const roomType = room.is_private ? "private" : "public";
			const aliasOrRoomName = room.is_private 
				? room.other_member || "Unknown" 
				: room.name;

			const roomDisplayName = room.is_private
				? `Private messages with ${aliasOrRoomName}`
				: room.name;

			return `<div class="room-item" 
						data-room-type="${roomType}" 
						data-alias-or-room-name="${aliasOrRoomName}" 
						style="cursor: pointer; margin: 5px 0; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
							<p>${roomDisplayName}</p>
					</div>`;
		})
		.join("");

	document.querySelectorAll(".room-item").forEach(item => {
		item.addEventListener("click", (event) => {
			const roomType = event.currentTarget.getAttribute("data-room-type");
			const aliasOrRoomName = event.currentTarget.getAttribute("data-alias-or-room-name");
			window.location.hash = `chat/${roomType}/${aliasOrRoomName}`;
			getOrCreatePrivateChatRoom(aliasOrRoomName);
			// setChatView("") // should we do it otherwise ?
		});
	});

	document.getElementById("go-back").addEventListener('click', async () => {
		hideElem("chat-content");
		clearInput("recipientUser");
		showElem("chat-views-searchbar", "flex");
		showElem("pm-list", "block");
	});

	document.getElementById("join-room").addEventListener('click', async () => {
		const roomName = prompt("Enter the room name to join:");
		window.location.hash = `chat/public/${roomName}`;
	});

	document.getElementById("create-public-room").addEventListener('click', async () => {
		const roomName = prompt("Enter the name for the public room:");
		if (roomName) {
			try {
				const response = await fetchWithToken(
					'/api/chat/create/',
					JSON.stringify({ name: roomName, is_private: false }),
					'POST'
				);
				if (response.ok) {
					const roomData = await response.json();
					alert(`Public room "${roomData.room.name}" created successfully!`);
					window.location.hash = `chat/public/${roomData.room.name}`;
				} else {
					const errorData = await response.json();
					alert(`Failed to create room: ${errorData.error}`);
				}
			} catch (error) {
				console.error("Error creating public room:", error);
				alert("An error occurred while creating the room.");
			}
		}
	});

	document.getElementById("start-private-chat").addEventListener("click", async () => {
		const recipientUser = document.getElementById("recipientUser").value;
		try {
			if (recipientUser) {
				console.log("Opening chat with", recipientUser);
				getOrCreatePrivateChatRoom(recipientUser);
			}
		} catch(error) {
			console.log(error);
			Window.location.hash = "login";
		}
	})

	document.getElementById("send-private-message").addEventListener("click", async () => {
		const alias = prompt("Enter the alias for the private message:");
		if (alias) {
			console.log("opening chat with", alias);
			getOrCreatePrivateChatRoom(alias)
		}
	});

	async function getOrCreatePrivateChatRoom(alias) {
		try {
			const response = await fetchWithToken(
				'/api/chat/create-private/',
				JSON.stringify({ alias: alias }),
				'POST'
			);
			if (response.ok) {
				const roomData = await response.json();
				loadChatRoom(roomData.name, userAlias, `${alias}`);
			} else {
				const errorData = await response.json();
				if (errorData.detail === "You are blocking this user") {
					alert(`You are blocking this user`);
				} else if (errorData.detail === "This user is blocking you") {
					alert(`this user is blocking you`);
				} else if (errorData.detail === "You cannot create a private room with yourself.") {
					alert("You cannot create a private room with yourself.");
				} else if (errorData.error === "User not found.") {
					alert(`User not found`);
				} else {
					alert(`Failed to create private room for some mysterious reasons`);
				}
			}
		} catch (error) {
			console.log(error);
			window.location.hash = "login";
			return;
		}
	}

	document.getElementById("send-invite").addEventListener("click", sendInvite);

	async function sendInvite() {
			try {
				const response = await fetchWithToken('/api/chat/create-invitation/', JSON.stringify({
					roomName: aliasOrRoomToJoin,
					roomId: "c9d2b188-a876-4349-a410-3bec27510ee6",
				}), 'POST');
				if (!response.ok) {
					console.log(response);
					alert("please get me out");
				} else {
					alert("thank god");
				}
			} catch(error) {
				console.log(error);
				alert("send help");
				window.location.hash = "login";
			}
	}

	if (roomType === "public") {
		loadChatRoom(aliasOrRoomToJoin, userAlias);
	} else if (roomType === "private"){
		if (aliasOrRoomToJoin !== "") {
			console.log("opening chat with", aliasOrRoomToJoin);
			getOrCreatePrivateChatRoom(aliasOrRoomToJoin);
		}
	}
}

async function loadChatRoom(roomName, userAlias, roomNameDisplay = roomName) {
	if (state.chatSocket) {
		console.log("Closing existing WebSocket connection.");
		state.chatSocket.close();
		state.chatSocket = null;
	}
	console.log("we are here motherfukcer");
	const messagesDiv = document.getElementById("messages");
	const chatRoomTitle = document.getElementById("chat-room-title");

	chatRoomTitle.textContent = `${roomNameDisplay}`;
	messagesDiv.innerHTML = "<p>Loading messages...</p>";

	const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';

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
		addMessage(userAlias, messageData.alias, messageData.message, messageData.time, messageData.is_invite, messageData.game_room);
	};

	document.getElementById("chat-content").style.display = "block";

	try {
		const response = await fetchWithToken(`/api/chat/${roomName}/messages/`);
		if (response.ok) {
			hideElem("chat-views-searchbar");
			hideElem("pm-list");
			const listMessageData = await response.json();
			messagesDiv.innerHTML = "";
			listMessageData.forEach(msg => {
				addMessage(userAlias, msg.sender, msg.content, msg.timestamp, msg.is_invite, msg.game_room);
			});
		} else {
			messagesDiv.innerHTML = "<p>Error loading messages.</p>";
		}
	} catch (error) {
		console.error("Error fetching messages:", error);
		messagesDiv.innerHTML = "<p>Error loading messages.</p>";
	}

	document.getElementById("send-message").addEventListener("click", async () => {
		console.log("in SendMessage");
		const input = document.getElementById("message-input");
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

	document.getElementById("message-input").addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault(); // Empêche l'action par défaut du formulaire (si applicable)
			document.getElementById("send-message").click(); // Simule un clic sur le bouton
		}
	});

}

function addMessage(userAlias, alias, message, time, isInvite = false, gameRoom = null) {
	const messagesDiv = document.getElementById("messages");
	const messageElement = document.createElement("div");

	if (alias === userAlias) {
		messageElement.style.textAlign = "right";
		messageElement.innerHTML = `
			<div style="display: inline-block; text-align: left; background-color: #e1f5fe; padding: 10px; border-radius: 10px; max-width: 70%;">
				<em>${time}</em><br>
				${isInvite && gameRoom ? `<a href="#lobby/${gameRoom}" style="text-decoration: none; color: #007bff;">${message}</a>` : message}
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

	messagesDiv.appendChild(messageElement);
	messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

