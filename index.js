var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('port', (process.env.PORT || 3000));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/host', function(req, res){
  res.sendFile(__dirname + '/host.html');
});

app.get('/room/:roomId', function(req, res){
  console.log('Joining Room');
  res.sendFile(__dirname + '/public/room.html');
});

app.use(express.static('public'));

io.use(function(socket, next){
    return next();
});

var clients = {};
var ioRoom = io.of('/AAAA');
ioRoom.on('connection', function(socket){
  var client = {
    id: socket.id,
  };
  if (socket.handshake.query.isHost == 'true') {
      clients.host = client;
      console.log('Connection Host Joined');
      setupHost(ioRoom, socket);
  } else {
    socket.on('playerJoinedRoom', function(msg){
      console.log("Player Joined: ", msg);
      var host = ioRoom.sockets[clients.host.id];
      if (host != null) {
        host.emit('playerJoinedRoom', msg);
      }
    });
    socket.on('playerLeftRoom', function(msg){
      console.log("Player Left: ", msg);
      var host = ioRoom.sockets[clients.host.id];
      if (host != null) {
        host.emit('playerLeftRoom', msg);
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
