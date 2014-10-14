'use strict';

var controller = lassi.Controller('debugJson');
//var _ = require('underscore')._;

controller.respond('json');

/**
 * renvoie en json ce que l'on reçoit en post
 */
controller
    .Action('post')
    .via('post')
    .do(function (ctx, next) {
      next(null, {post:ctx.post})
    });

/**
 * Renvoie {result:"ok"}
 */
controller
    .Action('postOk')
    .via('post')
    .do(function (ctx, next) {
      next(null, {result:"ok"})
    });

/**
 * Renvoie {error:"Une erreur déclenchée exprès"}
 */
controller
    .Action('postKo')
    .via('post')
    .do(function (ctx, next) {
      next(null, {error:"Une erreur déclenchée exprès"})
    });

module.exports = controller;
