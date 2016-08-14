var randomColor = require('randomcolor');
var guid = require('./guid.js');
var Timer = require('./timer.js');
var MIN_PLAYERS = 2;
var MAX_PLAYERS = 10;

module.exports = function (io, host, gameLogic) {
  if (io == null || host == null || gameLogic == null) {
    throw 'Required Room Argument Missing';
  }
  var hasGameStarted = false;
  var gameInfo = {};
  var playerIdToPlayer = {};
  var clients = {};
  var playerIdToSocket = {};

  function isHost(socket) {
    if (socket.handshake.query.isHost == 'true') {
        return true;
    }
  }

  function tellHost(command, data) {
    if (host == null) {
      throw 'Waiting for host to join';
    }
    host.emit(command, data);
  }

  function joinPlayer(room, socket, player) {
    if (!hasGameStarted && Object.keys(playerIdToPlayer).length < MAX_PLAYERS) {
      playerIdToSocket[player.playerId] = socket;
      playerIdToPlayer[player.playerId] = player;
      tellHost('newPlayer', player);
      socket.emit('onJoined', {
        "me": player,
        "gameState": null,
      });
      if (Object.keys(playerIdToPlayer).length >= MIN_PLAYERS) {
        room.emit('ready', {});
      }
    }
  }

  function playerLeft(room, playerId) {
    if (!hasGameStarted) {
      delete playerIdToPlayer[playerId];
      delete playerIdToSocket[playerId];
      if (Object.keys(players).length < MIN_PLAYERS) {
        room.emit('unready', {});
      }
    }
  }

  function getPlayer(socket, dontGenerate) {
    var player = socket.handshake.query.player;
    if (dontGenerate) {
      return JSON.parse(player);
    }
    if (player == null || player == '') {
      player = {
        playerColor: randomColor({
          luminosity: 'dark',
        }),
        playerId: guid(),
        playerName: socket.handshake.query.name,
      }
    } else {
      player = JSON.parse(player);
    }
    return player;
  }

  io.on('connection', function(socket) {
    if (isHost(socket)) {
      console.log('Host connected');
      host = socket;
      socket.on('disconnect', function(socket) {
        //Do Nothing On Host Disconnect
      })
    } else {
      var player = getPlayer(socket);
      console.log('Player connected', player);
      joinPlayer(io, socket, player);
      socket.on('disconnect', function(socket) {
        playerLeft(io, player.playerId);
      });
      socket.on('startGame', function(msg) {
        var players = [];
        Object.keys(playerIdToPlayer).forEach(function(key) {
          players.push({
            "id": playerIdToPlayer[key].playerId,
            "name": playerIdToPlayer[key].playerName,
          });
        });
        var gameData = gameLogic.configureGame(players)
        var timer = new Timer(5, {
          "onUpdate": function (count) {
            io.emit('countdown', {
              "time": count,
            });
          },
          "onComplete": function () {
            gameLogic.startGame(host, playerIdToSocket, gameData);
          },
          "onStop": function() {
            io.emit('cancelCountdown');
          }
        });
        io.on('cancelCountdown', function() {
          timer.stop();
        })
        timer.start();
      });
    }
  });
  io.use(function(socket, next){
      if (hasGameStarted) {
        var player = getPlayer(socket, true);
        if (player != null && playerIdToPlayer[player.playerId] != null) {
          return next();
        }
        next(new Error('Game already in progress!'));
      }
      return next();
  });
  return {
    "close": function () {
      Object.keys(playerIdToSocket).forEach(function (key) {
        playerIdToSocket[key].close();
      })
    },
  }
};
