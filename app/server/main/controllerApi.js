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
const {getBaseUrl} = require('sesatheque-client/src/sesatheques')
const config = require('../config')
const {checkSesalab, checkSesatheque} = require('../checkConfig')

module.exports = function mainApiControllersFactory (component) {
  component.controller('api', function mainApiControllers ($session) {
    /**
     * Retourne la baseUrl d'une baseId de sesatheque
     * (connue par configuration ou déclarée ici par un client)
     * @route GET /api/baseId/:id
     */
    this.get('baseId/:id', function (context) {
      const baseId = context.arguments.id
      const baseUrl = getBaseUrl(baseId, false)
      if (baseUrl) context.rest({baseUrl})
      else context.restKo({error: `Sésathèque ${baseId} inconnue sur ${config.application.baseUrl}`})
    })

    /**
     * Valide la configuration d'un sesalab
     * Si tout est bon, retournera {success: true, baseId: 'laBaseId assignée au sesalab appelant'}
     * sinon un {success: false, errors: ['error 1', …]}
     * @route POST /api/checkSesalab
     */
    this.post('checkSesalab', function (context) {
      const {baseUrl, sesatheques} = context.post
      const {baseId, errors, warnings} = checkSesalab(baseUrl, sesatheques)
      if (errors.length) return context.restKo({errors, warnings})
      context.rest({message: 'Configuration sesalab OK', baseId, warnings})
    })

    /**
     * Valide la configuration d'une sésatheque (qui nous envoie ses sesatheques et sesalabs)
     * @route POST /api/checkSesatheque
     */
    this.post('checkSesatheque', function (context) {
      const {errors, warnings} = checkSesatheque(context.post)
      if (errors.length) context.restKo({errors, warnings})
      else context.rest({message: 'Configuration sésathèque OK', warnings})
    })
  })
}
