// Node server which will handle socket IO connection
// yahan hamara node server kuch events ko handle karega

const io = require('socket.io')(8000, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

console.log('Server listening on port 8000');

const users = {};

io.on('connection', socket => {
    // User connected (socket ID not logged)
    
    //if any new user joined, let other users connected to the server know
    socket.on('new-user-joined', name => {
        console.log("New user", name);
        users[socket.id] = name;
        socket.broadcast.emit('user-joined', name);
    });
    
    //if someone sends a message, broadcast it to other people
    socket.on('send', message => {
        socket.broadcast.emit('receive', {message: message, name: users[socket.id]})
    });
    
    //if someone leaves the chat, let others know
    socket.on('disconnect', message => {
        if(users[socket.id]) {
            socket.broadcast.emit('left', users[socket.id]);
            delete users[socket.id];
        }
    });
});