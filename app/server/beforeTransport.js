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

const {isEmpty} = require('lodash')
const {getHtml: getReactPageHtml} = require('./main/reactPage')

/**
 * Ajoute des infos dans debug.log
 * @private
 * @param context
 * @param data
 */
function debug (context, data) {
  log.debug(
    `beforeTransport sur ${getReqHttp(context)} (${context.contentType}) avec status ${context.status} et les data`,
    data,
    'beforeTransport',
    {max: 1000}
  )
}

/**
 * Retourne la chaine de la requete http (ex : 'GET /path/to/something?args')
 * @private
 * @param context
 * @returns {string}
 */
const getReqHttp = (context) => context.request.method + ' ' + context.request.url

/**
 * Le listener beforeTransport, qui ne gère que les réponses de l'api, tous les autres contrôleurs (html à priori)
 * utilisent context.raw (donc se passent du transport lassi)
 * - gère les erreurs en les formattant
 * - ajoute des infos dans debug.log si on est pas en prod
 * @listens lassi#event:beforeTransport
 * @param {Context} context
 * @param {Object} data L'objet qui sera envoyé au transport
 */
module.exports = function beforeTransport (context, data) {
  // au cas où deux controleurs veuillent envoyer une réponse, on coupe le 2e tout de suite
  // (pas la peine d'appeler le transport qui dira que la réponse est déjà partie)
  if (context.isSent) return log.error(new Error('2e passage dans beforeTransport'))
  context.isSent = true

  // pour options on fait rien, le middleware CORS gère ça
  if (context.request.method === 'OPTIONS') {
    context.status = 200
    return
  }

  const isVide = isEmpty(data)
  const url = context.request.originalUrl // démarre avec un /
  const reqHttp = getReqHttp(context)

  // force json sur /api (en râlant si c'était pas le cas)
  if (url.startsWith('/api/')) {
    if (!context.contentType) {
      // les réponses vides sont des 404, on râle pas dans le log pour ça
      if (!isVide) log.error(Error(`réponse /api/ sans contentType, faut passer par $json ! (${reqHttp})`))
      context.contentType = 'application/json'
    } else if (context.contentType !== 'application/json') {
      log.error(Error(`route /api/ avec un contentType ${context.contentType} (${reqHttp})`))
    }
  }

  const isJson = context.contentType === 'application/json'
  // const isTest = context.contentType === 'application/json' || url.startsWith('/test/')

  // Gestion de l'erreur sur le contexte (lassi ne l'a pas encore fait)
  if (context.error) {
    // erreur 500, sauf si un autre code d'erreur a déjà été précisé
    if (!context.status || context.status < 400) context.status = 500
    // on façonne notre erreur 500
    let errorMsg = context.error.message || context.error
    // on évite le message incompréhensible pour l'utilisateur (le dev ira dans les logs)
    if (errorMsg.startsWith('TypeError')) errorMsg = 'Erreur interne : problème de types incohérents'
    // le reste devrait rester rarissime, on laisse tout pour l'avoir en notification coté client
    // (les utilisateurs joignent parfois les captures d'écran aux signalements)
    else errorMsg = 'Erreur interne : ' + errorMsg

    if (isJson) {
      // si y'avait déjà un message on le laisse intact
      if (!data.message) data.message = errorMsg
    } else {
      // text/plain
      context.contentType = 'text/plain'
      data.content = errorMsg
    }

    // on log
    log.error(`erreur ${context.status} sur ${reqHttp}`, context.error)

    // on vient de le traiter, pas la peine que lassi le fasse aussi
    delete context.error

  // cas aucun contenu
  } else if (isVide) {
    context.status = 404
    if (isJson) {
      log.debug(reqHttp + ' : pas de status ni content => 404')
      data.message = 'Ce contenu n’existe pas'
    } else {
      // toujours la page react
      context.contentType = 'text/html'
      context.transport = 'raw' // sinon le contentType impose le transport avec vues dust
      data.content = getReactPageHtml()
    }

  // sinon ça doit être bon, mais on râle s'il manque la prop message sur le json
  // (sans l'ajouter, c'est au contrôleur de le faire)
  } else if (isJson && !data.message) {
    log.error(Error(`json sans propriété message sur ${reqHttp}`), data)
  }

  // on envoie toutes les réponses dans le log de debug
  if (!global.isProd) debug(context, data)
}
