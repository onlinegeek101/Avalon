var Game = require('../gameLogic.js')
var MockSocket = require('./MockSocket.js')

var game = new Game();
var data = game.configureGame([{
  "id": "Id1",
  "playerName": "TJ",
}, {
  "id": "Id2",
  "playerName": "Keri",
}, {
  "id": "Id3",
  "playerName": "Dad",
}, {
  "id": "Id4",
  "playerName": "Mom",
}, {
  "id": "Id5",
  "playerName": "Mama",
}]);

game.startGame(new MockSocket('Host'), {
  "Id1": new MockSocket('Id1'),
  "Id2": new MockSocket('Id2'),
  "Id3": new MockSocket('Id3'),
  "Id4": new MockSocket('Id4'),
  "Id5": new MockSocket('Id5'),
}, data);
