const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const players = {};
let gameStartTime = Date.now();

io.on('connection', (socket) => {
    console.log('ကစားသမား ချိတ်ဆက်လာပါပြီ ID:', socket.id);

    // Player ပွဲဝင်လာခြင်း
    socket.on('join_game', (data) => {
        players[socket.id] = {
            id: socket.id,
            name: data.name || 'Player',
            x: 0, y: 0, z: 0, rY: 0,
            points: 0,
            balloons: 0
        };
        io.emit('update_players', players);
        socket.emit('timer_sync', { startTime: gameStartTime });
    });

    // Player ရွေ့လျားမှု
    socket.on('player_move', (pos) => {
        if (players[socket.id]) {
            players[socket.id].x = pos.x;
            players[socket.id].y = pos.y;
            players[socket.id].z = pos.z;
            players[socket.id].rY = pos.rY;
            socket.broadcast.emit('player_moved', { id: socket.id, ...pos });
        }
    });

    // Point နဲ့ Balloon Score များကို Update လုပ်ခြင်း
    socket.on('update_score', (scoreData) => {
        if (players[socket.id]) {
            players[socket.id].points = scoreData.points;
            players[socket.id].balloons = scoreData.balloons;
            io.emit('update_players', players);
        }
    });

    // ထွက်သွားသောအခါ
    socket.on('disconnect', () => {
        console.log('ကစားသမား ထွက်သွားပါပြီ ID:', socket.id);
        delete players[socket.id];
        io.emit('update_players', players);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Game Server အောင်မြင်စွာ စတင်နေပါပြီ Port: ${PORT}`);
});