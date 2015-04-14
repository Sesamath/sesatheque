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

/**
 * Le controleur html /public/ (sans authentification) du composant ressource
 *
 * La session ne doit pas être utilisée ici (pour que varnish puisse virer les cookies en amont)
 * @param {Controller} controller
 * @param $ressourceRepository
 * @param $ressourceConverter
 * @param $accessControl
 * @param $routes
 */
module.exports = function (controller, $ressourceRepository, $ressourceConverter, $views, $routes) {
  log('controller ressourcePublic')
  //var tools = require('../tools')

  function affiche(context, view, options) {
    var oid = context.arguments.oid
    $ressourceRepository.loadPublic(oid, function (error, ressource) {
      $views.prepareAndSend(error, ressource, context, view, options)
    })
  }

  // describe
  controller.get($routes.get('describe', ':oid'), function (context) {
    log('public describe')
    affiche(context, 'describe')
  })

  // display : Voir la ressource pleine page (pour iframe)
  controller.get($routes.get('display', ':oid'), function (context) {
    affiche(context, 'display', {$layout:'../../static/views/layout-iframe'})
  })

  // preview : Voir la ressource avec header et menu
  controller.get($routes.get('preview', ':oid'), function (context) {
    affiche(context, 'display')
  })

  /**
   * Liste d'après les critères passés
   * index : nom du champ à filtrer
   * value : valeurs possibles
   * en 1er param (puis valeur, offset & nb)
   */
  controller.get('by/:index/:value/:start/:nb', function (context) {
    log.debug('liste avec les args', context.arguments)
    var index = context.arguments.index
    var value = context.arguments.value
    var values
    if (value !== "undefined") {
      if (value.indexOf(',')) values = value.split(',')
      else values = [value]
    }
    var options = {
      filters: [
        {index: 'restriction', values: [0]},
        {index: index, values: values}
      ],
      orderBy: 'oid',
      start  : parseInt(context.arguments.start),
      nb     : parseInt(context.arguments.nb)
    }
    $ressourceRepository.getListe(options, function (error, ressources) {
      var data = $views.getDefaultData('liste')
      data.$metas.title = 'Résultats de la recherche'
      if (error) data.contentBloc.error = error.toString()
      else data.contentBloc.ressources = $ressourceConverter.addUrlsToList(ressources)
      context.html(data)
    })
  })

  /**
   * Liste d'après les filtres postés en json (qui peuvent être multiple)
   * Le json doit contenir
   * - filters : array d'objets {index:nomIndex, values:tableauValeurs},
   *        tableauValeurs peut être undefined et ça remontera toutes les ressources ayant cet index
   * et peut contenir
   * - orderBy : un nom d'index
   * - order : 'desc' si on veut l'ordre descendant
   * - start : offset
   * - nb : nb de résultats voulus
   */
  controller.post('by', function (context) {
    $ressourceRepository.getListe(context.post, function (error, ressources) {
      var data = $views.getDefaultData('liste')
      data.$metas.title = 'Résultats de la recherche'
      if (error) data.contentBloc.error = error.toString()
      else data.contentBloc.ressources = $ressourceConverter.addUrlsToList(ressources)
    })
  })

  /**
   * Liste d'après les filtres en json (qui peuvent être multiple), que l'on rend aussi dispo aussi en get
   * Le json doit contenir
   * - filters : array d'objets {index:nomIndex, values:tableauValeurs},
   *        tableauValeurs peut être undefined et ça remontera toutes les ressources ayant cet index
   * et peut contenir
   * - orderBy : un nom d'index
   * - order : 'desc' si on veut l'ordre descendant
   * - start : offset
   * - nb : nb de résultats voulus
   */
  controller.get('by/:json', function (context) {
    var options
    var data = $views.getDefaultData('liste')
    data.$metas.title = 'Résultats de la recherche'
    try {
      options = JSON.parse(context.arguments.json)
      $ressourceRepository.getListe(context.post, function (error, ressources) {
        if (error) data.contentBloc.error = error.toString()
        else data.contentBloc.ressources = $ressourceConverter.addUrlsToList(ressources)
      })
    } catch (error) {
      data.contentBloc.error = error.toString()
    }
  })
}
