'use strict';

var controller = lassi.Controller('api/ressource');
var moment = require('moment');
var _ = require('underscore')._;
var config = require('../config.js');

controller.respond('json');

/**
 * Create
 */
controller
    .Action('add')
    .via('post')
    .do(function(ctx, next) {
      log.dev("dans api add on récupère en post", ctx.post)
      try {
        var ressource = lassi.ressource.getRessourceFromPost(ctx.post)
        log.dev("que l'on a transformé en", ressource)
        lassi.ressource.add(ressource, function (error, ressource) {
          log.dev("dans cb api add on récupère", error)
          log.dev("et", ressource)
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
 * Read (get)
 */
controller
    .Action('get/:id')
    .do(function (ctx, next) {
      var id = ctx.arguments.id
      lassi.ressource.load(id, function (error, ressource) {
        if (error) next(error)
        else if (ressource) {
          next(null, ressource)
        } else {
          ctx.response.statusCode = 404;
          next(null, {error: "La ressource d'identifiant " + id + " n'existe pas"})
        }
      })
    })

/**
 * Update
 */
controller
    .Action('update').via('post')
    .do(function(next) {
      // @todo vérif droits
      var ressourcePosted, ressourcePlausible, ressource, context = this;
      // on accepte un seul param data qui contient la ressource en json
      // mais aussi chaque champ séparément
      if (this.request.query.param.data) {
        try {
          ressourcePosted = JSON.parse(this.request.query.param.data);
        } catch(error) {
          ressourcePosted = null;
        }
      } else {
        ressourcePosted = convertPostToRessource(this.request.query.param);
      }
      ressourcePlausible = valideRessource(ressourcePosted);
      if (ressourcePlausible.error) {
        this.response.send({error: ressourcePlausible.error});
      } else {
        ressource = this.application.entity('Ressource');
        // @todo vérif d'intégrité
        ressource
            .onInitialize(ressourcePlausible)
            .store(function (error, ressource) {
              if (error) {
                context.response.send({error: error.toString()});
              } else {
                context.response.send({result: 'ok', oid: ressource.oid});
              }
            })
      }
    }); // do

/**
 * Delete
 */
controller.Action('delete/:oid')
  .do(function(next) {
    // @todo vérif droits
    var Ressource = this.application.entity('Ressource');
    Ressource.delete({oid:oid});
  });

module.exports = controller;
