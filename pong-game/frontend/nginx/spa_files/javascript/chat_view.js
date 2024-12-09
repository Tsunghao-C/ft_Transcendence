// chat_view.js
import { ChatWebSocket } from './chat.js';

export function setChatView(contentContainer) {

    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (!isLoggedIn) {
        console.log("Not showing chat -user not ogged in");
        return;
    }


    const existingChat = document.getElementById('chat-container');
    if (existingChat) {
        existingChat.remove();
    }    
    // contentContainer.innerHTML = '';
    // Create chat interface

    // const chatInterface = document.createElement('div');
    // chatInterface.innerHTML = `
    //     <div id="chat-container">
    //         <h2>Chat Room</h2>
    //         <div id="chat-messages"></div>
    //         <form id="chat-form">
    //             <input type="text" id="alias-input" placeholder="Your name" value="Anonymous">
    //             <input type="text" id="message-input" placeholder="Type a message...">
    //             <button type="submit">Send</button>
    //         </form>
    //     </div>
    // `;

    // contentContainer.appendChild(chatInterface);

    const chatInstance = new ChatWebSocket('lobby');
    const chatInterface = chatInstance.createInterface();
    if (chatInterface) {
        contentContainer.innerHTML = chatInterface;
        chatInstance.connect();
    }

    // // Set up form submission
    // const form = document.getElementById('chat-form');
    // if (form)
    // {
    //     form.addEventListener('submit', (e) => {
    //         e.preventDefault();
    //         const messageInput = document.getElementById('message-input');
    //         const aliasInput = document.getElementById('alias-input');
            
    //         if (messageInput.value.trim()) {
    //             chatInstance.sendMessage(messageInput.value, aliasInput.value);
    //             messageInput.value = '';
    //         }
    //     });
    // }
}

// Cleanup function to be called when leaving chat view
export function cleanupChatView() {
    if (chatInstance) {
        chatInstance.disconnect();
        chatInstance = null;
    }

    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        chatContainer.remove();
    }
}