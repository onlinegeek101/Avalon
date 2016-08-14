var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var roomcodeGenerator = require('./roomcodeGenerator.js');
var Room = require('./roomLogic.js');
var Game = require('./gameLogic.js');

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


var players = {};
var clients = {};
var ROOMS = {};

io.use(function(socket, next){
    return next();
});

io.on('connection', function(socket) {
  if (socket.handshake.query.isHost == 'true') {
      var roomCode = roomcodeGenerator();
      socket.emit('assignRoom', {
        "roomCode": roomCode,
      });
      console.log('Creating Room:', roomCode);
      ROOMS[roomCode] = new Room(io.of('/' + roomCode), socket.join('/' + roomCode), new Game());
  }
})

http.listen(app.get('port'), '0.0.0.0', function() {
  console.log('listening on *:' + app.get('port'));
});
