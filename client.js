const socket = io('http://localhost:8000');

// Get Dom elements in a respective js variable
const form = document.getElementById('send-container');
const messageInp = document.getElementById('messageInp');
const messageContainer = document.querySelector('.container');

// function which will append event info to the container
const append = (message, position) => {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageElement.classList.add('message');
    messageElement.classList.add(position);
    messageContainer.append(messageElement);
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInp.value;
    append(`You: ${message}`, 'right');
    socket.emit('send', message);
    messageInp.value = '';
});

// ask new user for his/her name - with validation
let name;
do {
    name = prompt("Enter your name to join");
} while (!name || name.trim() === "");

socket.emit('new-user-joined', name.trim());

socket.on('user-joined', name => {
    append(`${name} joined the chat`, 'right');
});

socket.on('receive', data => {
    append(`${data.name}: ${data.message}`, 'left');
});

socket.on('left', name => {
    append(`${name} left the chat`, 'right');
});