socket.on('JOIN_ROOM', (room_obj, username) => {
    console.log(`${username} entered room ${room_obj.name}`);
    load_room(room_obj);
})

socket.on('RECONNECT', (room_obj) => {
    update_room(room_obj);
    hide_reconnection_UI();
    document.body.style.pointerEvents = 'auto';
    console.log('RECONNECTED');
});

socket.on('LEFT_ROOM', (room_obj, username) => {
    console.log(`${username} has left ${room_obj.name}`);
    update_room(room_obj);
});

socket.on('CHECKBOX_CHANGE', checkboxes => {
    console.log(`CHECKBOX_CHANGE`);
    console.log(checkboxes);
    update_checkboxes(checkboxes);
})