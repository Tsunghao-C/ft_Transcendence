import { translations } from "./language_pack.js";
import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from './fetch_request.js';
import { loadPage } from "./app.js";
import { setChatView } from "./chat_view.js";
import { getCookie } from "./fetch_request.js";
import { state } from "./app.js";


export async function sendDuelRequestFromGameRoom(roomName) {
	const token = getCookie("accessToken");
	const gameId = 'test_game';

	return new Promise((resolve, reject) => {
		try {
			const wsUrl = `wss://${window.location.host}/ws/game-server/${gameId}/?token=${encodeURIComponent(token)}`;
			console.log("Connecting to WebSocket:", wsUrl);
			
			const ws = new WebSocket(wsUrl);
			state.gameSocket = ws;

			// Gestionnaire d'erreur global
			ws.onerror = (error) => {
				console.error("WebSocket error:", error);
				ws.close();
				reject(error);
			};

			// Gestionnaire de messages
			ws.onmessage = async (event) => {
				try {
					const response = JSON.parse(event.data);
					console.log("Message received:", response);
					
					if (response.type === 'room_creation') {
						console.log('Room creation notice received');
						console.log('Room name: ' + response.room_name);
						
						try {
							const inviteResponse = await fetchWithToken(
								'/api/chat/create-invitation/',
								JSON.stringify({
									roomName: roomName,
									roomId: response.room_name,
								}),
								'POST'
							);

							if (!inviteResponse.ok) {
								console.error("Invitation creation failed:", await inviteResponse.text());
								reject(new Error("Failed to create invitation"));
							} else {
								resolve(response.room_name);
								window.location.hash = `lobby/${response.room_name}`;
							}
						} catch (error) {
							console.error("Error creating invitation:", error);
							reject(error);
							window.location.hash = "login";
						} finally {
							ws.close();
						}
					}
				} catch (error) {
					console.error("Error parsing WebSocket message:", error);
					ws.close();
					reject(error);
				}
			};

			// Attendre que la connexion soit établie avant d'envoyer le message
			ws.onopen = () => {
				console.log("WebSocket connected, sending room creation request");
				ws.send(JSON.stringify({
					action: 'create_private_match',
				}));
			};
			
		} catch (error) {
			console.error("Error setting up WebSocket:", error);
			reject(error);
		}
	});
	}


export async function sendMessage(friendAlias) {
	console.log(`Sending message to ${friendAlias}`);
	window.location.hash = `chat/private/${friendAlias}`;
}



export async function sendDuelRequestFromAlias(alias) {
	try {
		const response = await fetchWithToken(
			'/api/chat/create-private/',
			JSON.stringify({ alias: alias }),
			'POST'
		);
		if (response.ok) {
			const roomData = await response.json();
			sendDuelRequestFromGameRoom(roomData.name);
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

export function confirmRemoveFriend(friendAlias) {
	const currentLanguage = getLanguageCookie() ||  "en";
	const confirmation = confirm(
		`${translations[currentLanguage].validationRemovalFirst} ${friendAlias} ${translations[currentLanguage].validationRemovalSecond} ?`
	);
	if (confirmation) {
		removeFriend(friendAlias);
	}
}

export async function removeFriend(friendAlias) {
	console.log(`removing friend from ${friendAlias}`);
	let data;
	let response;
	try {
		const body = JSON.stringify({
			alias : friendAlias
			});
		response = await fetchWithToken('/api/user/delete-friend/', body, 'POST');
		data = await response.json();
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
	}
}

export async function acceptFriendRequest(friendUsername) {
	console.log(`Accepting friend request from ${friendUsername}`);
	let data;
	let response;
	try {
		const body = JSON.stringify({
			fromAlias: friendUsername,
			});
		response = await fetchWithToken('/api/user/accept-friend-request/', body, 'POST');
		data = await response.json();
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
	}
}

export async function rejectFriendRequest(notFriendUsername) {
	console.log(`Brutally Rejecting friend request from ${notFriendUsername}`);
	let data;
	let response;
	try {
		const body = JSON.stringify({
			fromAlias: notFriendUsername,
			});
		response = await fetchWithToken('/api/user/reject-friend-request/', body, 'POST');
		data = await response.json();
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
	}
}

export async function cancelFriendRequest(friendAlias) {
	console.log(`Canceling sent friend request to ${friendAlias}`);
	let data;
	let response;
	try {
		const body = JSON.stringify({
			toAlias: friendAlias
			});
		response = await fetchWithToken('/api/user/cancel-friend-request/', body, 'POST');
		data = await response.json();
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
	}
}

export async function unblockUser(blockedUser) {
	console.log(`unblocking friend from ${blockedUser}`);
	let data;
	let response;
	try {
		const body = JSON.stringify({
			alias: blockedUser,
			});
		response = await fetchWithToken('/api/user/unblock-user/', body, 'POST');
		data = await response.json();
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
	}
}

export async function blockUser(newBlockUsername) {
	const currentLanguage = getLanguageCookie() ||  "en";

	let data;
	let response;
	try {
		const body = JSON.stringify({ alias: newBlockUsername });
		response = await fetchWithToken('/api/user/block-user/', body, 'POST');
		data = await response.json();
		if (!response.ok) {
			if ( data.detail === 'this user is already blocked') {
				alert(`${newBlockUsername} ${translations[currentLanguage].alreadyBlock}.`);
			} else if (data.detail === 'No CustomUser matches the given query.' ) {
				alert(`${translations[currentLanguage].user} ${newBlockUsername} ${translations[currentLanguage].notFound}.`);
			} else if (data.detail === 'you cannot befriend yourself' ) {
				alert(`${translations[currentLanguage].okSasuke}`);
			}
		} else {
			alert(`${translations[currentLanguage].userblocked}`);
		}
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
	}
}

export async function addFriend(newfriend) {
	const currentLanguage = getLanguageCookie() ||  "en";

	let data;
	let response;
	try {
		const body = JSON.stringify({ toAlias: newfriend });
		response = await fetchWithToken('/api/user/send-friend-request/', body, 'POST');
		data = await response.json();
		if (!response.ok) {
			if (data.detail === 'Friend request was already sent.') {
				alert(`${translations[currentLanguage].alreadySent}.`);
			} else if (data.detail === 'you are already friends with this user' ) {
				alert(`${newfriend} ${translations[currentLanguage].alreadyFriend}.`);
			} else if (data.detail === 'No CustomUser matches the given query.' ) {
				alert(`${translations[currentLanguage].user} ${newfriend} ${translations[currentLanguage].notFound}.`);
			} else if (data.detail === 'you cannot befriend yourself' ) {
				alert(`${translations[currentLanguage].lonelyTest}`);
			} else if (data.detail === 'you are blocking this user' ) {
				alert(`${newfriend} ${translations[currentLanguage].blockedByUser}`);
			} else if (data.detail === 'this user is blocking you' ) {
				alert(`${translations[currentLanguage].blockingUser} ${newfriend}`);
			}
		} else {
			alert(`${translations[currentLanguage].friendRequestSent}`);
		}
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
	}
}
