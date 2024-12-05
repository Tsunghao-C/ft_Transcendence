// chat_view.js
import { ChatWebSocket } from './chat.js';

let chatInstance = null;

export function setChatView(contentContainer) {
    // Create chat interface HTML
    contentContainer.innerHTML = `
        <div id="chat-container">
            <h2>Chat Room</h2>
            <div id="chat-messages"></div>
            <form id="chat-form">
                <input type="text" id="alias-input" placeholder="Your name" value="Anonymous">
                <input type="text" id="message-input" placeholder="Type a message...">
                <button type="submit">Send</button>
            </form>
        </div>
    `;

    // Initialize chat if not already initialized
    if (!chatInstance) {
        chatInstance = new ChatWebSocket('lobby');
        chatInstance.connect();
    }

    // Set up form submission
    document.getElementById('chat-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const messageInput = document.getElementById('message-input');
        const aliasInput = document.getElementById('alias-input');
        
        if (messageInput.value.trim()) {
            chatInstance.sendMessage(messageInput.value, aliasInput.value);
            messageInput.value = '';
        }
    });
}

// Cleanup function to be called when leaving chat view
export function cleanupChatView() {
    if (chatInstance) {
        chatInstance.disconnect();
        chatInstance = null;
    }
}