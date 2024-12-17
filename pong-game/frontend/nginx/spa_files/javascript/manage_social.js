import { translations } from "./language_pack.js";
import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from './fetch_request.js';
import { loadPage } from "./app.js";
import { setChatView } from "./chat_view.js";

export async function sendMessage(friendAlias, contentContainer) {
	console.log(`Sending message to ${friendAlias}`);
	window.location.hash = `chat/private/${friendAlias}`;
}

export function sendDuelRequest(friendUsername) {
    console.log(`Requesting duel with ${friendUsername}`);
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
