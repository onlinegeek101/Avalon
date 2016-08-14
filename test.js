var gameLogic = require('./gameLogic.js')

var data = gameLogic.configureGame([{
  "id": "Id1",
  "playerName": "TJ",
}, {
  "id": "Id2",
  "playerName": "Keri",
}]);

console.log(data);

var emitLogger = {
  "emit": function(msg, data) {
    console.log('EMIT: ' + msg, data);
  }
};

gameLogic.startGame(emitLogger, {
  "Id1": emitLogger,
  "Id2": emitLogger,
}, data);
