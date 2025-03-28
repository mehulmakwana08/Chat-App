document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const messageInput = document.getElementById('message');
    const messages = document.getElementById('messages');
    const sendButton = document.getElementById('send');
    const chatContainer = document.getElementById('chat-container');
    const namePrompt = document.getElementById('namePrompt');
    const nameInput = document.getElementById('nameInput');
    const nameSubmit = document.getElementById('nameSubmit');
    const userCount = document.getElementById('user-count');
    const userNames = document.getElementById('user-names');
    const fileInput = document.getElementById('fileInput');
    const emojiPicker = document.getElementById('emojiPicker');
    const privateMessageInput = document.getElementById('privateMessageInput');
    const privateMessageButton = document.getElementById('privateMessageButton');
    const typingIndicator = document.getElementById('typingIndicator');

    let userName = '';

    // Prompt for the user's name before joining the chat
    nameSubmit.addEventListener('click', () => {
        startChat();
    });

    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startChat();
        }
    });

    function startChat() {
        userName = nameInput.value.trim();
        if (userName !== '') {
            socket.emit('set username', userName);
            namePrompt.style.display = 'none';
            chatContainer.style.display = 'flex';
        } else {
            alert("Please enter a name");
        }
    }

    // Send message on Enter key press or send button click
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    sendButton.addEventListener('click', function() {
        sendMessage();
    });

    function sendMessage() {
        if (messageInput.value.trim() !== '') {
            socket.emit('chat message', messageInput.value);
            messageInput.value = '';
        }
    }

    // Receive and display new messages
    socket.on('chat message', (msg) => {
        const item = document.createElement('li');
        item.textContent = msg;
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight;
    });

    // Update the list of connected users and their count
    socket.on('user list', (data) => {
        userCount.textContent = data.count;
        userNames.innerHTML = '';
        data.users.forEach((user) => {
            const listItem = document.createElement('li');
            listItem.textContent = user;
            userNames.appendChild(listItem);
        });
    });

    // Handle file sharing
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = {
                    name: file.name,
                    data: e.target.result.split(',')[1]
                };
                socket.emit('file upload', fileData);
            };
            reader.readAsDataURL(file);
        }
    });

    socket.on('file upload', (file) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = file.url;
        link.textContent = file.name;
        link.target = '_blank';
        item.appendChild(link);
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight;
    });

    // Handle emoji support
    emojiPicker.addEventListener('change', (event) => {
        const emoji = event.target.value;
        if (emoji) {
            socket.emit('emoji message', emoji);
        }
    });

    socket.on('emoji message', (data) => {
        const item = document.createElement('li');
        item.textContent = `${data.user}: ${data.emoji}`;
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight;
    });

    // Handle private messaging
    privateMessageButton.addEventListener('click', () => {
        const recipient = privateMessageInput.value.trim();
        const message = messageInput.value.trim();
        if (recipient && message) {
            socket.emit('private message', { recipient, message });
            messageInput.value = '';
        }
    });

    socket.on('private message', (data) => {
        const item = document.createElement('li');
        item.textContent = `Private from ${data.sender}: ${data.message}`;
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight;
    });

    socket.on('private message error', (error) => {
        alert(error);
    });

    // Handle message reactions
    messages.addEventListener('click', (event) => {
        if (event.target.tagName === 'LI') {
            const messageId = event.target.dataset.id;
            const reaction = prompt('Enter your reaction:');
            if (reaction) {
                socket.emit('message reaction', { messageId, reaction });
            }
        }
    });

    socket.on('message reaction', (data) => {
        const item = document.querySelector(`li[data-id="${data.messageId}"]`);
        if (item) {
            const reaction = document.createElement('span');
            reaction.textContent = ` ${data.user}: ${data.reaction}`;
            item.appendChild(reaction);
        }
    });

    // Handle typing indicators
    messageInput.addEventListener('input', () => {
        socket.emit('typing', messageInput.value !== '');
    });

    socket.on('typing', (data) => {
        typingIndicator.textContent = data.isTyping ? `${data.user} is typing...` : '';
    });
});
