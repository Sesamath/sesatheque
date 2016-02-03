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

module.exports = function () {
  /**
   * Service de gestion des pages html
   * @service $page
   */
  var $page = {}

  /**
   * Ajoute une erreur à la liste qui sera envoyée à la vue
   * @memberOf $page
   * @param error
   * @param data
   */
  $page.addError = function (error, data) {
    if (!data.errors || !data.errors.errorMessages) data.errors = {
      errorMessages : []
    }
    var errorMessage = (typeof error === "string") ? error : error.toString()
    data.errors.errorMessages.push(errorMessage)
    log.error(error)
  }

  /**
   * Affiche une 401 avec Authentification requise en html
   * @private
   * @param {Context} context
   * @param {string} [message="Authentification requise"]
   * @returns {boolean} true si authentifié
   */
  $page.denied = function denied(context, message) {
    if (!message) message = "Authentification requise"
    $page.printError(context, message, 401)
  }

  /**
   * Retourne les datas minimales (avec $views, $metas) et initialise context.layout
   * @param {Context} [context]
   * @returns {{$views: string, $metas: {}}}
   */
  $page.getDefaultData = function getDefaultData(context) {
    var data = {
      $views : __dirname + '/../views',
      $metas : {
        js : ['/page.bundle.js']
      }
    }
    if (context) {
      if (context.get.layout === 'iframe') context.layout = 'iframe'
      else context.layout = 'page'
      data.$layout = 'layout-' +context.layout
    } else {
      data.$layout = 'layout-page'
    }

    return data
  }

  /**
   * Affiche un message d'erreur
   * @memberOf $page
   * @param {Context}      context
   * @param {string|Error} error
   * @param {number}       [status=200]
   */
  $page.printError = function (context, error, status) {
    var data = $page.getDefaultData(context)
    $page.addError(error, data)
    context.status = status || 200
    context.html(data)
  }

  return $page
}


