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

module.exports = function (component) {
  component.service('$flashMessages', function () {
    /**
     * Un service pour stocker des message en session, en vue de les afficher à la prochaine page html (par le listener beforeTransport)
     * @service $flashMessages
     */
    var $flashMessages = {}

    /**
     * Ajoute un message en session
     * @param {Context} context
     * @param message
     * @param level
     * @memberOf $flashMessages
     */
    $flashMessages.add = function (context, message, level) {
      if (['info', 'warning', 'error'].indexOf(level) < 0) level = 'info'
      if (!context.session.flashMessages) context.session.flashMessages = []
      context.session.flashMessages.push({
        cssClass: level,
        value: message
      })
    }

    /**
     * Retourne les messages en session et les efface
     * @param {Context} context
     * @memberOf $flashMessages
     */
    $flashMessages.getAndPurge = function (context) {
      var data
      if (context.session.flashMessages) {
        data = {
          flashBloc: {
            $view: 'flash',
            messages: context.session.flashMessages
          }
        }
        delete context.session.flashMessages
      }

      return data
    }

    return $flashMessages
  })
}
