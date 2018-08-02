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

let $accessControl

/**
 * Service contenant les méthodes communes aux contrôleurs qui répondent en json
 * @service $json
 */
module.exports = function (component) {
  component.service('$json', function () {
    /**
     * Équivalent json de context.denied (qui renvoie du text/plain en 403), mais renvoie toujours du json,
     * avec une 401 si on est pas authentifié (403 sinon)
     * @param {Context} context
     * @param {string|Error} [msg=Authentification requise|Droits insuffisants] (mis dans le log d'erreur si c'est une Error)
     */
    function denied (context, msg) {
      if (!$accessControl) $accessControl = lassi.service('$accessControl')
      context.status = $accessControl.isAuthenticated(context) ? 403 : 401
      if (!msg) msg = context.status === 401 ? 'Authentification requise' : 'Droits insuffisants'
      sendKo(context, msg)
    }

    /**
     * Équivalent de context.notFound en json
     * @param {Context} context
     * @param {string}  msg
     */
    function notFound (context, msg) {
      if (!msg) msg = 'Ce contenu n’existe pas'
      context.status = 404
      context.restKo(msg)
    }

    /**
     * Callback générique de sortie json
     * @param {Context} context
     * @param {string|string[]|Error} error
     * @param {object} data
     */
    function send (context, error, data) {
      if (error) sendKo(context, error)
      else sendOk(context, data)
    }

    /**
     * Wrapper de context.restKo (qui log message si c'est une Error), renvoie du 200 avec {success: false, message: 'le message d’erreur'}
     * @param {Context} context
     * @param {string|Error} message
     */
    function sendKo (context, message) {
      if (message instanceof Error) {
        log.error(message)
        message = message.toString()
      }
      context.restKo(message)
    }

    /**
     * Callback générique de sortie json avec {success:true}, et d'éventuelles autres data
     * @param {Context} context
     * @param {object} [data] des données à ajouter au {success:true}
     */
    function sendOk (context, data) {
      if (!data) data = {}
      data.success = true
      log.debug('sendOk va renvoyer', data, 'api')
      context.json(data)
    }

    return {
      denied,
      notFound,
      send,
      sendKo,
      sendOk
    }
  })
}
