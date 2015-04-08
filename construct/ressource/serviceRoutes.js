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

'use strict'

/**
 * Service pour récupérer les routes d'affichage des ressources
 * @namespace $routes
 * @requires $settings
 */
module.exports = function ($settings) {
  var routes = $settings.get('components.ressource.constantes.routes')
  var $routes = {}

  /**
   * Retourne la route (sans préfixe de controleur) d'une action
   * Les arguments supplémentaires sont concaténé avec /
   * @memberOf $routes
   *
   * @param {string} action
   * @returns {string} La route
   */
  $routes.get = function(action) {
    var route = routes[action]
    if (arguments.length > 1) route += '/' +Array.prototype.slice.call(arguments, 1).join('/')

    return route
  }

  /**
   * Retourne la route absolue (commence par /) d'une action (avec public ou ressource au début suivant la ressource)
   * Les arguments supplémentaires sont concaténé avec /
   * @memberOf $routes
   *
   * @param {string} action (display|describe|preview)
   * @param {Ressource|number} ressource ou oid de ressource
   * @returns {string}
   */
  $routes.getAbs = function(action, ressource) {
    var route
    if (['display', 'describe', 'preview'].indexOf(action) > -1) {
      route = $settings.get('basePath', '/')
      if (ressource.oid) {
        route += (ressource.restriction === 0) ? 'public/' : 'ressource/'
        route += this.get(action, ressource.oid)
      } else {
        var oid = parseInt(ressource, 10)
        if (oid > 0) route += this.get(action, oid)
        else {
          log.error(new Error("appel de $routes.getAbs avec un argument ressource incorrect", ressource))
          route = null
        }
      }
    } else log.error(new Error("appel de $routes.getAbs avec une action non gérée : " +action))

    return route
  }

  /**
   * Retourne un tag html a avec une url locale absolue (qui commence avec /)
   * @param actionName
   * @param ressource
   * @param {string} [label=ressource.nom] Le texte du lien
   * @returns {*}
   */
  $routes.getTagA = function (actionName, ressource, label) {
    var html
    var route = $routes.getAbs(actionName, ressource)
    if (route) {
      html =  '<a href="' +route +'">'
      html += label || ressource.titre || 'sans titre'
      html += '</a>'
    }

    return html
  }

  return $routes
}