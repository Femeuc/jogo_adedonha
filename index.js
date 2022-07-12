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
//
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

        begin_room();
    });

    socket.on('ENTER_ROOM', (username, room, callback) => {
        if( username.length < 1 || room.length < 1 ) {
            console.log('User tried empty username and empty room');
            return;
        }
        if( !does_room_exist(room) ) {
            callback( false );
            return;
        }
        socket.join(room);
        console.log(`User "${username}" enters room named "${room}"`);
        socket.to(room).emit("JOIN_ROOM", socket.id, room);
    });
});

function get_server_state() {
    const state = {
        rooms: all_rooms()
    }
    console.log(`========== Server state: ==========`);
    console.table(state);
    return state;
}

function all_rooms() {
    const arr = Array.from(io.sockets.adapter.rooms);
    const filtered = arr.filter(room => !room[1].has(room[0]));
    const res = filtered.map(i => i[0]);
    return res;
}

function does_room_exist( room ) {
    const rooms = all_rooms();
    if( rooms.length < 1 ) return false;
    return rooms.includes( room );
}