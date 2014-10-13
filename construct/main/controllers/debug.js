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
      if (ctx.session.compteur) ctx.session.compteur++
      else ctx.session.compteur = 1
      next(null, {debug:lassi.main.objToString(ctx.session)})
    });

controller
    .Action('request')
    .renderWith('debug')
    .do(function (ctx, next) {
      next(null, {debug:lassi.main.objToString(ctx.request)})
    });

controller
    .Action('response')
    .renderWith('debug')
    .do(function (ctx, next) {
      next(null, {debug:lassi.main.objToString(ctx.response)})
    });

// un controleur tout prêt pour tout et n'importe quoi
controller
    .Action('test')
    //.renderWith('debugDump')
    .renderWith('debug')
    .do(function (ctx, next) {
      next(null, {debug:lassi.main.objToString(ctx.request)})
      /* var repository = require('../../ressource/repository')
      repository.load(42, function(error, ress) {
        next(null, {debug:lassi.main.objToString(ress)})
      }) /* */
    });

module.exports = controller;
