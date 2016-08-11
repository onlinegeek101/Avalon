var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('port', (process.env.PORT || 3000));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

io.on('connection', function(socket){
  console.log("New Connection: " + socket);
  socket.on('new message', function(msg){
    io.emit('new message', msg);
  });
});

http.listen(app.get('port'), '0.0.0.0', function() {
  console.log('listening on *:' + app.get('port'));
});
