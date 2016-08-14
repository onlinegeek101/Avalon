var Game = require('../gameLogic.js')
var MockSocket = require('./MockSocket.js')

var game = new Game();
var data = game.configureGame([{
  "id": "Id1",
  "playerName": "TJ",
}, {
  "id": "Id2",
  "playerName": "Keri",
}]);

game.startGame(new MockSocket('Host'), {
  "Id1": new MockSocket('Id1'),
  "Id2": new MockSocket('Id2'),
}, data);
