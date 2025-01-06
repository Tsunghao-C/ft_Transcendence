import { translations as trsl } from "./language_pack.js";
import { fetchWithToken } from "./fetch_request.js";
import { getCookie } from "./fetch_request.js";
import { state } from "./app.js";
import { isAlphanumeric } from "./utils.js";


export async function sendDuelRequestFromGameRoom(roomName) {
	const token = getCookie("accessToken");
	const gameId = 'test_game';

	return new Promise((resolve, reject) => {
		try {
			const wsUrl = `wss://${window.location.host}/ws/game-server/${gameId}/?token=${encodeURIComponent(token)}`;
			console.log("Connecting to WebSocket:", wsUrl);

			const ws = new WebSocket(wsUrl);
			state.gameSocket = ws;

			ws.onerror = (error) => {
				console.error("WebSocket error:", error);
				ws.close();
				reject(error);
			};

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
			if (errorData.detail === "You are blocking this user.") {
				alert(`${trsl[state.language].blockingUser}`);
			} else if (errorData.detail === "This user is blocking you.") {
				alert(`${alias} ${trsl[state.language].blockedByUser}`);
			} else if (errorData.detail === "You cannot create a private room with yourself.") {
				alert(`${trsl[state.language].lonelyTest}`);
			} else if (errorData.error === "User not found.") {
				alert(`${trsl[state.language].user} ${alias} ${trsl[state.language].notFound}.`);
			} else {
				alert(`No invite letters available at the time, please try again later`);
			}
		}
	} catch (error) {
		console.log(error);
		window.location.hash = "login";
		return;
	}
}

export function confirmRemoveFriend(friendAlias) {
	const confirmation = confirm(
		`${trsl[state.language].validationRemovalFirst} ${friendAlias} ${trsl[state.language].validationRemovalSecond} ?`
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
		response = await fetchWithToken('/api/user/delete-friend/', body, 'DELETE');
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
		response = await fetchWithToken('/api/user/reject-friend-request/', body, 'DELETE');
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
		response = await fetchWithToken('/api/user/cancel-friend-request/', body, 'DELETE');
		data = await response.json();
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
	}
}

export async function banUser(id) {
	console.log(`banning user ${id}`);
	let data;
	let response;
	try {
		const body = JSON.stringify({
			id: id
		});
		response = await fetchWithToken('/api/user/banplayer/', body, 'POST');
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
	}
}

export async function unbanUser(id) {
	console.log(`unbanning user ${id}`);
	let data;
	let response;
	try {
		const body = JSON.stringify({
			id: id
		});
		response = await fetchWithToken('/api/user/unbanplayer/', body, 'POST');
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
	if (!isAlphanumeric(newBlockUsername)) {
		return ;
	}
	let data;
	let response;
	try {
		const body = JSON.stringify({ alias: newBlockUsername });
		response = await fetchWithToken('/api/user/block-user/', body, 'POST');
		data = await response.json();
		if (!response.ok) {
			if ( data.detail === 'this user is already blocked') {
				alert(`${newBlockUsername} ${trsl[state.language].alreadyBlock}.`);
			} else if (data.detail === 'No CustomUser matches the given query.' ) {
				alert(`${trsl[state.language].user} ${newBlockUsername} ${trsl[state.language].notFound}.`);
			} else if (data.detail === 'you cannot block yourself' ) {
				alert(`${trsl[state.language].okSasuke}`);
			}
		} else {
			alert(`${trsl[state.language].user} ${newBlockUsername} ${trsl[state.language].userblocked}`);
		}
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
	}
}

export async function addFriend(newfriend) {
	if (!isAlphanumeric(newfriend)) {
		return ;
	}
	let data;
	let response;
	try {
		const body = JSON.stringify({ toAlias: newfriend });
		response = await fetchWithToken('/api/user/send-friend-request/', body, 'POST');
		data = await response.json();
		if (!response.ok) {
			if (data.detail === 'Friend request was already sent.') {
				alert(`${trsl[state.language].alreadySent}.`);
			} else if (data.detail === 'you are already friends with this user' ) {
				alert(`${newfriend} ${trsl[state.language].alreadyFriend}.`);
			} else if (data.detail === 'No CustomUser matches the given query.' ) {
				alert(`${trsl[state.language].user} ${newfriend} ${trsl[state.language].notFound}.`);
			} else if (data.detail === 'you cannot befriend yourself' ) {
				alert(`${trsl[state.language].lonelyTest}`);
			} else if (data.detail === 'you are blocking this user' ) {
				alert(`${newfriend} ${trsl[state.language].blockedByUser}`);
			} else if (data.detail === 'this user is blocking you' ) {
				alert(`${trsl[state.language].blockingUser}`);
			}
		} else {
			alert(`${trsl[state.language].friendRequestSent}`);
		}
	} catch(error) {
		console.log(error);
		window.location.hash = "login";
	}
}
