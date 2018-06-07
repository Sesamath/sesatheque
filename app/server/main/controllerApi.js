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
const {checkSesalab} = require('../configCheck')
const configCheckSesatheques = require('../configCheckSesatheques')

module.exports = function controllerFactory (component) {
  component.controller(function apiCheckSesalabConfigController () {
    /**
     * Retourne la baseUrl d'une baseId
     * @route GET /api/baseId/:id
     */
    this.get('/api/baseId/:id', function (context) {
      const baseId = context.arguments.id
      const baseUrl = getBaseUrl(baseId, false)
      if (baseUrl) context.rest({baseUrl})
      else context.restKo({error: `Sésathèque ${baseId} inconnue sur ${config.application.baseUrl}`})
    })

    /**
     * Valide la configuration d'un sesalab
     * Si tout est bon, retournera {success: true, baseId: 'laBaseId assignée au sesalab appelant'}
     * sinon un {success: false, errors: ['error 1', …]}
     * @route POST /api/checkSesalabConfig
     */
    this.post('/api/checkSesalabConfig', function (context) {
      const {baseUrl, sesatheques} = context.post
      const {baseId, errors} = checkSesalab(baseUrl, sesatheques)
      if (errors.length) return context.restKo({errors})
      context.rest({baseId})
    })

    /**
     * Valide la configuration d'une sésatheque (qui nous envoie ses sesatheques et sesalabs)
     * @route POST /api/checkSesatheques
     */
    this.post('/api/checkSesatheques', function (context) {
      const {sesalabs, sesatheques} = context.post
      const errors = configCheckSesatheques(sesatheques)
      // pour les sesalab, on vérifie juste que si on en a en commun ils ont la même baseUrl
      if (Array.isArray(sesalabs)) {
        const mySesalabsById = {}
        const mySesalabsByUrl = {}
        config.sesalabs.forEach(({baseId, baseUrl}) => {
          mySesalabsById[baseId] = baseUrl
          mySesalabsByUrl[baseUrl] = baseId
        })
        sesalabs.forEach(({baseId, baseUrl}) => {
          const myUrl = mySesalabsById[baseId]
          const myId = mySesalabsByUrl[baseUrl]
          if (myUrl && myUrl !== baseUrl) errors.push(`Le sesalab ${baseId} est connu ici avec ${myUrl} et pas ${baseUrl}`)
          if (myId && myId !== baseId) errors.push(`Le sesalab ${baseUrl} est connu ici sous ${myId} et pas ${baseId}`)
        })
      } else {
        errors.push('paramètres incorrects, sesalabs doit être un Array')
      }

      if (errors.length) return context.restKo({errors})
      context.rest({message: 'Configuration OK'})
    })
  })
}
