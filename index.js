var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var randomColor = require('randomcolor');

app.set('port', (process.env.PORT || 3000));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/join.html');
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

var clients = {};
var ioRoom = io.of('/AAAA');
ioRoom.on('connection', function(socket){
  console.log('Query: ', socket.handshake.query);
  var client = {
    id: socket.id,
    player: {
      playerColor: randomColor({
        luminosity: 'dark',
      }),
      playerId: guid(),
      playerName: socket.handshake.query.name,
    },
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
    socket.emit('playerJoinedRoom', client.player);
    socket.on('disconnect', function(msg){
      console.log("Player Left: ", msg);
      var host = ioRoom.sockets[clients.host.id];
      if (host != null) {
        host.emit('playerLeftRoom', client.player);
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
