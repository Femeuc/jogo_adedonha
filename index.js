// IMPORTS
const { Socket } = require('dgram');
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

let port = process.env.PORT;
if( process.env.WHERE == 'dev' ) {
    server.listen(port, "0.0.0.0" || "localhost", () => {
        console.log('listening on *:3000');
    });  
} else {
    server.listen(port, () => {
        console.log('listening on port ' + port);
    });  
}