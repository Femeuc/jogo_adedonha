function server_state() {
    socket.emit("SERVER_STATE", (state) => {
        console.log(state);
    });
}

document.querySelector("#send_message").addEventListener("keydown", function(event) {
    let ul_chat = document.querySelector('ul#chat');
    if(event.target.value.length < 1) return;
    if (event.key === "Enter") {
        ul_chat.innerHTML += `<li>${localStorage.getItem('username')}: ${event.target.value.trim()}</li>`;
        console.log(`MESSAGE SENT: ${event.target.value}`);
        event.target.value = '';
    }
});
on_page_load();
function on_page_load() {
    const username = localStorage.getItem('username');
    if(username) {
        document.querySelector('#username_input').value = username;
    }
    set_browser_id();
}

/* #region Connection related functions */
function create_room() {
    const inputs = document.querySelectorAll('#enter_room input');
    const username = inputs[0].value.toLowerCase();
    const room = inputs[1].value.toLowerCase();

    if( username.length < 1 || room.length < 1 ) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    socket.emit('CREATE_ROOM', username, room, (success, room_obj) => {
        if( !success ) {
            alert('Já existe uma sala com esse nome');
            return;
        } 
        localStorage.setItem('username', username);
        console.log(`User "${username}" creates room named "${room}"`);
        load_room( room_obj );
    });
}

function enter_room() {
    const inputs = document.querySelectorAll('#enter_room input');
    const username = inputs[0].value.toLowerCase();
    const room = inputs[1].value.toLowerCase();

    if( username.length < 1 || room.length < 1 ) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    socket.emit('ENTER_ROOM', username, room, (was_found, is_name_available, room_obj) => {
        if( !was_found ) {
            alert('Sala não encontrada');
            return;
        }
        if( !is_name_available ) {
            alert('Nome já está em uso');
            return;
        }
        localStorage.setItem('username', username);
        console.log(`User "${username}" enters room named "${room}"`);
        load_room( room_obj );
    });
}

function load_room(room_obj) {
  document.querySelector('#home_page').style.display = 'none';
  document.querySelector('#main_page').style.display = 'grid';

  update_room(room_obj.users);

  if(room_obj.game_state == 0) { 
    load_game_state_0( room_obj.users ); 
    return;
  }
  if(room_obj.game_state == 1) {
    //
    return;
  }
  // game_state == 2
}

function update_room(users) {
    update_left_bar(users);
    update_chat_bar(users);
}

function update_left_bar(users) {
    const players_ul = document.querySelector('#left_sidebar ul');
    players_ul.innerHTML = '';
    const username = localStorage.getItem('username');

    users.forEach(user => {
        let html_string = '';
        username == user.name ? html_string += 
        `<div class="player" style="box-shadow: 0px 0px 5px 5px #0e593e;">` : html_string += '<div class="player">';
        html_string += `
            <img src="./images/${get_random_avatar_name()}" alt="">
            <div>
              <div>0pts.</div>
             <span>${user.name}</span>
            </div>
        </div>`;
        players_ul.innerHTML += html_string;
    });
}

function update_chat_bar(users) {
    const chat_ul = document.querySelector('#right_sidebar ul');
    chat_ul.innerHTML = '';

    users.forEach(user => {
        chat_ul.innerHTML += `<li>${user.name} está conectado</li>`;
    });
}

function load_game_state_0(users) {
}
/* #endregion */

function random_int(max, min=0) {
    return Math.floor(Math.random() * (max + 1)) + min;
}

function get_random_avatar_name() {
    return `among_${ random_int(11) }.PNG`;
}

function toggle_checkbox( span ) {
    const input_span = span.querySelectorAll('span')[0];
    const letter = span.querySelectorAll('span')[1];
    const input = input_span.querySelector('input');

    input_span.classList.toggle("checked");
    input.checked = input_span.classList.contains("checked");
    console.log(`CHECKBOX_CHANGE: ${letter.innerText} is ${input.checked}`);
}

function add_custom_topic() {
    const div = document.querySelector('#custom_topics_div');
    const input = document.querySelector('#custom_topic');
    div.innerHTML += `
        <span class="checkbox_container" onclick="toggle_checkbox(this)">
            <span class="checkbox checked"> <input type="checkbox" checked> </span>
            <span>${input.value}</span>
        </span>
    `;
    console.log(`Novo tópic: ${input.value}`);
    input.value = '';
}

function set_browser_id() {
    const browser_id = localStorage.getItem('browser_id');
    if(!browser_id) {
        localStorage.setItem('browser_id', random_int(1000));
    }
}