app.directive('anDatePicker', function($rootScope, $timeout, $popover) {
  console.log('here');
  // TODO à factoriser !!!
  var months = [
    'Janvier', 'Février', 'Mars',
    'Avril', 'Mai', 'Juin', 'Juillet',
    'Août', 'Septembre', 'Octobre',
    'Novembre', 'Décembre'];

  return {
    restrict: "E",
    replace: true,
    scope: {
      model:'=ngModel'
    },
    template: require('./template.html'),
    link: function(scope) {
      var _ = require('lodash');

      function initialize() {
        var tokens = scope.model.split('/');
        scope.current = {
          day: parseInt(tokens[0]),
          month: parseInt(tokens[1])-1,
          year: parseInt(tokens[2])
        }
        buildCalendar();
      }

      function buildCalendar() {
        scope.month = months[scope.current.month];
        var page = new Date(parseInt(scope.current.year), scope.current.month, parseInt(scope.current.day));
        var days = page.generateCalendar();
        var weeks = [], week, day;
        var now = new Date();
        var current = new Date(scope.current.year, scope.current.month, scope.current.day);
        for (var i in days) {
          if (i%7===0) weeks.push(week = []);
          day = days[i];
          week.push(day);
          day.$date = day.getDate();
          day.$day = day.getDay();
          day.$now = day.same(now, 'date');
          day.$current = day.same(current, 'date');
          day.$disabled = day.getMonth()!==scope.current.month;
          day.$weekend = day.$day===0 || day.$day===6;
        }
        scope.weeks = weeks;
      }

      scope.doClose = function() {
        $popover.close();
      }

      scope.doShow = function(event) {
        $popover.show({
          event: event,
          height: 300,
          template: require('./popup.html'),
          scope: scope});
      }

      scope.doSelectDay = function(day) {
        scope.model = _.formatDate(day, '%d/%M/%Y');
        scope.doClose();
      }

      scope.doGoToday = function() {
        var now = new Date()
        scope.current = {
          day: now.getDate(),
          month: now.getMonth(),
          year: now.getFullYear()
        }
        buildCalendar();
      }

      scope.doNextYear = function() {
        scope.current.year++;
        buildCalendar();
      }
      scope.doPreviousYear = function() {
        scope.current.year--;
        buildCalendar();
      }
      scope.doNextMonth = function() {
        scope.current.month++;
        buildCalendar();
      }
      scope.doPreviousMonth = function() {
        scope.current.month--;
        buildCalendar();
      }
      initialize();
    }
  }
});


