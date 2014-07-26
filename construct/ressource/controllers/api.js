'use strict';

var controller = lassi.Controller('api');
var _ = require('underscore')._;

controller.respond('json');

/**
 * Create / update
 */
controller
    .Action('ressource')
    .via('post')
    .do(function(ctx, next) {
      //log.dev("dans api write on récupère en post", ctx.post)
      try {
        var ressource = lassi.ressource.getRessourceFromPost(ctx.post)
        //log.dev("que l'on a transformé en", ressource)
        lassi.ressource.write(ressource, function (error, ressource) {
          //log.dev("dans cb api write on récupère", ressource)
          if (error) next(null, {error: error.toString()})
          else if (!_.isEmpty(ressource.errors)) {
            next(null, {error: ressource.errors.join("\n")})
          } else {
            next(null, {id: ressource.id})
          }
        })
      } catch (e) {
        next(null, {error: e.toString()})
      }
    })

/**
 * Read (get) & delete
 */
controller
    .Action('ressource/:id')
    .via('get', 'delete')
    .do(function (ctx, next) {
      var id = ctx.arguments.id

      if (ctx.method === 'get') {
        lassi.ressource.load(id, function (error, ressource) {
          log.dev("dans api get " +id, ressource)
          if (error) next(null, {error: error.toString()})
          else if (ressource) {
            // faut virer cette propriété que l'on ne veut pas renvoyer
            // (et qui passe pas au JSON.stringify)
            delete ressource._entity
            next(null, ressource)
          } else {
            ctx.response.statusCode = 404;
            next(null, {error: "La ressource d'identifiant " + id + " n'existe pas"})
          }
        })

      } else {
        lassi.ressource.del(id, function (error, nbObjects, nbIndexes) {
          if (error) next(null, {error: error.toString()})
          else if (nbObjects > 0) {
            next(null, {deletedId: id, nbObjects:nbObjects, nbIndexes:nbIndexes})
          } else next(null, {error: "Aucune ressource d'identifiant " + id})
        });
      }
    })


module.exports = controller;
