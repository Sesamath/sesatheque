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

/**
 * Configuration de l'application
 */
const request = require('request')
const log = require('sesajstools/utils/log')
const config = require('./config')

/**
 * Valide la config de nos sésathèques externes en allant les interroger (pendant 30s max si elles répondent pas, au delà on résoud avec les pbs en console)
 * @return {Promise} Rejet si la conf locale est défectueuse, ou que le registrar signale un problème. En cas de timeout ou de réponse inattendue du registrar, on le note en console mais ça résoud
 */
function checkLocalOnRemote () {
  // On vérifie pendant 30s, sauf en cli ou y'a pas de retry (et on résoud toujours pour pas bloquer une commande)
  const maxWait = 30000
  const retryDelay = 3000
  const timeout = 3000
  const me = {
    baseId: config.application.baseId,
    baseUrl: config.application.baseUrl
  }
  const toCheck = {
    sesatheques: config.sesatheques.concat([me]),
    sesalabs: config.sesalabs
  }

  /**
   * Retourne une promesse (qui rejette si la sésathèque concernée
   * répond avec une erreur au format attendu, résoud sinon)
   * @param {string} baseUrl
   * @return {Promise}
   */
  const checkOne = (baseUrl) => {
    console.log(`checkOne ${baseUrl}`)
    if (baseUrl === me.baseUrl) {
      log.error(new Error('Inutile de se déclarer soi-même dans config.sesatheques'))
      return Promise.resolve()
    }
    const reqOptions = {
      uri: `${baseUrl}api/checkSesatheques`,
      body: toCheck,
      json: true,
      timeout
    }
    const start = Date.now()
    return new Promise((resolve, reject) => {
      function callOnce () {
        request.post(reqOptions, function (error, response, body) {
          // si ça répond ok on résoud,
          // si ça répond avec une erreur au bon format on rejette avec l'erreur,
          // sinon on râle en console mais on résoud
          const elapsed = Date.now() - start
          if (error) {
            if (elapsed < maxWait) return setTimeout(callOnce, retryDelay)
            if (error.code === 'ETIMEDOUT') log.error(`${baseUrl} n’a pas répondu après ${Math.round(elapsed / 1000)}s`)
            else log.error(`Pb dans la réponse de ${baseUrl}`, error)
            return resolve()
          }
          if (response.statusCode === 200 && body) {
            if (body.errors) return reject(new Error(`Erreurs lors de la vérification sur ${baseUrl} :\n  - ${body.errors.join('\n  - ')}`))
            return resolve()
          }
          // si on est toujours là le registrar répond pas de manière attendue
          log.error(new Error(`${baseUrl} ne donne pas de réponse conforme (code ${response.statusCode})`), body)
          resolve()
        })
      }
      callOnce()
    })
  }

  return Promise.all(config.sesatheques.map(({baseUrl}) => checkOne(baseUrl)))
}

/**
 * Valide la config d'un sesalab qui nous appelle en lui retournant son baseId, ou les erreurs
 * @param {string} baseUrl La baseUrl du sesalab
 * @param {Object[]} sesatheques Ses sésathèques (avec baseId, baseUrl et éventuellement apiToken)
 * @return {{baseId: string, errors: string[]}}
 */
function checkSesalab (baseUrl, sesatheques) {
  const errors = []
  // la baseId qu'on va attribuer à ce sesalab
  let baseId
  if (!baseUrl) errors.push('Requête invalide, baseUrl manquante')
  if (typeof baseUrl !== 'string') errors.push(`baseUrl invalide (${typeof baseUrl})`)
  if (!Array.isArray(sesatheques) || !sesatheques.length) errors.push('sesatheques manquantes')
  else if (!sesatheques.every(st => st.baseId && st.baseUrl)) errors.push('chaque sesatheque doit avoir baseId et baseUrl')
  // pas la peine d'aller plus loin si y'a déjà des erreurs
  if (errors.length) return ({errors})
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
  return {baseId, errors}
}

module.exports = {
  checkLocalOnRemote,
  checkSesalab
}
