import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from "./fetch_request.js";

let socket;

export async function setChatView(contentContainer) {
	let data;
	try {
		const response = await fetchWithToken('/api/user/getuser/');
		data = await response.json();
		console.log("User data: ", data);
		const currentLanguage = getLanguageCookie() || "en";
	} catch (error) {
		console.log(error);
	}

	contentContainer.innerHTML = `
		<div id="chat-container">
			<h1>Chat Rooms</h1>
			<input id="room-name-input" type="text" placeholder="Enter room name">
			<button id="join-room">Join Room</button>

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
	document.getElementById("send-message").addEventListener("click", sendMessage);
	const joinRoomButton = document.getElementById("join-room");
	joinRoomButton.addEventListener('click', () => {
		const roomName = document.getElementById('room-name-input').value.trim();
		if (roomName) {
			loadChatRoom(roomName);
		} else {
			alert("Please enter a room name.");
		}
	});
}

async function loadChatRoom(roomName) {
	const messagesDiv = document.getElementById("messages");
	const chatRoomTitle = document.getElementById("chat-room-title");
	chatRoomTitle.textContent = `Room: ${roomName}`;
	messagesDiv.innerHTML = "<p>Loading messages...</p>";

	const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
	const wsUrl = `${wsScheme}://${window.location.host}/ws/chat-server/${roomName}/`;
	console.log("Connecting to WebSocket:", wsUrl);

	socket = new WebSocket(wsUrl);
	socket.onopen = function () {
		console.log("WebSocket connected.");
	};
	socket.onerror = function (error) {
		console.error("WebSocket error:", error);
	};

	socket.onmessage = function (e) {
		const data = JSON.parse(e.data);
		addMessage(data.alias, data.message, data.time);
	};

	document.getElementById("chat-view").style.display = "block";

	let apiUrl = `/api/chat/rooms/${roomName}/messages/`;
	try {
		const response = await fetchWithToken(apiUrl);
		if (response.ok) {
			const data = await response.json();
			messagesDiv.innerHTML = "";
			data.forEach(msg => {
				addMessage(msg.sender, msg.content, msg.timestamp);
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

function addMessage(alias, message, time) {
	const messagesDiv = document.getElementById("messages");
	const messageElement = document.createElement("div");
	messageElement.innerHTML = `<strong>${alias}</strong> <em>(${time})</em>: ${message}`;
	messagesDiv.appendChild(messageElement);
	messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
	const input = document.getElementById("message-input");
	if (input.value && socket) {
		const messageData = {
			message: input.value,
			alias: "User",
			time: new Date().toLocaleTimeString(),
		};
		socket.send(JSON.stringify(messageData));
		input.value = "";
	} else {
		alert("Message input is empty or WebSocket is not connected.");
	}
}
