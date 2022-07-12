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
rooms = [];
// name: room,
// users: [{
//   id: socket.id,
//   name: username
// ]},
// game_state: 0

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

/* #region io events */
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

        add_user_to_room( room, socket.id, username );
        callback( true, get_room(room) );
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

        add_user_to_room( room, socket.id, username );
        socket.to(room).emit("JOIN_ROOM", get_room(room), username );
        callback(true, true, get_room(room) );
    });

    socket.on("disconnecting", () => {
        const room_name = find_room_by_user_id( socket.id );
        const username = get_id_username(socket.id);
        remove_player( socket.id );
        socket.to(room_name).emit('LEFT_ROOM', get_room(room_name), username );
    });

    socket.on('disconnect', () => {
        console.log(`${socket.id} has disconnected`);
    });
});
/* #endregion */

/* #region General functions */
function get_server_state() {
    const state = {
        rooms: get_all_rooms(),
        users: get_all_users(),
        users_in_each_room: rooms
    }
    console.log(`========== Server state: ==========`);
    console.log(state);
    return state;
}

function get_all_sockets_ids() {
    return sockets_ids = Array.from(io.sockets.sockets).map(socket => socket[0]);
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
    for (let i = 0; i < rooms.length; i++) {
        for (let j = 0; j < rooms[i].users.length; j++) {
            if( id == rooms[i].users[j].id ) {
                return rooms[i].users[j].name;
            }
        }
    }
    return false;
}

function remove_player( id ) {
    const room = find_room_by_user_id( id );
    if( !room ) return;

    for (let i = 0; i < rooms.length; i++) {
        if( room == rooms[i].name ) {
            if(rooms[i].users.length < 2) {
                console.log(`REMOVING ROOM ${rooms[i]}`);
                rooms.splice(i, 1);
                return;
            } 

           for (let j = 0; j < rooms[i].users.length; j++) {
              if( rooms[i].users[j].id == id) {
                  console.log(`REMOVING USER ${rooms[i].users[j]}`);
                  rooms[i].users.splice(j, 1);
              }
           }
        }
    }
}
/* #endregion */


/* #region Rooms related functions */
function get_all_rooms() {
    const rooms_array = [];
    rooms.forEach(room => {
        rooms_array.push(room.name);
    });
    return rooms_array;
/*
    const arr = Array.from(io.sockets.adapter.rooms);
    const filtered = arr.filter(room => !room[1].has(room[0]));
    const res = filtered.map(i => i[0]);
    return res;*/
}

function get_room( name ) {
   for (let i = 0; i < rooms.length; i++) {
     if( rooms[i].name == name) {
        return rooms[i];
     }
   }
   return '';
}

function find_room_by_user_id( id ) {
    const all_rooms = get_all_rooms();
    for (let i = 0; i < all_rooms.length; i++) {
        const room_users = get_ids_of_users_from_room( all_rooms[i] );
        if( room_users.includes(id) ) {
            return all_rooms[i];
        }
    }
    return false;
}

function does_room_exist( room ) {
    const rooms = get_all_rooms();
    if( rooms.length < 1 ) return false;
    return rooms.includes( room );
}

function get_ids_of_users_from_room( room ) {
    const room_obj = get_room(room);
    const ids = [];

    room_obj.users.forEach(user => {
       ids.push( user.id );
    });
    return ids;
    //return Array.from(io.sockets.adapter.rooms.get(room));
}

function is_name_available(name, room) {
    const ids = get_ids_of_users_from_room(room);
    const users_in_the_room = [];
    ids.forEach(id => {
        users_in_the_room.push( get_id_username(id) );
    });
    return !users_in_the_room.includes(name);
}

function add_user_to_room( room, id, name ) {
    for (let i = 0; i < rooms.length; i++) {
        if( rooms[i].name == room ) {
            rooms[i].users.push({
                id,
                name
            });
            return;
        }
    }

    // If room does not exist, let's create it
    rooms.push({
        name: room,
        users: [{
            id,
            name
        }], 
        game_state: 0
    });
}
/* #endregion */