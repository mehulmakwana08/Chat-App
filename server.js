// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Initialize the Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// List to store connected users
let users = [];

io.on('connection', (socket) => {
    let userName = '';

    // When a user sets their name, add them to the list and notify all users
    socket.on('set username', (name) => {
        userName = name;
        users.push(userName);
        console.log(`${userName} has connected.`);
        io.emit('user list', { users, count: users.length }); // Send updated user list and count to all clients
        io.emit('chat message', `System: ${userName} has joined the chat.`);
    });

    // Listen for 'chat message' event and broadcast it with username prefix
    socket.on('chat message', (msg) => {
        if (userName) {
            io.emit('chat message', `${userName}: ${msg}`); // Prefix message with user's name
        }
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        if (userName) {
            console.log(`${userName} has disconnected.`);
            users = users.filter((user) => user !== userName); // Remove user from the list
            io.emit('user list', { users, count: users.length }); // Send updated user list and count to all clients
            io.emit('chat message', `System: ${userName} has left the chat.`);
        }
    });
});

// Set the server to listen on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
