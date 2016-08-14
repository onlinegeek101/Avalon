var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var randomColor = require('randomcolor');
var MIN_PLAYERS = 2;

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

io.use(function(socket, next){
    if (hasStarted) {
      if (socket.handshake.query.player != null) {
        var player = JSON.parse(socket.handshake.query.player);
        console.log('Attempting to Rejoin Active Player', player.playerId);
        if (player != null && player.playerId != null) {
          console.log('Well Formed Player Recieved', player);
          if (players[player.playerId] != null) {
            console.log('Player Found in players object', player);
            return next();
          }
          console.log('Player Not Found in players object', players);
        }
      }
      throw 'Game already in progress!';
    }
    return next();
});

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

var SPIES_CONFIG = {
  2:2,
  5: 2,
  6: 2,
  7: 3,
  8: 3,
  9: 3,
  10: 4,
}

function getSpiesCount(count) {
  var count = SPIES_CONFIG[count]
  if (count == null) {
    throw 'Not a valid player count';
  }
  return count;
}

function buildSpyInfo(spies) {
  console.log('Building Spies: ', spies);
  var spiesInfo = [];
  for (var i = 0; i < spies.length; i++) {
    var spy = spies[i];
    var knowledge = [];
    for (var j = 0; j < spies.length; j++) {
      if (i == j) {
        continue;
      }
      var otherSpy = spies[j];
      knowledge.push({
        'playerName': otherSpy.player.playerName,
        'allegance': 'spy',
      })
    }
    spiesInfo.push({
      'data': {
        'allegance': 'spy',
        'knowledge': knowledge,
      },
      'client': spy,
    })
  }
  return spiesInfo;
}
function buildResistanceInfo(resistance) {
  var info = [];
  for (var i = 0; i < resistance.length; i++) {
    info.push({
      'data': {
        'allegance': 'resistance',
      },
      'client': resistance[i],
    })
  }
  return info;
}

function setupGame(players) {
  var playerList = [];
  Object.keys(players).forEach(function(key) {
    playerList.push(players[key]);
  });
  var spiesCount = getSpiesCount(playerList.length);
  var spies = buildSpyInfo(removeRandomN(playerList, spiesCount));
  var resistance = buildResistanceInfo(playerList);

  console.log('SpiesInfo:', spies);
  console.log('ResistanceInfo:', resistance);
  var byPlayerId = {};
  for (var i = 0; i < spies.length; i++) {
    var spy = spies[i];
    byPlayerId[spy.client.player.playerId] = spy.data;
  }
  for (var i = 0; i < resistance.length; i++) {
    var member = resistance[i];
    byPlayerId[member.client.player.playerId] = spy.data;
  }
  return {
    'spies': spies,
    'resistance': resistance,
    'byPlayerId': byPlayerId,
  }
}

function removeRandomN(arr, n) {
    var result = [];
    if (n > arr.length)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * arr.length);
        var element = arr.splice(n, 1);
        result.push(element[0]);
    }
    return result;
}

var players = {};
var clients = {};
var ioRoom = io.of('/AAAA');
var hasStarted = false;
var gameInfo = {};
ioRoom.on('connection', function(socket) {
  var player = socket.handshake.query.player;
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
  var client = {
    id: socket.id,
    player: player,
  };
  if (socket.handshake.query.isHost == 'true') {
      clients.host = client;
      ioRoom.emit('log', 'Connection Host Joined');
      setupHost(ioRoom, socket);
  } else if (clients.host != null ) {
    var host = ioRoom.sockets[clients.host.id];
    if (host != null) {
      host.emit('playerJoinedRoom', client.player);
    }
    players[client.player.playerId] = client;
    ioRoom.emit('log', "Players Remaining: " + Object.keys(players).length);
    if (Object.keys(players).length >= MIN_PLAYERS && !hasStarted) {
      ioRoom.emit('ready', {});
    }
    var info = gameInfo == null || gameInfo.byPlayerId == null ? null : gameInfo.byPlayerId[client.player.playerId];
    ioRoom.emit('log', 'Emitting Player', client.player);
    socket.emit('playerJoinedRoom', {
      'player': client.player,
      'gameInfo': info,
    });
    socket.on('disconnect', function(msg){
      console.log("Player Left: ", msg);
      var host = ioRoom.sockets[clients.host.id];
      if (host != null) {
        host.emit('playerLeftRoom', client.player);
      }
    });
    socket.on('start', function(msg){
      hasStarted = true;
      gameInfo = setupGame(players);
      console.log('Started Timer');
      var time = 5;
      var timer = setInterval(function() {
        ioRoom.emit('countdown', {
          "time": time--
        })
        if (time < 0) {
          clearInterval(timer);
          for (var i = 0; i < gameInfo.spies.length; i++) {
            var info = gameInfo.spies[i];
            console.log('Emitting Spy Data:', info.data);
            ioRoom.sockets[info.client.id].emit('start', info.data);
          }
          for (var i = 0; i < gameInfo.resistance.length; i++) {
            var info = gameInfo.resistance[i];
            console.log('Emitting data to resistance member', info);
            ioRoom.sockets[info.client.id].emit('start', info.data);
          }
        }
      }, 1000);
      socket.on('cancelStart', function(msg){
        clearInterval(timer);
        ioRoom.emit('cancelStart', client.player);
        hasStarted = false;
        gameInfo = null;
      });
    });
    socket.on('disconnect', function(socket) {
      if (clients.host != null && clients.host.id == socket.id) {
        clients.host = null;
      }
      if (!hasStarted) {
        delete players[client.player.playerId];
        ioRoom.emit('log', "Players Remaining: " + Object.keys(players).length);
        if (Object.keys(players).length < MIN_PLAYERS) {
          ioRoom.emit('unready', {});
        }
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
