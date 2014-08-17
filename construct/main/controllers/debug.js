'use strict';

var controller = lassi.Controller('debug');
//var _ = require('underscore')._;
var js_beautify = require('js-beautify').js_beautify;

controller.respond('html');

/**
 * Une route pour afficher des objets en dev (debug)
 */
controller
    .Action('session')
    .renderWith('debug')
    .do(function (ctx, next) {
      next(null, {debug:js_beautify(lassi.tools.stringify(ctx.session))})
    });

controller
    .Action('request')
    .renderWith('debug')
    .do(function (ctx, next) {
      next(null, {debug:js_beautify(lassi.tools.stringify(ctx.request))})
    });

controller
    .Action('response')
    .renderWith('debug')
    .do(function (ctx, next) {
      next(null, {debug:js_beautify(lassi.tools.stringify(ctx.response))})
    });

module.exports = controller;
