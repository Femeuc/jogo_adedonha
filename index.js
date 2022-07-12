// IMPORTS
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');
const cors = require('cors');
require('dotenv').config()

// GLOBAL VARIABLES
users = [];
// {
//   name: 'name',
//   id: 'id'
// }

// cors config
app.use(cors({
    origin: '*'
}));

app.use(express.static(path.join(__dirname, 'client')))
app.get('/', (req, res) => {
    res.render('index.html');
});

server.listen( process.env.PORT , "0.0.0.0" || "localhost", () => {
    console.log('listening on port ' + process.env.PORT);
});  


io.on('connection', (socket) => {
    console.log(`${socket.id} connected`);

    socket.on('SERVER_STATE', callback => {
        callback( get_server_state() );
    });

    socket.on('CREATE_ROOM', (username, room, callback) => {
        if( username.length < 1 || room.length < 1 ) {
            console.log('User tried empty username and empty room');
            return;
        }
        if( does_room_exist(room) ) {
            callback( false );
            return;
        }

        socket.join(room);
        console.log(`User "${username}" creates room named "${room}"`);

        users.push({
            name: username,
            id: socket.id
        });
        //begin_room();
    });

    socket.on('ENTER_ROOM', (username, room, callback) => {
        if( username.length < 1 || room.length < 1 ) {
            console.log('User tried empty username and empty room');
            return;
        }
        if( !does_room_exist(room) ) {
            callback( false, false);
            return;
        }
        if( !is_name_available(username, room) ) {
            callback( true, false );
            return;
        }
        socket.join(room);
        console.log(`User "${username}" enters room named "${room}"`);

        users.push({
            name: username,
            id: socket.id
        });
        socket.to(room).emit("JOIN_ROOM", socket.id, room);
    });
});

function get_server_state() {
    const state = {
        rooms: get_all_rooms(),
        users: get_all_users(),
        users_in_each_room: get_each_room_and_its_users()
    }
    console.log(`========== Server state: ==========`);
    console.table(state);
    return state;
}

function get_all_rooms() {
    const arr = Array.from(io.sockets.adapter.rooms);
    const filtered = arr.filter(room => !room[1].has(room[0]));
    const res = filtered.map(i => i[0]);
    return res;
}

function does_room_exist( room ) {
    const rooms = get_all_rooms();
    if( rooms.length < 1 ) return false;
    return rooms.includes( room );
}

function get_all_users() {
    const ids = get_all_sockets_ids();
    const all_users = [];

    for (let i = 0; i < ids.length; i++) {
        const id_username = get_id_username( ids[i] );
        if(id_username) {
            all_users.push({
                name: id_username,
                id: ids[i]
            });
        } else {
            all_users.push({
                name: '',
                id: ids[i]
            });
        }
    }

    return all_users;
}

function get_id_username(id) {
    for (let i = 0; i < users.length; i++) {
        if( id == users[i].id ) {
            return users[i].name;
        }
    }
    return false;
}

function get_all_sockets_ids() {
    return sockets_ids = Array.from(io.sockets.sockets).map(socket => socket[0]);
}

function get_each_room_and_its_users() {
    const rooms = get_all_rooms();

    const players_in_each_room = [];
    
    rooms.forEach(room => {
        players_in_each_room.push({
            room_name: room,
            users: get_ids_of_users_from_room(room)
        });
    });
    return players_in_each_room;
}

function get_ids_of_users_from_room( room ) {
    return Array.from(io.sockets.adapter.rooms.get(room));
}

function is_name_available(name, room) {
    const ids = get_ids_of_users_from_room(room);
    const users_in_the_room = [];
    ids.forEach(id => {
        users_in_the_room.push( get_id_username(id) );
    });
    return !users_in_the_room.includes(name);
}