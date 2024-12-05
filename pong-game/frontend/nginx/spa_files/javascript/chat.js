export class ChatWebSocket {
    constructor(roomName) {
        this.roomName = roomName;
        this.messageContainer = null;
        this.socket = null;
        this.isConnected = false;
    }

    // Initialize chat interface
    connect(messageContainerID ='chat=messages') {
        this.messageContainer = document.getElementById(messageContainerID) || this.createMessageContainer();

        const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${wsScheme}://${window.location.host}/ws/chat/${this.roomName}/`;
        this.socket = new WebSocket(wsUrl);

        // Set up event handlers
        this.socket.onopen = () => {
            console.log('WebSocket Connected');
            this.isConnected = true;
            this.addSystemMessage('Connected to chat room');
        };

        this.socket.onclose = (e) => {
            console.log('WebSocket Disconnected');
            this.isConnected = false;
            this.addSystemMessage('Disconnected from chat room');
            setTimeout(() => this.reconnect(), 2000);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
            this.addSystemMessage('Error in connection');
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.displayMessage(data);
        };
    }

    reconnect() {
        if (!this.isConnected) {
            console.log('Attempting to reconnect...');
            this.connect();
        }
    }

    sendMessage(message, alias = 'Aonymous') {
        if (!this.isConnected) {
            this.addSystemMessage('Not connected to chat room');
            return;
        }

        const messageData = {
            message: message,
            alias: alias,
            time: new Date().toLocaleTimeString()
        };

        this.socket.send(JSON.stringify(messageData));
    }

    displayMessage(data) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';

        const time = data.time || new Date().toLocaleTimeString();

        messageElement.innerHTML = `
            <span class="time">[${time}]</span>
            <span class="alias">${data.alias}:</span>
            <span class="message">${this.escapeHtml(data.message)}</span>
        `;
        this.messageContainer.appendChild(messageElement);
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }

        addSystemMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'system-message';
        messageElement.innerHTML = `
            <span class="time">[${new Date().toLocaleTimeString()}]</span>
            <span class="message">${this.escapeHtml(message)}</span>
        `;
        
        this.messageContainer.appendChild(messageElement);
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }

    // Create a default message container if none exists
    createMessageContainer() {
        const container = document.createElement('div');
        container.id = 'chat-messages';
        container.style.cssText = `
            height: 400px;
            overflow-y: auto;
            border: 1px solid #ccc;
            padding: 10px;
            margin-bottom: 10px;
        `;
        document.body.appendChild(container);
        return container;
    }

    // Escape HTML to prevent XSS
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Clean up on page unload
    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}

// Example HTML structure and CSS to support the chat
const chatStyles = `
    .chat-message {
        margin: 5px 0;
        padding: 5px;
        background-color: #f8f9fa;
        border-radius: 4px;
    }
    
    .system-message {
        margin: 5px 0;
        padding: 5px;
        color: #666;
        font-style: italic;
    }
    
    .time {
        color: #666;
        margin-right: 8px;
    }
    
    .alias {
        font-weight: bold;
        margin-right: 8px;
    }
    
    #chat-form {
        display: flex;
        gap: 10px;
        margin-top: 10px;
    }
    
    #chat-form input[type="text"] {
        flex-grow: 1;
        padding: 8px;
    }
    
    #chat-form button {
        padding: 8px 16px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    #chat-form button:hover {
        background-color: #0056b3;
    }
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.textContent = chatStyles;
document.head.appendChild(styleSheet);

// Example usage:
document.addEventListener('DOMContentLoaded', () => {
    // Create basic chat interface
    const chatInterface = `
        <div id="chat-container">
            <div id="chat-messages"></div>
            <form id="chat-form">
                <input type="text" id="alias-input" placeholder="Your name" value="Anonymous">
                <input type="text" id="message-input" placeholder="Type a message...">
                <button type="submit">Send</button>
            </form>
        </div>
    `;
    
    // Add chat interface to page
    const container = document.createElement('div');
    container.innerHTML = chatInterface;
    document.body.appendChild(container);
    
    // Initialize chat
    const chat = new ChatWebSocket('lobby');  // 'lobby' is the room name
    chat.connect();
    
    // Handle message submission
    document.getElementById('chat-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const messageInput = document.getElementById('message-input');
        const aliasInput = document.getElementById('alias-input');
        
        if (messageInput.value.trim()) {
            chat.sendMessage(messageInput.value, aliasInput.value);
            messageInput.value = '';
        }
    });
    
    // Clean up on page unload
    window.addEventListener('unload', () => {
        chat.disconnect();
    });
});