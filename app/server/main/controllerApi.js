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

const config = require('../config')

module.exports = function controllerFactory (component) {
  component.controller(function apiCheckSesalabConfigController () {
    /**
     * Valide la configuration d'un sesalab
     * Si tout est bon, retournera {success: true, baseId: 'laBaseId assignée au sesalab appelant'}
     * sinon un {success: false, errors: ['error 1', …]}
     * @route POST /api/checkSesalabConfig
     */
    this.post('/api/checkSesalabConfig', function (context) {
      const {baseUrl, sesatheques} = context.post
      // la baseId du sesalab qu'on lui renverra
      let baseId
      const errors = []
      // vérif contenu du post
      if (!baseUrl) errors.push('Requête invalide, baseUrl manquante')
      if (typeof baseUrl !== 'string') errors.push(`baseUrl invalide (${typeof baseUrl})`)
      if (!Array.isArray(sesatheques) || !sesatheques.length) errors.push('Requête invalide, sesatheques manquantes')
      else if (!sesatheques.every(st => st.baseId && st.baseUrl)) errors.push('Requête invalide, chaque sesatheque doit avoir baseId et baseUrl')
      if (errors.length) return context.restKo({errors})
      // vérif que le sesalab annoncé est connu
      config.sesalabs.some(knownSesalab => {
        if (knownSesalab.baseUrl === baseUrl) {
          baseId = knownSesalab.baseId
          return true
        }
      })
      if (!baseId) {
        errors.push(`${baseUrl} n'est pas dans les sesalabs connus de la sesathèque ${config.baseUrl} (${config.baseId})`)
      }

      // vérif que la première sésathèque est la notre
      const myBaseId = config.application.baseId
      const myBaseUrl = config.application.baseUrl
      if (sesatheques[0].baseId !== myBaseId) errors.push(`La première Sésathèque n’a pas la baseId attendue ${sesatheques[0].baseId} ≠ ${myBaseId}`)
      if (sesatheques[0].baseUrl !== myBaseUrl) errors.push(`La première Sésathèque n’a pas la baseUrl attendue ${sesatheques[0].baseUrl} ≠ ${myBaseUrl}`)
      // si y'en a une 2e, vérifier qu'on la connaît
      if (sesatheques[1]) {
        const stBis = sesatheques[1]
        config.sesatheques.some(st => {
          if (stBis.baseId === st.baseId) {
            if (stBis.baseUrl === st.baseUrl) return true
            errors.push(`La sésathèque ${stBis.baseId} est connue mais son url est incorrecte (${stBis.baseUrl} ≠ ${st.baseUrl})`)
          } else if (stBis.baseUrl === st.baseUrl) {
            errors.push(`La sésathèque ${stBis.baseUrl} est connue mais sous une autre baseId (${stBis.baseId} ≠ ${st.baseId})`)
          }
        })
      }

      // on a fini nos vérifications, si y'a pas d'erreurs on renvoie au sesalab son baseId
      if (errors.length) return context.restKo({errors})
      context.rest({baseId})
    })
  })
}
