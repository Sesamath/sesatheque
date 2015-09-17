app.directive('anProgress', function() {
  return {
    scope: true,
    replace: true,
    template: require('./template.html'),
    link: function(scope, element, attributes) {
      var total = parseInt(attributes.total);
      var lastProgress, lastTime;
      var rest;
      attributes.$observe('progress', function(progress) {
        progress = parseInt(progress);
        var time = +new Date();
        if (lastProgress) {
          var speed = (progress-lastProgress)/(time-lastTime);
          var distance = total-progress;
          rest = Math.round((distance/speed)/1000);
        }
        lastProgress = progress;
        lastTime = time;
        scope.percent = 100*progress/total;
        scope.message = Math.round(scope.percent)+'%';
        if (rest) scope.message += ' - '+rest;
      })
    }
  }
})
