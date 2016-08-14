var Room = require('../roomLogic.js')
var MockSocket = require('./MockSocket.js')
var Game = require('../gameLogic.js')

var gameLogic = {
  "configureGame": function (players) { console.log('Configure Game - Players: ', players); return "Game Data" },
  "startGame": function(data) { console.log('Start Game - Data: ', data); return "Game Started" },
}

var socket = new MockSocket('Room');
// var room = new Room(socket, gameLogic);
// socket.trigger('on', 'startGame', {});
//
// setTimeout(function() {
//   socket.trigger('on', 'cancelCountdown', {});
// }, 1000);
// room.close();
var host = new MockSocket('Host', {
  "isHost": 'true'
});
var game = new Game()
room = new Room(socket, host, game);
socket.trigger('on', 'connection', new MockSocket('NewUser1', {
  "name": "TJ",
}));
socket.trigger('on', 'connection', new MockSocket('NewUser3', {
  "name": "Kerianna",
}));
socket.trigger('on', 'connection', new MockSocket('Mom', {
  "name": "Mom",
}));
socket.trigger('on', 'connection', new MockSocket('Dad', {
  "name": "Dad",
}));
socket.trigger('on', 'connection', new MockSocket('Mama', {
  "name": "Mama",
}));
socket.trigger('on', 'startGame', {});
