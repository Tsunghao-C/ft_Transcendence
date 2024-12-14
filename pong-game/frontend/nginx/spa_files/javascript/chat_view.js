import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from "./fetch_request.js";
import { getCookie } from "./fetch_request.js";
import { state } from "./app.js";
import { loadPage } from "./app.js";

export async function setChatView(contentContainer) {
	let userData;
	let userRoomData;
	try {
		const response = await fetchWithToken('/api/user/getuser/');
		userData = await response.json();
		const test = await fetchWithToken('/api/chat/rooms/user_chatrooms');
		userRoomData = await test.json();
		console.log("User userRoomData: ", userRoomData);
		const currentLanguage = getLanguageCookie() || "en";
	} catch (error) {
		console.log(error);
		window.location.hash = "login";
		loadPage("login");
		return;
	}

	contentContainer.innerHTML = `
		<div id="chat-container">
			<h1>Chat Rooms</h1>
			<input id="room-name-input" type="text" placeholder="Enter room name">
			<button id="join-room">Join Room</button>
			<div style="margin-top: 20px;">
				<input id="public-room-name-input" type="text" placeholder="Enter public room name">
				<button id="create-public-room">Create Public Room</button>
			</div>
			<div style="margin-top: 20px;">
				<input id="private-room-alias-input" type="text" placeholder="Enter alias for private message">
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

	// this is how we create chat room using the view


	const createPublicRoomButton = document.getElementById("create-public-room");
	createPublicRoomButton.addEventListener('click', async () => {
		const roomName = document.getElementById('public-room-name-input').value.trim();
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
					document.getElementById('public-room-name-input').value = "";
				} else {
					const errorData = await response.json();
					alert(`Failed to create room: ${errorData.error}`);
				}
			} catch (error) {
				console.error("Error creating public room:", error);
				alert("An error occurred while creating the room.");
			}
		} else {
			alert("Please enter a public room name.");
		}
	});

	// we joint he room like that
	const joinRoomButton = document.getElementById("join-room");
	joinRoomButton.addEventListener('click', () => {
		const roomName = document.getElementById('room-name-input').value.trim();
		if (roomName) {
			loadChatRoom(roomName, userData.alias);
			document.getElementById('room-name-input').value = "";
		} else {
			alert("Please enter a room name.");
		}
	});

	const privateMessageButton = document.getElementById("send-private-message");
	privateMessageButton.addEventListener("click", async () => {
		const alias = document.getElementById("private-room-alias-input").value.trim();
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
					alert(`Private chat room with "${alias}" is now active.`);
				} else {
					const errorData = await response.json();
					alert(`Failed to create private room: ${errorData.error}`);
				}
			} catch (error) {
				console.error("Error creating private room:", error);
				alert("An error occurred while creating the private room.");
			}
		} else {
			alert("Please enter a username for the private message.");
		}
	});

	// to send a message
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
}


async function loadChatRoom(roomName, userAlias, roomNameDisplay = roomName) {
	// we have to close the websocket if it exists otherwise messages are displayed twice
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

	// Get the JWT token
	const tokenResponse = await fetchWithToken('/api/user/getuser/');
	if (!tokenResponse.ok) {
		alert("Unable to authenticate. Please login again.");
		return;
	}
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
		addMessage(userAlias, messageData.alias, messageData.message, messageData.time);
	};

	document.getElementById("chat-view").style.display = "block";

	let apiUrl = `/api/chat/rooms/${roomName}/messages/`;
	try {
		const response = await fetchWithToken(apiUrl);
		if (response.ok) {
			const listMessageData = await response.json();
			messagesDiv.innerHTML = "";
			listMessageData.forEach(msg => {
				addMessage(userAlias, msg.sender, msg.content, msg.timestamp);
			});
		} else {
			messagesDiv.innerHTML = "<p>Error loading messages.</p>";
			console.error("Failed to fetch messages:", response.status);
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



