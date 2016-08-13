var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('port', (process.env.PORT || 3000));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

var ioRoom = io.of('/AAAA');
ioRoom.on('connection', function(socket){
  console.log("New Connection: " + socket);
  socket.on('playerJoinedRoom', function(msg){
    console.log("Player Joined: ", msg);
    ioRoom.emit('playerJoinedRoom', msg);
  });
});

http.listen(app.get('port'), '0.0.0.0', function() {
  console.log('listening on *:' + app.get('port'));
});
