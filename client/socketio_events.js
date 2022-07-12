socket.on('JOIN_ROOM', (user_id, room) => {
    console.log(`${user_id} entered room ${room}`);
})