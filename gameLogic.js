var MIN_PLAYERS = 2;
var MAX_PLAYERS = 10;

var SPIES_CONFIG = {
  2: 2,
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
      if (i != j) {
        var otherSpy = spies[j];
        knowledge.push({
          'playerName': otherSpy.name,
          'allegance': 'spy',
        })
      }
    }
    console.log('Knowledge', knowledge);
    spiesInfo.push({
      'data': {
        'allegance': 'spy',
        'knowledge': knowledge,
      },
      'player': spy,
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
      'player': resistance[i],
    })
  }
  return info;
}

function emitDataToPlayers(roleInfos, socketsByPlayerId) {
  for (var i = 0; i < roleInfos.length; i++) {
    var roleInfo = roleInfos[i];
    socketsByPlayerId[roleInfo.player.id].emit('start', roleInfo.data);
  }
}

function byPlayerId(list, map) {
  for (var i = 0; i < list.length; i++) {
    var element = list[i];
    map[element.player.id] = element.data;
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

module.exports = function () {
  return {
    "configureGame": function (players) {
      if (players.length < MIN_PLAYERS) {
        throw 'Not Enough Players';
      }
      var questLeader = players[Math.floor(Math.random() * players.length)].id;
      var rotation = [];
      rotation.push(questLeader);
      players.forEach(function(player) {
        if (questLeader != player.id) {
          rotation.push(player.id);
        }
      });
      var playerCount = players.length;
      var spiesCount = getSpiesCount(players.length);
      var spies = buildSpyInfo(removeRandomN(players, spiesCount));
      var resistance = buildResistanceInfo(players);

      console.log('SpiesInfo:', spies);
      console.log('ResistanceInfo:', resistance);
      var byId = {};
      byPlayerId(spies, byId);
      byPlayerId(resistance, byId);
      return {
        'hostData': {
          'questLeader': questLeader,
          'rotation': rotation,
        },
        'spies': spies,
        'resistance': resistance,
        'byPlayerId': byId,
      }
    },
    "startGame": function (host, socketsByPlayerId, gameData) {
      emitDataToPlayers(gameData.spies, socketsByPlayerId);
      emitDataToPlayers(gameData.resistance, socketsByPlayerId);
      host.emit('start', gameData.hostData);
    }
  }
};
