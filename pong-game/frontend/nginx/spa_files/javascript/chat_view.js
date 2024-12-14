import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from "./fetch_request.js";
import { getCookie } from "./fetch_request.js";
import { state } from "./app.js";
import { loadPage } from "./app.js";

export async function setChatView(contentContainer, roomToJoin = "") {
	let userData;
	let userRoomData;
	try {
		const response = await fetchWithToken('/api/user/getuser/');
		userData = await response.json();
		const userRoom = await fetchWithToken('/api/chat/rooms/user_chatrooms');
		userRoomData = await userRoom.json();
		console.log("User userRoomData: ", userRoomData);
	} catch (error) {
		console.log(error);
		window.location.hash = "login";
		loadPage("login");
		return;
	}

	contentContainer.innerHTML = `
		<div id="chat-container">
			<h1>Chat Rooms</h1>
			<div id="room-list" style="margin-bottom: 20px;"></div>
			<div style="margin-bottom: 20px;">
				<button id="join-room">Join Room</button>
				<button id="create-public-room">Create Public Room</button>
				<button id="send-private-message">Send Private Message</button>
			</div>
			<div id="chat-view" style="display:none;">
				<h3 id="chat-room-title"></h3>
				<div id="messages" style="height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;"></div>
				<div>
					<input id="message-input" type="text" placeholder="Type your message">
					<button id="send-message">Send</button>
				</div>
			</div>
		</div>
	`;

	const roomList = document.getElementById("room-list");
	roomList.innerHTML = userRoomData
		.map(room => {
			const roomDisplayName = room.is_private
				? `Private message with ${room.other_member || 'Unknown'}`
				: room.name;
			return `<div class="room-item" data-room="${room.name}" style="cursor: pointer; margin: 5px 0; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
				${roomDisplayName}
			</div>`;
		})
		.join("");

	document.querySelectorAll(".room-item").forEach(item => {
		item.addEventListener("click", (event) => {
			const roomName = event.currentTarget.getAttribute("data-room");
			loadChatRoom(roomName, userData.alias);
		});
	});

	document.getElementById("join-room").addEventListener('click', async () => {
		const roomName = prompt("Enter the room name to join:");
		if (roomName) {
			loadChatRoom(roomName, userData.alias);
		}
	});

	document.getElementById("create-public-room").addEventListener('click', async () => {
		const roomName = prompt("Enter the name for the public room:");
		if (roomName) {
			try {
				const response = await fetchWithToken(
					'/api/chat/rooms/create/',
					JSON.stringify({ name: roomName, is_private: false }),
					'POST'
				);
				if (response.ok) {
					const roomData = await response.json();
					alert(`Public room "${roomData.room.name}" created successfully!`);
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

	document.getElementById("send-private-message").addEventListener("click", async () => {
		const alias = prompt("Enter the alias for the private message:");
		if (alias) {
			try {
				const response = await fetchWithToken(
					'/api/chat/rooms/create-private/',
					JSON.stringify({ alias: alias }),
					'POST'
				);
				if (response.ok) {
					const roomData = await response.json();
					loadChatRoom(roomData.name, userData.alias, `Private message with ${alias}`);
				} else {
					const errorData = await response.json();
					alert(`Failed to create private room: ${errorData.error}`);
				}
			} catch (error) {
				console.error("Error creating private room:", error);
				alert("An error occurred while creating the private room.");
			}
		}
	});

	document.getElementById("send-message").addEventListener("click", sendMessage);

	function sendMessage() {
		const input = document.getElementById("message-input");
		if (input.value && state.chatSocket) {
			const messageData = {
				message: input.value,
				alias: userData.alias,
				time: new Date().toLocaleTimeString(),
			};
			state.chatSocket.send(JSON.stringify(messageData));
			input.value = "";
		} else {
			alert("Message input is empty or WebSocket is not connected.");
		}
	}

	if (roomToJoin !== "") {
		loadChatRoom(roomToJoin, userData.alias);
	}
}

async function loadChatRoom(roomName, userAlias, roomNameDisplay = roomName) {
	if (state.chatSocket) {
		console.log("Closing existing WebSocket connection.");
		state.chatSocket.close();
		state.chatSocket = null;
	}

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
		addMessage(userAlias, messageData.alias, messageData.message, messageData.time);
	};

	document.getElementById("chat-view").style.display = "block";

	try {
		const response = await fetchWithToken(`/api/chat/rooms/${roomName}/messages/`);
		if (response.ok) {
			const listMessageData = await response.json();
			messagesDiv.innerHTML = "";
			listMessageData.forEach(msg => {
				addMessage(userAlias, msg.sender, msg.content, msg.timestamp);
			});
		} else {
			messagesDiv.innerHTML = "<p>Error loading messages.</p>";
		}
	} catch (error) {
		console.error("Error fetching messages:", error);
		messagesDiv.innerHTML = "<p>Error loading messages.</p>";
	}
}

function addMessage(userAlias, alias, message, time) {
	const messagesDiv = document.getElementById("messages");
	const messageElement = document.createElement("div");

	if (alias === userAlias) {
		messageElement.style.textAlign = "right";
		messageElement.innerHTML = `
			<div style="display: inline-block; text-align: left; background-color: #e1f5fe; padding: 10px; border-radius: 10px; max-width: 70%;">
				<em>${time}</em><br>${message}
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
				${message}
			</div>`;
	}

	messagesDiv.appendChild(messageElement);
	messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
