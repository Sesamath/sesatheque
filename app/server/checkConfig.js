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

const request = require('request')
const log = require('sesajstools/utils/log')
const config = require('./config')

const myBaseId = config.application.baseId
const myBaseUrl = config.application.baseUrl
const myApiTokens = config.apiTokens || []

/**
 * Vérifie sesatheque par rapport à notre conf
 * - si c'est nous, vérif baseId + baseUrl Ok (sinon erorr),
 *   et si y'a un apiToken on le vérifie aussi (warning s'il est inconnu)
 * - sinon, si on la connaît on vérifie que c'est sous le même baseId/baseUrl
 * @private
 * @param {{baseId: string, baseUrl: string}} sesatheque La sésathèque à vérifier (on vérifie un éventuel apiToken si c'est notre sésathèque)
 * @param {string[]} errors Un tableau pour y ajouter des erreurs éventuelles
 * @param {string[]} warnings Idem pour des warnings (pb d'apiToken)
 */
function checkSesathequeIsSameHere (sesatheque, errors, warnings) {
  const {baseId, baseUrl, apiToken} = sesatheque
  if (baseUrl === myBaseUrl) {
    if (baseId !== myBaseId) errors.push(`Le sesalab nous connait sous ${baseId} alors qu’on est identifié par ${myBaseId} => ${myBaseUrl}`)
    if (apiToken && !myApiTokens.includes(apiToken)) warnings.push(`Le sesalab utilise un apiToken inconnu de ${myBaseId}`)
  } else if (baseId === myBaseId) {
    if (baseUrl !== myBaseUrl) errors.push(`Le sesalab a déclaré une autre sésathèque (${baseUrl}) avec notre baseId ${myBaseId} => ${myBaseUrl}`)
  } else {
    // on regarde si on la connait
    config.sesatheques.some(st => {
      if (st.baseId === baseId) {
        if (st.baseUrl === baseUrl) return true
        errors.push(`${baseId} est connue ici (${myBaseId}) avec l’url ${st.baseUrl} et non ${baseUrl}`)
      } else if (st.baseUrl === baseUrl) {
        errors.push(`${baseUrl} est connue ici (${myBaseId}) avec la baseId ${st.baseId} et non ${baseId}`)
      }
    })
  }
}

/**
 * Vérification croisée de configuration
 *
 * Ce module fourni les méthodes permettant de vérifier la cohérence des configurations
 * entre sesalabs et sésathèques, en comparant les infos fournies à la configuration locale.
 * Ces méthodes renvoient des promesses, qui rejettent en cas de pb majeur, ou résolvent avec un éventuel tableau de warnings (que le contrôleur devra faire suivre)
 * @module
 * @name checkConfig
 */

/**
 * Valide la config de nos sésathèques externes en allant les interroger (pendant 30s max si elles répondent pas, au delà on résoud avec les pbs en console)
 * @return {Promise<undefined|string[]>} Rejet si la conf locale est défectueuse, ou que le registrar signale un problème. En cas de timeout ou de réponse inattendue du registrar, on résoud en renvoyant des warnings
 */
function checkLocalOnRemote () {
  // On vérifie pendant 10 min (en cas d'update bloquant sur une autre sesathèque)
  const maxWait = 10 * 60 * 1000
  // attente avant l'essai suivant (ms)
  const retryDelay = 5000
  // pas la peine d'attendre une réponse plus longtemps (ms)
  const timeout = 30 * 1000
  const toCheck = {
    sesatheques: config.sesatheques.concat([{baseId: myBaseId, baseUrl: myBaseUrl}]),
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
    if (baseUrl === myBaseUrl) return Promise.resolve(['Inutile de se déclarer soi-même dans config.sesatheques'])
    const reqOptions = {
      uri: `${baseUrl}api/checkSesatheque`,
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
            // on a dépassé le délai max et la sesatheque distante répond toujours pas,
            // => resolve avec warning
            log.error(error)
            const warning = (error.code === 'ETIMEDOUT') ? `${baseUrl} n’a pas répondu après ${Math.round(elapsed / 1000)}s` : `Pb dans la réponse de ${baseUrl}`
            return resolve([warning])
          }
          if (response.statusCode === 200 && body) {
            if (body.success) {
              if (body.message) log(`${reqOptions.uri} a répondu « ${body.message} » pour ${myBaseId}`)
              return resolve(body.warnings)
            }
            if (body.errors) {
              return reject(new Error(`Erreurs lors de la vérification sur ${baseUrl} :\n- ${body.errors.join('\n- ')}`))
            }
            if (body.message) {
              // si !success, message est une erreur
              reject(new Error(body.message))
            }
          }
          // si on est toujours là, la sésathèque ne répond pas de manière attendue,
          // => y'a un pb dans le code
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
 * Valide la config d'un sesalab qui nous appelle en lui retournant son baseId, ou les erreurs (sync)
 * @param {string} baseUrl La baseUrl du sesalab
 * @param {Object[]} sesatheques Ses sésathèques (avec baseId, baseUrl et éventuellement apiToken)
 * @return {{baseId: string, errors: string[]}}
 */
function checkSesalab (baseUrl, sesatheques) {
  const errors = []
  const warnings = []
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
    errors.push(`${baseUrl} n'est pas dans les sesalabs connus de la sesathèque ${myBaseUrl} (${myBaseId})`)
  }

  // vérif des sésathèques, si on connait ça doit être sous la même forme
  sesatheques.forEach((st) => checkSesathequeIsSameHere(st, errors, warnings))

  return {baseId, errors, warnings}
}

/**
 * Valide la config d'une sésathèque distante (vs ce qu'on a en configuration ici)
 * @param sesalabs
 * @param sesatheques
 */
function checkSesatheque ({sesalabs, sesatheques}) {
  const errors = []
  const warnings = []
  // pour les sesalab, on vérifie juste que si on en a en commun ils ont la même baseUrl
  if (sesalabs) {
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
  }
  // pour les sésathèques, si on connait ça doit être sous la même forme
  if (Array.isArray(sesatheques)) {
    sesatheques.forEach((st) => checkSesathequeIsSameHere(st, errors, warnings))
  } else {
    errors.push('paramètres incorrects, sesatheques doit être un Array')
  }

  return {errors, warnings}
}

module.exports = {
  checkLocalOnRemote,
  checkSesalab,
  checkSesatheque
}
