'use strict';

var controller = lassi.Controller('debug');
//var _ = require('underscore')._;

controller.respond('html');

/**
 * Une route pour afficher des objets en dev (debug)
 */
controller
    .Action('session')
    .renderWith('debug')
    .do(function (ctx, next) {
      next(null, {debug:lassi.tools.stringify(ctx.session, 2)})
    });

controller
    .Action('request')
    .renderWith('debug')
    .do(function (ctx, next) {
      next(null, {debug:lassi.tools.stringify(ctx.request, 2)})
    });

controller
    .Action('response')
    .renderWith('debug')
    .do(function (ctx, next) {
      next(null, {debug:lassi.tools.stringify(ctx.response, 2)})
    });

// un controleur tout prêt pour tout et n'importe quoi
controller
    .Action('groupe')
    .renderWith('debugDump')
    .do(function (ctx, next) {
      lassi.entity.Groupe.create({nom:'toto'}).store(function(error, groupe) {
        next(null, {error:error, groupe:groupe.toObject()})
      })
    });

module.exports = controller;
