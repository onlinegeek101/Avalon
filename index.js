var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

/*io.on('connection', function(socket){
  console.log("New Connection: " + socket);
  socket.on('new message', function(msg){
    io.emit('new message', msg);
  });
});*/

http.listen(3000, '0.0.0.0', function() {
  console.log('listening on *:3000');
});
