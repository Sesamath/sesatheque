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

'use strict';


module.exports = function () {
  var tools = require('../tools');
  var _ = require('lodash')

  /**
   * Service contenant les méthodes communes aux contrôleurs qui répondent en json
   * @service $json
   */
  var $json = {}

  /**
   * Équivalent de context.denied en json
   * @param {Context} context
   * @param msg
   */
  $json.denied = function (context, msg) {
    if (!msg) msg = "Accès refusé"
    context.status = 403;
    $json.sendError(context, msg)
  }

  /**
   * Équivalent de context.notFound en json
   * @param {Context} context
   * @param {string}  msg
   */
  $json.notFound = function (context, msg) {
    if (!msg) msg = "Contenu inexistant"
    context.status = 404;
    $json.sendError(context, msg)
  }

  /**
   * Callback générique de sortie json
   * @param {Context} context
   * @param {string|string[]|Error} error
   * @param data
   */
  $json.send = function (context, error, data) {
    if (error) {
      // on logge l'erreur si s'en est vraiment une (pas les strings simples)
      if (error.stack) {
        log.error(error)
        error = error.toString()
      } else if (_.isArray(error)) {
        error = error.join(", ")
      }
      $json.sendError(context, error)
    } else {
      if (!data) data = {success:true}
      log.debug('$json.send va renvoyer', data, 'api')
      // pas la peine de faire le stringify pour rien, on teste avant
      // if (log.perf.out) log.perf(context.response, 'jsonSentLength ' +tools.stringify(data).length, true)
      // commenté car Content-Length dispo dans le onFinish, sauf 204 et 304 (logique)
      context.json(data)
    }
  }

  /**
   * Envoie un message d'erreur {success:false, error: errorMessage}
   * @param {Context}      context
   * @param {Error|string} error
   */
  $json.sendError = function (context, error) {
    if (error && error instanceof Error) {
      log.error(error)
      error = error.toString()
    }
    log.debug("$json va renvoyer l'erreur " +error, 'api')
    context.json({success:false, error: error})
  }

  /**
   * Callback générique de sortie json avec {success:true}, et d'éventuelles autres data
   * @param {Context} context
   * @param {object} [data] des données à ajouter au {success:true}
   * @param data
   */
  $json.sendOk = function (context, data) {
    var reponse = {success:true}
    if (data) tools.merge(reponse, data)
    context.json(reponse)
  }

  return $json
}
