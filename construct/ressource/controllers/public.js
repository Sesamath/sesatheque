/**
 * This file is part of Sesatheque.
 *   Copyright 2014-2015, Association Sésamath
 *
 * Sesatheque is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * Sesatheque is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Sesatheque (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de l'application Sésathèque, créée par l'association Sésamath.
 *
 * Sésathèque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict';

// var _ = require('underscore')._
var converter = require('../converter')
var repository = require('../repository')
var routes = require('../config.js').constantes.routes

var controller = lassi.Controller('public')
controller.respond('html')

/**
 * Les routes d'accès aux ressources public (sans authentification)
 * La session ne doit pas être utilisée ici (pour que varnish puisse virer les cookies en amont)
 *
 * Seules sont disponibles les routes describe et display (avec layout-iframe)
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
      repository.loadPublic(id, function (error, ressource) {
        if (error) {
          next(error)
        } else if (ressource) {
          ctx.metas.title = ressource.titre
          converter.getViewData(error, ressource, ctx, next)
        } else {
          ctx.notFound("La ressource d'identifiant " + id + " n'existe pas ou n'est pas publique")
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

      repository.loadPublic(id, function (error, ressource) {
        if (!ressource) {
          ctx.notFound("La ressource d'identifiant " + id + " n'existe pas ou n'est pas publique")
        } else {
          ctx.metas.title = ressource.titre
          var data = {
            pluginBaseUrl:'../../plugins/' +ressource.typeTechnique,
            vendorsBaseUrl:'../../vendors',
            pluginName : ressource.typeTechnique,
            ressource: lassi.tools.stringify(ressource) // une string pour que dust le mette dans le source
          }
          next(null, data)
        }
      })
    })

/**
 * preview : Voir la ressource dans le site
 */
controller
    .Action(routes.preview + '/:id', 'public.preview')
    .renderWith('preview')
    .do(function (ctx, next) {
      // sera affiché en iframe, comme pour tous les autres sites
      next(null, {url:ctx.url(lassi.action.ressource.display, ctx.arguments)})
    })

/**
 * Liste d'après les critères passés
 * index : nom du champ à filtrer
 * value : valeurs possibles
 * en 1er param (puis valeur, offset & nb)
 */
controller
  .Action('by/:index/:value/:start/:nb', 'public.by')
  .renderWith('liste')
  .do(function (ctx, next) {
      log.dev('liste avec les args', ctx.arguments)
      var index = ctx.arguments.index
      var value = ctx.arguments.value
      var values
      if (value !== "undefined") {
        if (value.indexOf(',')) values = value.split(',')
        else values = [value]
      }
      var options = {
        filters : [
          {index:'restriction', value:0},
          {index:index, values:values}
        ],
        orderBy:'id',
        start   : parseInt(ctx.arguments.start),
        nb      : parseInt(ctx.arguments.nb)
      }
      repository.getListe(options, function (error, ressources) {
        if (error) next(error)
        else {
          ctx.metas.title = 'Résultats de recherche'
          next(null, {ressources: addUrls(ctx, ressources)})
        }
      })
  });

/**
 * Liste d'après les filtres en json (qui peuvent être multiple)
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
  .Action('by', 'public.byOptionsPost')
  .via('post')
  .renderWith('liste')
    .do(function (ctx, next) {
      repository.getListe(ctx.post, function (error, ressources) {
        if (error) next(error)
        else {
          ctx.metas.title = 'Résultats de recherche'
          next(null, {ressources: addUrls(ctx, ressources)})
        }
      })
    })

/**
 * Liste d'après les filtres en json (qui peuvent être multiple), dispo aussi en get
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
    .Action('by/:json', 'public.byOptionsGet')
    .renderWith('liste')
    .do(function (ctx, next) {
      repository.getListe(ctx.arguments.json, function (error, ressources) {
        if (error) next(error)
        else {
          ctx.metas.title = 'Résultats de recherche'
          next(null, {ressources: addUrls(ctx, ressources)})
        }
      })
    })

module.exports = controller;

/**
 * Ajoute les propriétés url à chaque elt du tableau de ressource
 * @param {Context} ctx
 * @param {Array} ressources
 * @returns {Array} Le nouveau tableau de ressources
 */
function addUrls(ctx, ressources) {
  if (ressources && ressources.length) ressources.forEach(function (ressource) {
    ressource.urlDescribe = ctx.url(lassi.action.public.describe, {id:ressource.id})
    ressource.urlPreview = ctx.url(lassi.action.public.preview, {id:ressource.id})
    ressource.urlDisplay = ctx.url(lassi.action.public.display, {id:ressource.id})
  })
  return ressources
}
