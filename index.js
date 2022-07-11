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

server.listen( process.env.PORT , "0.0.0.0" || "localhost", () => {
    console.log('listening on port ' + process.env.PORT);
});  

io.on('connection', (socket) => {
    console.log(`${socket.id} connected`);
});