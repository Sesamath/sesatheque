require('angular');
require('angular-ui-router');
require('angular-sanitize');
require('angular-animate');

window.app = angular.module('sesalab-admin', ['ui.router', 'ngSanitize', 'ngAnimate'])
require('./_modules');

