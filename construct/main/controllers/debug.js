'use strict';

var controller = lassi.Controller('debug');
//var _ = require('underscore')._;
var js_beautify = require('js-beautify').js_beautify;

controller.respond('html');

/**
 * On ajoute nos 4 méthodes CRUD (Create, Read, Update, Delete), avec 2 méthodes read suivant que
 * l'on veut voir la ressource (display ou embed) ou sa description (describe)
 *
 * Les erreurs liées à un bug dans le code sont en anglais,
 * celles liées à une incohérence de data et destinés à l'utilisateur en français
 * (celles liées à une url malformée doivent être interceptées avant nous)
 */

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
