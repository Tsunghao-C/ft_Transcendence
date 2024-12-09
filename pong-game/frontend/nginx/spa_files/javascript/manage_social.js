import { translations } from "./language_pack.js";
import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from './fetch_request.js';

export function sendMessage(friendUsername) {
    console.log(`Sending message to ${friendUsername}`);
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
        try {
            const body = JSON.stringify({
                alias : friendAlias
              });
            data = await fetchWithToken('/api/user/delete-friend/', body, 'POST');
        } catch (error) {
            console.log(error);
            return;
        }
    // renderFriends();
}

export async function acceptFriendRequest(friendUsername) {
    console.log(`Accepting friend request from ${friendUsername}`);
    let data;
        try {
            const body = JSON.stringify({
                fromAlias: friendUsername,
              });
            data = await fetchWithToken('/api/user/accept-friend-request/', body, 'POST');
        } catch (error) {
            console.log(error);
            return;
        }
    // renderFriends();
    // renderFriendRequests();
}

export async function rejectFriendRequest(notFriendUsername) {
    console.log(`Brutally Rejecting friend request from ${notFriendUsername}`);
    let data;
        try {
            const body = JSON.stringify({
                fromAlias: notFriendUsername,
              });
            data = await fetchWithToken('/api/user/reject-friend-request/', body, 'POST');
        } catch (error) {
            console.log(error);
            return;
        }
    // renderFriendRequests();
}

export async function cancelFriendRequest(friendAlias) {
    console.log(`Canceling sent friend request to ${friendAlias}`);
    let data;
        try {
            const body = JSON.stringify({
                toAlias: friendAlias
              });
            data = await fetchWithToken('/api/user/cancel-friend-request/', body, 'POST');
        } catch (error) {
            console.log(error);
            return;
        }
    // renderSentRequests();
}

export async function unblockUser(blockedUser) {
    console.log(`unblocking friend from ${blockedUser}`);
    let data;
        try {
            const body = JSON.stringify({
                alias: blockedUser,
                });
            data = await fetchWithToken('/api/user/unblock-user/', body, 'POST');
        } catch (error) {
            console.log(error);
            return;
        }
    // renderBlockList();
}

export async function blockUser(newBlockUsername) {
    const currentLanguage = getLanguageCookie() ||  "en";

    let data;
    console.log("going here");
    try {
        const body = JSON.stringify({ alias: newBlockUsername });
        data = await fetchWithToken('/api/user/block-user/', body, 'POST');
    } catch (error) {
        console.log(error);
        return;
    }
    if (data.detail === 'this user is already blocked') {
        alert(`${newBlockUsername} ${translations[currentLanguage].alreadyBlock}.`);
    } else if (data.detail === 'No CustomUser matches the given query.' ) {
        alert(`${translations[currentLanguage].user} ${newBlockUsername} ${translations[currentLanguage].notFound}.`);
    } else if (data.detail === 'you cannot befriend yourself' ) {
        alert(`${translations[currentLanguage].okSasuke}`);
    }
}

export async function addFriend(newfriend) {
    const currentLanguage = getLanguageCookie() ||  "en";

    let data;
    try {
        const body = JSON.stringify({ toAlias: newfriend });
        data = await fetchWithToken('/api/user/send-friend-request/', body, 'POST');
        // console.log("User data: ", data);
    } catch (error) {
        console.log(error);
        return;
    }
    if (data.detail === 'Friend request was already sent.') {
        alert(`${newfriend} ${translations[currentLanguage].alreadyFriend}.`);
    } else if (data.detail === 'No CustomUser matches the given query.' ) {
        alert(`${translations[currentLanguage].user} ${newfriend} ${translations[currentLanguage].notFound}.`);
    } else if (data.detail === 'you cannot befriend yourself' ) {
        alert(`${translations[currentLanguage].lonelyTest}`);
    } else if (data.detail === 'you are blocking this user' ) {
        alert(`${newfriend} ${translations[currentLanguage].blockedByUser}`);
    } else if (data.detail === 'this user is blocking you' ) {
        alert(`${translations[currentLanguage].blockingUser} ${newfriend}`);
    } else {
        alert(`${translations[currentLanguage].friendRequestSent}`);
    }
}