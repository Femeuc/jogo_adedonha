console.log('check 1', socket.connected);
socket.on('connect', function() {
  console.log('check 2', socket.connected);
});

function server_state() {
    socket.emit("SERVER_STATE", (state) => {
        console.log(state);
    });
}
on_page_load();
function on_page_load() {
    const username = localStorage.getItem('username');
    if(username) {
        document.querySelector('#username_input').value = username;
    }
    set_browser_id();
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

/* #region Connection related functions */
function create_room() {
    const inputs = document.querySelectorAll('#enter_room input');
    const username = inputs[0].value.toLowerCase();
    const room = inputs[1].value.toLowerCase();

    if( username.length < 1 || room.length < 1 ) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    socket.emit('CREATE_ROOM', username, room, localStorage.getItem('browser_id'), (success, room_obj) => {
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

    socket.emit('ENTER_ROOM', username, room, localStorage.getItem('browser_id'), (was_found, is_name_available, room_obj) => {
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

  update_room(room_obj);

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

/* #region Update UI functions */
function update_room(room_obj) {
    update_host(room_obj.users);
    update_left_bar(room_obj.users);
    update_chat_bar(room_obj.users);
    update_checkboxes(room_obj.checkboxes);
}
function update_host(users) {
    if( users[0].name == localStorage.getItem('username') ) {
        const host_only = document.querySelectorAll('.host_only');
        host_only.forEach( e => {
            e.classList.remove("host_only");
        });
    }
}
function update_left_bar(users) {
    const players_ul = document.querySelector('#left_sidebar ul');
    players_ul.innerHTML = '';

    for (let i = 0; i < users.length; i++) {
        players_ul.innerHTML += get_html(i, users);
    }
}
function update_chat_bar(users) {
    const chat_ul = document.querySelector('#right_sidebar ul');
    chat_ul.innerHTML = '';

    users.forEach(user => {
        chat_ul.innerHTML += `<li>${user.name} está conectado</li>`;
    });
}
function update_checkboxes(checkboxes) {
    const default_c = document.querySelector('#default');
    const custom = document.querySelector('#custom');
    const letters = document.querySelector('#letters');
    default_c.innerHTML = '';
    custom.innerHTML = '';
    letters.innerHTML = '';

    for (const item in checkboxes[0]) { // default
        default_c.innerHTML += get_checkbox_span_html(item, checkboxes[0]);
    }
    for (const item in checkboxes[1]) { // custom
        custom.innerHTML += get_checkbox_span_html(item, checkboxes[1]);
    }
    for (const item in checkboxes[2]) { // letters
        letters.innerHTML += get_checkbox_span_html(item, checkboxes[2]);
    }
}
/* #endregion */

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
    const name = span.querySelectorAll('span')[1];
    const input = input_span.querySelector('input');
    const type = ['default', 'custom', 'letters'].indexOf( span.parentNode.id );
    console.log(name);
    input_span.classList.toggle("checked");
    input.checked = input_span.classList.contains("checked");
    socket.emit('CHECKBOX_CHANGE', name.innerText, input.checked, type);
    console.log(`CHECKBOX_CHANGE: ${name.innerText} is ${input.checked}`);
}

function add_custom_topic() {
    const div = document.querySelector('#custom_topics_div');
    const input = document.querySelector('#custom_topic');
    if(input.value.length < 1 ) return;
    div.innerHTML += `
        <span class="checkbox_container" onclick="toggle_checkbox(this)">
            <span class="checkbox checked"> <input type="checkbox" checked> </span>
            <span>${input.value}</span>
        </span>
    `;
    console.log(`Novo tópic: ${input.value}`);
    socket.emit('NEW_CHECKBOX', input.value);
    input.value = '';
}

function set_browser_id() {
    const browser_id = localStorage.getItem('browser_id');
    if(!browser_id) {
        localStorage.setItem('browser_id', random_int(1000));
    }
}

/* #region HTML generators */
function get_html( i, users ) {
    const username = localStorage.getItem('username');
    let html_string = '<div class="player" style="';
    if( username == users[i].name ) {
        html_string += `box-shadow: 0px 0px 5px 5px #0e593e;`;
    } 
    html_string += `">`;
    if( i == 0 ) {
        html_string += `<div style="
            background-image: url(./images/crown.png);
            aspect-ratio: 1 / 1;  
            width: 30px;
            background-size: contain;
            position: absolute;
            top: -7px;
            left: -7px;
            z-index: 2;
        "></div>`;
    }
    html_string += `
        <img src="./images/${get_random_avatar_name()}" alt="">
        <div>
          <div>0pts.</div>
         <span>${users[i].name}</span>
        </div>
    </div>`;
    return html_string;
}

function get_checkbox_span_html(name, checkboxes) {
    let checked = '';
    if (checkboxes[name]) {
        checked = 'checked';
    }

    return `
    <span class="checkbox_container" onclick="toggle_checkbox(this)">
        <span class="checkbox ${checked}"> <input type="checkbox" ${checked}> </span>
        <span>${name}</span>
    </span>`;
}
/* #endregion */