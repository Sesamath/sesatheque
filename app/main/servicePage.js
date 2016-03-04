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

var _ = require('lodash')
var tools = require('../tools')

module.exports = function () {
  /**
   * Service de gestion des pages html
   * @service $page
   */
  var $page = {}

  /**
   * Ajoute une erreur à la liste qui sera envoyée à la vue
   * @param {string|error} error
   * @param {object} data objet qui sera passé à context.html()
   */
  $page.addError = function (error, data) {
    if (!data.errors || !data.errors.errorMessages) {
      data.errors = {
        errorMessages: []
      }
    }
    var errorMessage = (typeof error === 'string') ? error : error.toString()
    data.errors.errorMessages.push(errorMessage)
    log.error(error)
  }

  /**
   * Affiche une 401 avec Authentification requise en html
   * @param {Context} context
   * @param {string} [message='Authentification requise']
   */
  $page.denied = function denied (context, message) {
    if (!message) message = 'Authentification requise'
    $page.printError(context, message, 401)
  }

  /**
   * Retourne les datas minimales ($metas & co) et initialise context.layout (si context fourni)
   * @param {Context} [context]
   * @param {string}  [titre]
   * @param {object}  [contentBloc] Le bloc de contenu (objet avec une propriété $view
   *                                  et les autres propriétés qui seront passées à cette vue)
   *                                  ou un simple texte (qui sera passé à la vue contents
   * @returns {{$metas: {}}}
   */
  $page.getDefaultData = function getDefaultData (context, titre, contentBloc) {
    var data = {
      $metas: {
        js: ['/page.bundle.js']
      }
    }
    if (titre) {
      data.$metas.title = titre
    }
    if (context) {
      if (context.get.layout === 'iframe') context.layout = 'iframe'
      else context.layout = 'page'
      // data.$layout est fixé dans beforeTransport
    }
    if (typeof contentBloc === 'string') {
      data.contentBloc = {
        $view: 'contents',
        contents: [contentBloc]
      }
    } else if (contentBloc) {
      data.contentBloc = contentBloc
    }

    return data
  }

  /**
   * Affiche une page simple
   * @param {Context} [context]
   * @param {string}  [titre]
   * @param {object|string}  [contentBloc] Le bloc de contenu (objet avec une propriété $view
   *                                        et les autres propriétés qui seront passées à cette vue)
   *                                        ou un simple texte (qui sera passé à la vue contents
   * @param {object|Array}  [moreData]  Si c'est un array sera traité comme une blocList (d'une propriété blocs ajoutée ici),
   *                                    sinon sera fusionné avec data avant context.html(data) (par ex pour des ajouts de $metas)
   */
  $page.print = function (context, titre, contentBloc, moreData) {
    var data = $page.getDefaultData(context, titre, contentBloc)
    if (_.isArray(moreData)) {
      if (moreData.length) moreData = { blocs: { blocList: moreData } }
      else moreData = null
    }
    if (moreData) tools.merge(data, moreData)
    context.html(data)
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

  /**
   * Affiche un ou des message(s)
   * @memberOf $page
   * @param {Context}         context
   * @param {string|string[]} message (en mettre plusieurs dans un array pour avoir plusieurs paragraphes)
   * @param {string}          titre
   */
  $page.printMessage = function (context, message, titre) {
    var data = $page.getDefaultData(context, titre)
    var contents = message instanceof Array ? message : [message]
    data.contentBloc = {
      $view: 'contents',
      contents: contents
    }
    context.html(data)
  }

  return $page
}
