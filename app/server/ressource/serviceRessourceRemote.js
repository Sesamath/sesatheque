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
const {exists, getBaseIdFromRid, getBaseUrl} = require('sesatheque-client/src/sesatheques')

const appConfig = require('../config')
const myBaseId = appConfig.application.baseId
const tokens = {}
appConfig.sesatheques.forEach(({baseId, apiToken}) => {
  if (baseId && apiToken) tokens[baseId] = apiToken
})

/**
 * Service d'accès aux ressources d'autres sesatheques
 * @service $ressourceRemote
 * @requires $ressourceRepository
 */

module.exports = function (component) {
  component.service('$ressourceRemote', function () {
    /**
     * Appelle registerListener pour ajouter ou virer des listener
     * @param {string} action add|delete
     * @param {string[]} rids liste de rid (qui doivent tous être sur la même baseId)
     * @param next
     */
    function registerCall (action, rids, next) {
      try {
        // on prend la baseId du 1er rid fourni
        const baseId = getBaseIdFromRid(rids[0])
        if (baseId === myBaseId) return next(new Error('inutile de s’enregistrer pour une modif locale'))
        if (!exists(baseId)) return next(new Error(`Sésathèque ${baseId} inconnue`))
        if (!tokens[baseId]) return next(new Error(`pas de token en configuration pour ${baseId}`))
        if (rids.some(rid => getBaseIdFromRid(rid) !== baseId)) return next(new Error(`Tous les rids fournis ne sont pas sur ${baseId}`))
        // on peut appeler
        const baseUrl = getBaseUrl(baseId)
        var options = {
          uri: `${baseUrl}api/ressource/registerListener`,
          headers: {'X-ApiToken': encodeURIComponent(tokens[baseId])},
          gzip: true,
          json: true,
          body: {action: action, baseId: myBaseId, rids},
          timeout: 3000
        }
        request.post(options, function (error, response, result) {
          if (error) return next(error)
          if (response.statusCode === 200 && result && result.success) {
            if (result.warnings) log.dataError(`Warnings à l’appel de ${options.uri}`, result.warnings)
            return next()
          }
          if (result && result.error) return next(new Error(result.error))
          // si on est toujours là y'a un pb…
          log.error(new Error(`réponse inattendue sur ${options.uri}, status ${response.statusCode}`), result)
          next(new Error(`réponse invalide, la modification des listener sur ${baseId} a probablement échouée`))
        })
      } catch (error) {
        next(error)
      }
    }

    /**
     * Enregistre un listener pour être prévenu (call sur updateArbre)
     * @param {string[]} rids liste de rid (qui doivent tous être sur la même baseId)
     * @param next
     */
    function register (rids, next) {
      registerCall('add', rids, next)
    }

    /**
     * Supprime un listener
     * @param {string[]} rids liste de rid (qui doivent tous être sur la même baseId)
     * @param next
     */
    function unregister (rids, next) {
      registerCall('remove', rids, next)
    }

    /**
     * Demande une mise à jour des arbres distants en envoyant une ref qui a changé ici
     * @memberOf $ressourceRemote
     * @param {string} baseId
     * @param {Ref} ref
     * @param {simpleCallback} next
     */
    function externalUpdate (baseId, ref, next) {
      if (baseId === myBaseId) return next(new Error('$ressourceRemote.externalUpdate ne gère pas les ressources locales'))
      if (!exists(baseId)) return next(new Error(`Sésathèque ${baseId} inconnue`))
      if (!tokens[baseId]) return next(new Error(`pas de token en configuration pour ${baseId}`))
      if (!ref || !ref.aliasOf) return next(new Error('ref invalide'))
      try {
        const baseUrl = getBaseUrl(baseId)
        var options = {
          uri: `${baseUrl}api/ressource/externalUpdate`,
          headers: {'X-ApiToken': encodeURIComponent(tokens[baseId])},
          gzip: true,
          json: true,
          body: {ref},
          timeout: 3000
        }
        request.post(options, function (error, response, result) {
          if (error) return next(error)
          if (response.statusCode === 200 && result && result.success) return next()
          if (result && result.error) return next(new Error(result.error))
          // si on est toujours là y'a un pb…
          log.error(new Error(`réponse inattendue sur ${options.uri}, status ${response.statusCode}`), result)
          next(new Error(`réponse invalide, la mise à jour des arbres contenant ${ref.aliasOf} sur ${baseId} a probablement échouée`))
        })
      } catch (error) {
        next(error)
      }
    }

    return {
      externalUpdate,
      register,
      unregister
    }
  })
}
