var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var randomColor = require('randomcolor');
var MIN_PLAYERS = 2;

app.set('port', (process.env.PORT || 3000));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/join.html');
});

app.get('/host', function(req, res){
  res.sendFile(__dirname + '/host.html');
});

app.get('/room/:roomId', function(req, res){
  res.sendFile(__dirname + '/public/room.html');
});

app.use(express.static('public'));

io.use(function(socket, next){
    return next();
});

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

var players = {};
var clients = {};
var ioRoom = io.of('/AAAA');
ioRoom.on('connection', function(socket) {
  var player = socket.handshake.query.player;
  if (player == null || player == '') {
    player = {
      playerColor: randomColor({
        luminosity: 'dark',
      }),
      playerId: guid(),
      playerName: socket.handshake.query.name,
    }
  } else {
    player = JSON.parse(player);
  }
  var client = {
    id: socket.id,
    player: player,
  };
  if (socket.handshake.query.isHost == 'true') {
      clients.host = client;
      console.log('Connection Host Joined');
      setupHost(ioRoom, socket);
  } else if (clients.host != null ) {
    var host = ioRoom.sockets[clients.host.id];
    if (host != null) {
      host.emit('playerJoinedRoom', client.player);
    }
    players[client.player.playerId] = client;
    if (Object.keys(players).length > MIN_PLAYERS) {
      ioRoom.emit('ready', {});
    }
    socket.emit('playerJoinedRoom', client.player);
    socket.on('disconnect', function(msg){
      console.log("Player Left: ", msg);
      var host = ioRoom.sockets[clients.host.id];
      if (host != null) {
        host.emit('playerLeftRoom', client.player);
      }
    });
    socket.on('start', function(msg){
      console.log('Started Timer');
      var time = 5;
      var timer = setInterval(function() {
        ioRoom.emit('countdown', {
          "time": time--
        })
        if (time < 0) {
          clearInterval(timer);
          ioRoom.emit('start', {

          });
        }
      }, 1000);
      socket.on('cancelStart', function(msg){
        clearInterval(timer);
        ioRoom.emit('cancelStart', client.player);
      });
    });
    socket.on('disconnect', function(socket) {
      if (clients.host != null && clients.host.id == socket.id) {
        clients.host = null;
      }
      delete players[client.player.playerId];
      if (Object.keys(players).length < MIN_PLAYERS) {
        ioRoom.emit('unready', {});
      }
    });
  }
});

function setupHost(room, socket) {
  socket.on('disconnect', function(socket) {
    if (clients.host != null && clients.host.id == socket.id) {
      clients.host = null;
    }
  });
}

http.listen(app.get('port'), '0.0.0.0', function() {
  console.log('listening on *:' + app.get('port'));
});
