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
 * Controleur /importEc/ pour importer les xml calculatice
 * @controller controllerImportEc
 * @requires $ressourceRepository {@link $ressourceRepository]
 * @requires $ressourceConverter
 * @requires $accessControl
 * @requires $personneControl
 * @requires $views
 * @requires $routes
 */
module.exports = function (controller, $ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $personneControl, $views, $routes) {
  var request = require('request')
  var _ = require('lodash')
  var tools = require('../tools')
  var seq = require('an-flow')
  var config = require('./config')

  /**
   * Équivalent de context.denied en json
   * @private
   * @param {Context} context
   * @param msg
   */
  function denied(context, msg) {
    if (!msg) msg = "Accès refusé"
    context.status = 403;
    context.json({error: msg})
  }

  /**
   * Callback générique de sortie
   * @private
   * @param {Context} context
   * @param {string|Error} error
   * @param data
   */
  function sendJson(context, error, data) {
    if (error) {
      log.debug("sendJson va renvoyer l'erreur", error, 'api')
      // on logge l'erreur si s'en est vraiment une (pas les strings simples)
      if (error.stack) {
        log.error(error)
        error = error.toString()
      }
      context.json({success:false, error: error})
    } else {
      log.debug('sendJson va renvoyer', data, 'api')
      // pas la peine de faire le stringify pour rien, on teste avant
      // if (log.perf.out) log.perf(context.response, 'jsonSentLength ' +tools.stringify(data).length, true)
      // commenté car Content-Length dispo dans le onFinish, sauf 204 et 304 (logique)
      context.json(data)
    }
  }

  /**
   * Met à jour un arbre calculatice
   * @route GET /importEc/:xml
   * @param {string} xml Le nom du xml (nom du fichier sans extension, ressources-cm2 par ex)
   */
  function getXml(context) {
    seq().seq(function () {
      $accessControl.isSesamathClient(context, this)
    }).seq(function (isSesamathClient) {
      if (!isSesamathClient) denied(context, "Vous n'avez pas les droits suffisant pour accéder à cette commande")
      else this()
    }).seq(function () {
      // on peut importer
      var next = this
      var url = config.imports.ecBase +"/xml/" +context.arguments.xml +".xml"
      request.get(url, function (error, response, body) {
        if (error) {
          log.error(error)
          next(new Error("impossible de récupérer " +url))
        } else if (body) {
          log.debug("on récupère le xml", body, {max:2000})
          sendJson(context, null, {success:true})
        } else {
          log.error("Sur l'url " +url +" on récupère", response)
        }
      })
    }).catch(function (error) {
      log.error(error)
      sendJson(context, null, {success:false, error:error.toString()})
    })
  }
  getXml.timeout = 10000
  controller.get(':xml', getXml)
}