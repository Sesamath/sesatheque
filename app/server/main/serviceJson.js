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
 * @typedef sesathequeJsonResponse
 * @type Object
 * @property {string} message Jamais vide (OK si rien de spécial)
 * @property {Object|undefined} [data] Le contenu de la réponse s'il y en a
 */
/**
 * Service contenant les méthodes communes aux contrôleurs qui répondent en json
 * Il garanti de toujours avoir la propriété message et éventuellement une propriété data
 * @service $json
 */
module.exports = function (component) {
  component.service('$json', function () {
    /**
     * Équivalent json de context.denied (qui renvoie du text/plain en 403), mais renvoie toujours du json,
     * avec une 401 si on est pas authentifié (403 sinon)
     * @param {Context} context
     * @param {string|Error} [message=Authentification requise|Droits insuffisants] (mis dans le log d'erreur si c'est une Error)
     */
    function denied (context, message) {
      if (!$accessControl) $accessControl = lassi.service('$accessControl')
      if ($accessControl.isAuthenticated(context)) {
        context.status = 403
        if (!message) message = 'Droits insuffisants'
      } else {
        context.status = 401
        if (!message) message = 'Authentification requise'
      }
      context.json({message})
    }

    /**
     * Équivalent de context.notFound en json
     * @param {Context} context
     * @param {string}  [message=Ce contenu n’existe pas]
     */
    function notFound (context, message = 'Ce contenu n’existe pas') {
      context.status = 404
      context.json({message})
    }

    /**
     * Callback générique de sortie json
     * @param {Context} context
     * @param {string|string[]|Error} error
     * @param {object} data
     */
    function send (context, error, data) {
      if (error) sendKo(context, error)
      else context.json({message: 'OK', data})
    }

    /**
     * Envoie une réponse 400 en json (log error si c'est une Error)
     * @param {Context} context
     * @param {string|Error} error
     */
    function sendKo (context, error) {
      let message = error
      if (error instanceof Error) {
        log.error(error)
        message = error.toString()
      } else if (typeof error !== 'string') {
        if (error) log.error('erreur invalide', error)
        message = 'Requête invalide'
      }
      // on reformule certains messages
      if (/duplicate key error collection/.test(message)) {
        message =
      }
      context.status = 400
      context.json({message})
    }

    /**
     * Callback générique de sortie json avec {message: 'OK'}, et éventuelles data
     * @param {Context} context
     * @param {object} [data] données à envoyer
     */
    function sendOk (context, data) {
      context.json({message: 'OK', data})
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
