'use strict';

var controller = lassi.Controller('public')
var converter = require('../converter')
var repository = require('../repository')
var routes = require('../config.js').constantes.routes

controller.respond('html')

/**
 * Les routes d'accès aux ressources public (sans authentification)
 * La session ne doit pas être utilisée ici (pour que varnish puisse virer les cookies en amont)
 *
 * Seules sont disponibles les routes
 * - describe et display (en html avec layout-iframe)
 * - json (en json)
 */

/**
 * describe : Voir les propriétés de la ressource
 */
controller
    .Action(routes.describe + '/:id', 'public.describe')
    .renderWith('describe')
    .do(function (ctx, next) {
      ctx.forceLayout = 'layout-iframe'
      var id = ctx.arguments.id
      repository.load(id, function (error, ressource) {
        if (error) next(error)
        else if (ressource) {
          // elle doit être publique
          if (ressource.restriction) {
            ctx.accessDenied("La ressource d'identifiant " + id + " n'est pas publique")
            return
          } else {
            ctx.metas.title = ressource.titre
            converter.sendPageData(error, ressource, ctx, next)
          }
        } else {
          ctx.response.statusCode = 404;
          next(null, {error: "La ressource d'identifiant " + id + " n'existe pas"})
        }
      })
    });

/**
 * display : Voir la ressource (layout-iframe est défini pour ressource.display dans le mainComponent.initialize)
 */
controller
  .Action(routes.display + '/:id', 'public.display')
  .renderWith('display')
  .do(function (ctx, next) {
      var id = ctx.arguments.id

      // on force le layout en ajoutant cette propriété au contexte,
      // qui sera récupéré par l'écouteur layout défini dans le mainComponent.initialize
      ctx.forceLayout = 'layout-iframe'

      repository.load(id, function (error, ressource) {
        var data
        if (!ressource) {
          ctx.response.statusCode = 404;
          data = {error: "La ressource d'identifiant " + id + " n'existe pas"}
        } else if (ressource.restriction) {
          ctx.accessDenied("La ressource d'identifiant " + id + " n'est pas publique")
          return
        } else {
          ctx.metas.title = ressource.titre
          delete ressource._entity
          data = {
            pluginBaseUrl:'../../plugins/' +ressource.typeTechnique,
            vendorsBaseUrl:'../../vendors',
            pluginName : ressource.typeTechnique,
            ressource: ressource.toString()
          }
        }
        next(null, data)
      })
    })

/**
 * Liste d'après le critère passé en 1er param (puis valeur, offset & nb)
 */
controller
  .Action('by/:index/:value/:start/:nb', 'public.by')
  .renderWith('liste')
  .do(function (ctx, next) {
      log.dev('liste avec les args', ctx.arguments)
      var index = ctx.arguments.index
      var value = ctx.arguments.value
      var start = ctx.arguments.start
      var nb    = ctx.arguments.nb
      var options = {
        filters : [{index:index, values:[value]}],
        orderBy:'id'
      }
      repository.getListe(options, start, nb, function (error, ressources) {
        if (error) next(error)
        else {
          // on ne garde que les publiques
          var ressourcesPubliques = []
          ressources.forEach(function (ressource) {
            if (!ressource.restriction) ressourcesPubliques.push(ressource)
          })
          ctx.metas.title = 'Résultats de recherche'
          next(null, {ressources: ressourcesPubliques})
        }
      })
  });

module.exports = controller;
