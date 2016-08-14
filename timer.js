module.exports = function (time, handler) {
  var time = 5;
  var timer = null;
  var count = time;
  return {
    "start": function() {
      timer = setInterval(function() {
        count--;
        if (count < 0) {
          handler.onComplete();
          clearInterval(timer);
          return;
        }
        handler.onUpdate(count);
      }, 1000);
    },
    "reset": function() {
      count = time;
      handler.onReset();
    },
    "stop": function() {
      if (timer != null) {
        clearInterval(timer);
        handler.onStop();
      }
    }
  }
}
