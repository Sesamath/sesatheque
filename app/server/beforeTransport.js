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
const reactPage = require('./main/displayReactPage')

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
const getReqHttp = (context) => context.request.method + ' ' + context.request.parsedUrl.pathname + (context.request.parsedUrl.search || '')

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
  const reqHttp = getReqHttp(context)
  const isJson = context.contentType === 'application/json' || context.request.originalUrl.substr(0, 5) === '/api/'
  const isVide = isEmpty(data)

  log.debug('beforeTransport sur ' + reqHttp)
  // au cas où deux controleurs veuillent envoyer une réponse, on coupe le 2e tout de suite
  // (pas la peine d'appeler le transport qui dira que la réponse est déjà partie)
  if (context.isSent) return log.error(new Error('2e passage dans beforeTransport'))
  context.isSent = true

  // pour options on fait rien, le middleware CORS gère ça
  if (context.request.method === 'OPTIONS') {
    context.status = 200
    return
  }

  if (!isJson) {
    // si c'est pas du json, vide ou pas on traite ça comme une 404 avec react
    if (!isVide) log.error('On arrive dans beforeTransport avec du contenu non json, la 404 react a été envoyée mais y’a un pb', data)
    context.status = 404
    context.transport = 'raw' // sinon le content-type va imposer le transport html qui veut un template dust
    context.contentType = 'text/html'
    // on peut fixer nos headers directement sur la réponse
    // context.response.append('Content-Length', reactPagelength)
    // mais express ajoute Content-Length lui-même
    data.content = reactPage
    return
  }

  // tout le reste ne concerne que l'api
  context.contentType = 'application/json'

  // Gestion des erreurs (lassi ne l'a pas encore fait)
  if (context.error) {
    // erreurs 500
    log.error('erreur 500 sur ' + reqHttp, context.error)
    context.status = 500
    data.success = false
    // on façonne notre erreur 500
    let errorMsg = context.error.toString()
    // on évite le un message incompréhensible pour l'utilisateur (le dev ira dans les logs)
    if (errorMsg.startsWith('TypeError')) errorMsg = 'Erreur interne : problème de types incohérents'
    else errorMsg = 'Erreur interne : ' + errorMsg

    // @todo passer en data.message une fois le service $json homogénéisé
    if (data.error) data.error += '\n' + errorMsg
    else data.error = errorMsg
    // on vient de le traiter, pas la peine que lassi le fasse aussi
    delete context.error

  // si le contrôleur a déjà formaté une erreur, on s'en occupe pas
  } else if (data.success === false && (data.message || data.error)) {
    return
  } else {
    if (isVide) {
      log.debug(reqHttp + ' : pas de status ni content => 404')
      context.status = 404
    }

    // si y'a un status d'erreur sans message on l'ajoute
    if (context.status > 400 && !data.error && !data.message) {
      log.debug('erreur ' + context.status, data)
      let message
      switch (context.status) {
        case 404:
          message = 'Cette page ou ce fichier n’existe pas'
          break
        case 401:
          message = 'Authentification requise'
          break
        case 403:
          message = 'Droits insuffisants'
          break
        default:
          message = 'Ooops, une erreur ' + context.status + ' est survenue'
      }
      data.success = false
      data.message = message
      // @todo supprimer ça dès que tout le monde ne regardera que message
      data.error = message
    }
  }

  // on envoie toutes les réponses dans le log de debug
  if (!global.isProd) debug(context, data)
}
