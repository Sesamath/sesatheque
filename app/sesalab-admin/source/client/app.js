require('angular');
require('angular-ui-router');
require('angular-sanitize');
require('angular-animate');
var _ = require('lodash');
_.formatDate = function(date, fmt) {
  if (typeof fmt === 'undefined') {
    fmt = date;
    date = new Date();
  }
  if (typeof date === 'number') {
    if (date<10000000000) {
      date = new Date(1000*date);
    } else {
      date = new Date(date);
    }
  }
  if (typeof date == 'string') {
    date = new Date(date);
  }
  function pad(value) {
    return (value.toString().length < 2) ? '0' + value : value;
  }
  return fmt.replace(/%([a-zA-Z]+)/g, function (_, fmtCode) {
    switch (fmtCode) {
      case 'd':
        return pad(date.getDate());
      case 'M':
        return pad(date.getMonth() + 1);
      case 'MM':
        var months = ['Jan','Fev','Mar','Apr','May','Jun','Jui','Aug','Sep','Oct','Nov','Dec'];
        return months[date.getMonth()];
      case 'Y':
        return date.getFullYear();
      case 'H':
        return pad(date.getHours());
      case 'm':
        return pad(date.getMinutes());
      case 's':
        return pad(date.getSeconds());
      case 'Z':
        var min = -date.getTimezoneOffset();
        var h = Math.floor(min / 60);
        var m = min % 60;
        return (min>0?'+':'-')+pad(h)+pad(m);
      default:
        throw new Error('Unsupported format code: ' + fmtCode);
    }
  });
}

window.app = angular.module('sesalab-admin', ['ui.router', 'ngSanitize', 'ngAnimate'])
require('./_modules');

