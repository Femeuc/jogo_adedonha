function create_room() {
    const inputs = document.querySelectorAll('#enter_room input');
    const username = inputs[0].value;
    const room = inputs[1].value;

    if( username.length < 1 || room.length < 1 ) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    socket.emit('CREATE_ROOM', username, room, (success) => {
        if( !success ) {
            alert('Já existe uma sala com esse nome');
        }
    });

    console.log(`User "${username}" creates room named "${room}"`);
}

function enter_room() {
    const inputs = document.querySelectorAll('#enter_room input');
    const username = inputs[0].value;
    const room = inputs[1].value;

    if( username.length < 1 || room.length < 1 ) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    socket.emit('ENTER_ROOM', username, room, (success) => {
        if( !success ) {
            alert('Sala não encontrada');
        }
    });

    console.log(`User "${username}" enters room named "${room}"`);
}

function server_state() {
    socket.emit("SERVER_STATE", (state) => {
        console.log(state);
    });
}