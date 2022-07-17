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

// cors config
app.use(cors({
    origin: '*'
}));

app.use(express.static(path.join(__dirname, 'client')))
app.get('/', (req, res) => {
    res.render('index.html');
});

server.listen( process.env.PORT || "0.0.0.0" || "localhost", () => {
    console.log('listening on port ' + process.env.PORT);
});  

// GLOBAL VARIABLES
const rooms = [];
// name: room,
// users: [{
//   id: socket.id,
//   name: username
// ]},
// game_state: 0
// browser_ids: []
// checkboxes: checkboxes
const checkboxes = [
    // default
    {
        Animal: true,
        Fruta: true,
        Nome: true,
        FVL: true,
        CEP: true,
        Objeto: true
    },
    // custom
    {
        Time_futebol: true,
        Rima_com_ÃO: true,
        Rima_com_ADE: true,
        Rima_com_EZA: true,
        Cor: false
    },
    // letters
    {
        A: true,
        B: true,
        C: true,
        D: true,
        E: true,
        F: true,
        G: true,
        H: false,
        I: true, 
        J: true,
        K: false,
        L: true,
        M: true,
        N: true, 
        O: true,
        P: true,
        Q: false,
        R: true,
        S: true, 
        T: true,
        U: true,
        V: true,
        X: false,
        W: false,
        Y: false,
        Z: false
    }
]

/* #region io events */
io.on('connection', (socket) => {
    console.log(`${socket.id} connected`);

    socket.on('RECONNECT', (username, browser_id) => {
        handle_reconnection( socket, username, browser_id );
    });

    socket.on('SERVER_STATE', callback => {
        callback( get_server_state() );
    });

    socket.on('CREATE_ROOM', (username, room, browser_id, callback) => {
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

        add_user_to_room( room, socket.id, username, browser_id );
        callback( true, get_room(room) );
    });

    socket.on('ENTER_ROOM', (username, room, browser_id, callback) => {
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

        add_user_to_room( room, socket.id, username, browser_id );
        socket.to(room).emit("JOIN_ROOM", get_room(room), username );
        callback(true, true, get_room(room) );
    });

    socket.on('NEW_CHECKBOX', (name) => {
        handle_checkbox_change( socket, name, true, 1 );
    });

    socket.on('CHECKBOX_CHANGE', (name, checked, type) => {
        handle_checkbox_change( socket, name, checked, type );
    })

    socket.on('CHAT_MESSAGE', message_li => {
        handle_chat_event(socket, message_li);
    });

    socket.on("disconnecting", () => {
        console.log('disconnecting..');
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
                  const browser_id = rooms[i].users[j].browser_id;
                  rooms[i].browser_ids.push( browser_id );
                  rooms[i].users.splice(j, 1);
              }
           }
        }
    }
}
function is_host( id ) {
    const room = find_room_by_user_id( id );
    const room_obj = get_room( room );
    return room_obj.users[0].id == id;
}

function handle_checkbox_change(socket, name, checked, type) { // type 
    if ( !is_host( socket.id ) ) return;
    checkboxes[type][name] = checked;
    const room = find_room_by_user_id( socket.id );
    socket.to(room).emit("CHECKBOX_CHANGE", checkboxes);
    console.log(`CHECKBOX_CHANGE: ${name}`);
}

function handle_reconnection( socket, username, browser_id ) {
    reconnect_user( socket, username, browser_id );
    const room = find_room_by_user_id( socket.id );
    console.log(socket.id, username, browser_id, room);
    io.to(room).emit("RECONNECT", get_room(room));
    console.log('RECONNECT: ' + username);
}

function handle_chat_event( socket, message_li ) {
    const room = find_room_by_user_id( socket.id );
    socket.to(room).emit('CHAT_MESSAGE', message_li);
    console.log(`MESSAGE: ${message_li}`);
}
/* #endregion */


/* #region Rooms related functions */
function get_all_rooms() {
    const rooms_array = [];
    rooms.forEach(room => {
        rooms_array.push(room.name);
    });
    return rooms_array;
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

function find_room_by_browser_id( browser_id ) {
    const all_rooms = get_all_rooms();
    for (let i = 0; i < all_rooms.length; i++) {
        const ids = get_room( all_rooms[i] ).browser_ids;
        if( ids.includes( browser_id )) {
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
}

function is_name_available(name, room) {
    const ids = get_ids_of_users_from_room(room);
    const users_in_the_room = [];
    ids.forEach(id => {
        users_in_the_room.push( get_id_username(id) );
    });
    return !users_in_the_room.includes(name);
}

function add_user_to_room( room, id, name, browser_id ) {
    for (let i = 0; i < rooms.length; i++) {
        if( rooms[i].name == room ) {
            rooms[i].users.push({
                id,
                name,
                browser_id
            });
            return;
        }
    }

    // If room does not exist, let's create it
    rooms.push({
        name: room,
        users: [{
            id,
            name, 
            browser_id
        }], 
        game_state: 0,
        browser_ids: [],
        checkboxes: checkboxes
    });
}

function reconnect_user( socket, username, browser_id ) {
    const room = find_room_by_browser_id( browser_id );
    if( !room ) return;
    socket.join(room);
    add_user_to_room(room, socket.id, username, browser_id);
}
/* #endregion */