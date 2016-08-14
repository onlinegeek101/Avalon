module.exports = function (id, values) {
  var handlers = {};
  var query = values != null ? values : {};
  var handshake = {
    "query": query,
  };
  return {
    "handshake": handshake,
    "emit": function(msg, data) {
      console.log('EMIT[' + id + ']: ' + msg, data);
    },
    "use": function() {

    },
    "on": function(cmd, handler) {
      var onHandlers = handlers['on'] == null ? {} : handlers['on'];
      var list = onHandlers[cmd] == null ? [] : onHandlers[cmd];
      list.push(handler);
      onHandlers[cmd] = list;
      handlers['on'] = onHandlers;
    },
    "close": function() {
      console.log('[]' + id + '] Closing socket')
    },
    "trigger": function(funct, cmd, data) {
      var onHandlers = handlers[funct] == null ? {} : handlers[funct];
      var list = onHandlers[cmd] == null ? [] : onHandlers[cmd];
      list.forEach(function (handler) {
        handler(data);
      });
    }
  }
};
