function server_state() {
    socket.emit("SERVER_STATE", (state) => {
        console.log(state);
    });
}

document.querySelector("#send_message").addEventListener("keydown", function(event) {
    let ul_chat = document.querySelector('ul#chat');
    if (event.key === "Enter") {
        ul_chat.innerHTML += `<li>${event.target.value}</li>`;
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

    socket.emit('CREATE_ROOM', username, room, (success, room_obj) => {
        if( !success ) {
            alert('Já existe uma sala com esse nome');
            return;
        } 
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

    users.forEach(user => {
        players_ul.innerHTML += 
        `<div class="player">
            <img src="./images/${get_random_avatar_name()}" alt="">
            <div>
              <div>30pts.</div>
              <span>${user.name}</span>
            </div>
        </div>`
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

function get_random_avatar_name() {
    const random = Math.floor(Math.random() * 12);
    return `among_${random}.PNG`;
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

