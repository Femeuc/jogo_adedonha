socket.on('JOIN_ROOM', (room_obj, username) => {
    console.log(`${username} entered room ${room_obj.name}`);
    load_room(room_obj);
})

socket.on('LEFT_ROOM', (room_obj, username) => {
    console.log(`${username} has left ${room_obj.name}`);
    update_room(room_obj.users);
});