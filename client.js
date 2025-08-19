const socket = io('http://localhost:8000');

// Get DOM elements
const form = document.getElementById('send-container');
const messageInput = document.getElementById('messageInp');
const messageContainer = document.querySelector('.container');

// Ask user for their name when they join
let name;
do {
    name = prompt("Enter your name to join");
} while (!name || name.trim() === "");

socket.emit('new-user-joined', name);

// Handle form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    if(message.trim() !== '') {
        // Immediately show your own message
        append(`You: ${message}`, 'right', 'temp-' + Date.now());
        socket.emit('send', message);
        messageInput.value = '';
    }
});

// Function to append messages to the container
const append = (message, position, messageId = null) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', position);
    
    // Create message content div
    const messageContent = document.createElement('div');
    messageContent.textContent = message;
    messageElement.appendChild(messageContent);
    
    // Set message ID for ALL messages (both sent and received)
    if(messageId) {
        messageElement.setAttribute('data-message-id', messageId);
    }
    
    // Add delete button only for your own messages (right side) that have messageId and not temp
    if(messageId && position === 'right' && !messageId.toString().startsWith('temp-')) {
        const deleteBtn = document.createElement('span');
        deleteBtn.innerHTML = '×';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.onclick = () => {
            if(confirm('Delete this message?')) {
                socket.emit('delete-message', messageId);
            }
        };
        messageElement.appendChild(deleteBtn);
    }
    
    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
};

// Listen for incoming messages
socket.on('receive', (data) => {
    append(`${data.name}: ${data.message}`, 'left', data.id);
});

// Listen for user joined
socket.on('user-joined', (name) => {
    append(`${name} joined the chat`, 'right');
});

// Listen for user left
socket.on('left', (name) => {
    append(`${name} left the chat`, 'right');
});

// Listen for your own message sent back with ID - replace temp message with real one
socket.on('message-sent', (data) => {
    // Find and remove any temp message elements
    const tempMessages = document.querySelectorAll('[data-message-id^="temp-"]');
    tempMessages.forEach(temp => temp.remove());
    
    // Add the real message with proper ID for delete functionality
    append(`You: ${data.message}`, 'right', data.id);
});

// Listen for message deleted
socket.on('message-deleted', (data) => {
    const messageElements = document.querySelectorAll(`[data-message-id="${data.id}"]`);
    messageElements.forEach(element => {
        if(element) {
            element.remove();
        }
    });
});

// Clear all messages function
function clearAllMessages() {
    if(confirm('Clear all messages for everyone?')) {
        console.log("Sending clear-all request");
        socket.emit('clear-all');
    }
}