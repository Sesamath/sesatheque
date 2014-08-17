/**
 * Controller ressource/api
 */
'use strict';

var controller = lassi.Controller('api')
var _ = require('underscore')._
var converter = require('../converter')
var repository = require('../repository')

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
        var id = ctx.post.id || 0
        var msg = id
        // init du chrono
        var start = log.getElapsed(0)
        /** lassi.tmp sert à stocker des dates pour debug et mesures de perfs */
        if (!lassi.tmp) lassi.tmp = {}
        lassi.tmp[ctx.post.id] = {m:msg,s:start}
        var ressource = converter.getRessourceFromPost(ctx.post)
        lassi.tmp[ctx.post.id].m += '\tcv ' +log.getElapsed(lassi.tmp[ctx.post.id].s)
        //log.dev("que l'on a transformé en", ressource)
        var permission = id ? 'write' : 'add'
        if (lassi.personne.hasPermission(permission, ctx, ressource)) {
          repository.write(ressource, function (error, ressource) {
            // id - convertPost - valide+setVersion - store - store2 - fin
            lassi.tmp[ctx.post.id].m += '\tretSt ' +log.getElapsed(lassi.tmp[ctx.post.id].s)
            log.errorData(lassi.tmp[ctx.post.id].m)
            //log.dev("dans cb api write on récupère", ressource)
            if (error) next(null, {error: error.toString()})
            else if (!_.isEmpty(ressource.errors)) {
              next(null, {error: ressource.errors.join("\n")})
            } else {
              next(null, {id: ressource.id})
            }
          })
        } else {
          var errorMsg = "Droits insuffisants"
          if (id) errorMsg += " pour modifier la ressource d'identifiant " + id
          else errorMsg += " pour ajouter une ressource"
          denied(errorMsg, ctx, next)
        }
      } catch (e) {
        next(null, {error: e.toString()})
      }
    })

/**
 * Read (get) & delete
 */
controller
    .Action('ressource/:id', 'api.read')
    .via('get', 'delete')
    .do(function (ctx, next) {
      var id = ctx.arguments.id

      function del(id) {
        repository.del(id, function (error, nbObjects, nbIndexes) {
          if (error) next(null, {error: error.toString()})
          else if (nbObjects > 0) {
            next(null, {deletedId: id, nbObjects:nbObjects, nbIndexes:nbIndexes})
          } else next(null, {error: "Aucune ressource d'identifiant " + id})
        });
      }

      if (ctx.method === 'get') {
        repository.load(id, function (error, ressource) {
          // log.dev("dans api get " +id, ressource)
          if (error) next(null, {error: error.toString()})
          else if (ressource) {
            // l'entité passe pas le JSON.stringify, à cause de la propriété _entity, d'où le toObject
            if (lassi.personne.hasReadPermission(ctx, ressource)) next(null, ressource.toObject())
            else  denied("Droits insuffisants pour accéder à la ressource d'identifiant " + id, ctx, next)
          } else notFound("La ressource d'identifiant " + id + " n'existe pas", ctx, next)
        })

      } else {
        if (!lassi.personne.hasPermission('del', ctx)) {
          // faut charger la ressource pour le savoir
          repository.load(id, function (error, ressource) {
            if (error) next(error)
            else if (!ressource) next(new Error("la ressource d'identifiant " + id +" n'existe pas"))
            else if (lassi.personne.hasPermission('del', ctx, ressource)) del(id) // next inclus
            else denied("Droits insuffisants pour supprimer la ressource d'identifiant " + id, ctx, next)
          })
        }
      }
    })

/**
 * Read public (sans session)
 */
controller
    .Action('public/:id', 'api.public')
    .do(function (ctx, next) {
      var id = ctx.arguments.id

        repository.load(id, function (error, ressource) {
          if (error) next(null, {error: error.toString()})
          else if (ressource) {
            // l'entité passe pas le JSON.stringify, à cause de la propriété _entity, d'où le toObject
            if (ressource.restriction === 0) next(null, ressource.toObject())
            else  denied("Droits insuffisants pour accéder à la ressource d'identifiant " + id, ctx, next)
          } else notFound("La ressource d'identifiant " + id + " n'existe pas", ctx, next)
        })
    })

/**
 * Liste d'après les filtres en json (qui peuvent être multiple)
 *
 * Le json doit contenir
 * - filters : array d'objets {index:nomIndex, values:tableauValeurs},
 *        tableauValeurs peut être undefined et ça remontera toutes les ressources ayant cet index
 * et peut contenir
 * - orderBy : un nom d'index
 * - order : 'desc' si on veut l'ordre descendant
 * - start : offset
 * - nb : nb de résultats voulus
 */
controller
    .Action('public/by', 'api.public.by')
    .via('post')
    .renderWith('liste')
    .do(function (ctx, next) {
      console.log('do ')

      log.dev('do post', ctx.post)
      repository.getListe(ctx.post, function(error, ressources) {
        log.dev('retour de getListe error', error)
        log.dev('retour de getListe ress', ressources)
        if (error) next(null, {error:error.toString()})
        else next(null, addUrls(ctx, ressources))
      })
    })

controller
    .Action('prof/by', 'api.prof.by')
    .via('post')
    .renderWith('liste')
    .do(function (ctx, next) {
      if (!lassi.personne.isAuthenticated()) next(null, {error:"Il faut être authentifié pour accéder aux ressources prof"})
      else repository.getListe('prof', ctx, ctx.post, function(error, ressources) {
        if (error) next(null, {error:error.toString()})
        else next(null, addUrls(ctx, ressources))
      })
    })

controller
    .Action('my/by', 'api.my.by')
    .via('post')
    .renderWith('liste')
    .do(function (ctx, next) {
      if (!lassi.personne.isAuthenticated()) next(null, {error:"Il faut être authentifié pour accéder à ses ressources"})
      else repository.getListe('moi', ctx, ctx.post, function(error, ressources) {
        if (error) next(null, {error:error.toString()})
        else next(null, addUrls(ctx, ressources))
      })
    })

module.exports = controller;

function denied(msg, ctx, next) {
  ctx.response.statusCode = 403;
  next(null, {error: msg})
}

function notFound(msg, ctx, next) {
  ctx.response.statusCode = 404;
  next(null, {error: msg})
}

/**
 * Ajoute les propriétés url à chaque elt du tableau de ressource
 * @param {Context} ctx
 * @param {Array} ressources
 * @returns {Array} Le nouveau tableau de ressources
 */
function addUrls(ctx, ressources) {
  return ressources.map(function (ressource) {
    if (ressource.restriction === 0) ressource.url = ctx.url(lassi.action.api.public.read, {id:ressource.id})
    else ressource.url = ctx.url(lassi.action.api.read, {id:ressource.id})
    return ressource.toObject()
  })
}