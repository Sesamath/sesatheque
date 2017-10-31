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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

const {getBaseUrl, getComponents} = require('sesatheque-client/dist/sesatheques')
const appConfig = require('../config')
const myBaseId = appConfig.application.baseId
const routes = appConfig.components.ressource.constantes.routes

module.exports = function ($accessControl) {
  /**
   * Service pour récupérer les routes d'affichage des ressources
   * @service $routes
   */
  var $routes = {}

  /**
   * Retourne url complétée avec du (?|&)key=value (encode value au passage)
   * @param {string} url
   * @param {string} key
   * @param {string|number} value
   * @return {string}
   */
  $routes.addParam = function addParam (url, key, value) {
    url += (url.indexOf('?') === -1) ? '?' : '&'
    url += key + '=' + encodeURIComponent(value)
    return url
  }

  /**
   * Retourne la route (sans préfixe de controleur ni slash de début) d'une action
   * Les arguments supplémentaires sont concaténé avec /
   * @memberOf $routes
   * @param {string} action
   * @returns {string} La route
   */
  $routes.get = function (action) {
    var route = routes[action]
    for (var i = 1; i < arguments.length; i++) {
      if (arguments[i]) route += (route ? '/' : '') + arguments[i]
    }

    return route
  }

  /**
   * Retourne la route absolue (commence par /) d'une action (avec public ou ressource au début suivant la ressource)
   * Les arguments supplémentaires sont concaténé avec /
   * @memberOf $routes
   * @param {string}           action (display|describe|preview)
   * @param {Ressource|string} [ressource] ressource ou oid ou rid
   * @param {Context}          [context] pour vérifier que l'on est authentifié
   * @returns {string} La route absolue
   */
  $routes.getAbs = function (action, ressource, context) {
    let route
    if (routes.hasOwnProperty(action)) {
      route = '/'
      let id
      let isPublic = true
      if (ressource) {
        let rid
        if (typeof ressource === 'string' && ressource.indexOf('/') !== -1) {
          rid = ressource
        } else if (typeof ressource === 'object') {
          // si c'est un alias, on veut la destination seulement pour afficher la ressource,
          // (c'est l'alias qu'on veut décrire ou modifier)
          if (ressource.aliasOf && (action === 'display' || action === 'preview')) rid = ressource.aliasOf
          else rid = ressource.rid
        } else {
          id = ressource
        }
        if (rid) {
          const [baseId, oid] = getComponents(rid)
          if (baseId !== myBaseId) route = getBaseUrl(baseId)
          id = oid
        }
        if (!id) {
          log.dataError('ressource invalide', ressource)
          // on plante pas pour ça mais on arrête là
          return route
        }
        if (ressource.restriction || $accessControl.isAuthenticated(context)) isPublic = false
      } else if (context && $accessControl.isAuthenticated(context)) {
        isPublic = false
      }
      if (action === 'api') route += 'api/' // pour l'api faut ajouter un préfixe
      // ce qui concerne l'édition est toujours sur /ressource
      if (['create', 'delete', 'edit'].indexOf(action) > -1) route += 'ressource/'
      else route += isPublic ? 'public/' : 'ressource/'
      // et on ajoute l'oid éventuel
      route += $routes.get(action, id)
    } else {
      log.error(new Error('appel de $routes.getAbs avec une action non gérée : ' + action))
    }
    // log.debug(`getAbs ${action} va retourner ${route}`)

    return route
  }

  /**
   * Retourne un tag html a avec une url locale absolue (qui commence avec /)
   * @memberOf $routes
   * @param actionName
   * @param ressource
   * @param {string} [label=ressource.nom] Le texte du lien
   * @returns {string} Le code html du lien
   */
  $routes.getTagA = function (actionName, ressource, label) {
    var html
    var route = $routes.getAbs(actionName, ressource)
    if (route) {
      html = '<a href="' + route + '">'
      html += label || ressource.titre || 'sans titre'
      html += '</a>'
    }

    return html
  }

  return $routes
}
