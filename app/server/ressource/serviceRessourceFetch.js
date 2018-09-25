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
const {exists, getBaseUrl, getComponents} = require('sesatheque-client/dist/server/sesatheques')

const appConfig = require('../config')
const myBaseId = appConfig.application.baseId
const tokens = {}
appConfig.sesatheques.forEach(({baseId, apiToken}) => {
  if (baseId && apiToken) tokens[baseId] = apiToken
})

/**
 * Service d'accès aux ressources d'autres sesatheques
 * @service $ressourceFetch
 * @requires $cache
 * @requires $ressourceRepository
 */

module.exports = function (component) {
  component.service('$ressourceFetch', function ($cache, $ressourceRepository) {
    /**
     * Renvoie une ressource récupérée ailleurs ou ici (ça peut être un alias)
     * @memberOf $ressourceFetch
     * @param {string} rid (une string baseId/origine/idOrigine marche aussi)
     * @param {ressourceCallback} next (renvoie une EntityRessource si c'est local et ses propriétés sinon)
     */
    function fetch (rid, next) {
      try {
        const [baseId, id] = getComponents(rid)
        if (baseId === myBaseId) {
          return $ressourceRepository.load(id, function (error, ressource) {
            if (error) next(error)
            else if (ressource) next(null, ressource)
            else next(new Error(`Aucune ressource ${rid}`))
          })
        }
        // pas chez nous
        if (!exists(baseId)) return next(new Error(`rid ${rid} invalide ou correspondant à une sesathèque inconnue`))
        // on peut aller chercher ça
        const baseUrl = getBaseUrl(baseId)
        const options = {
          uri: baseUrl + 'api/public/' + id,
          gzip: true,
          json: true,
          timeout: 3000
        }
        if (tokens[baseId]) {
          options.uri = baseUrl + 'api/ressource/' + id
          options.headers = {'X-ApiToken': encodeURIComponent(tokens[baseId])}
        }
        request(options, function (error, response, body) {
          if (error) return next(error)
          if (response.statusCode === 200) {
            if (body.data && body.data.rid) return next(null, body.data)
          } else if (body.message) {
            next(Error(body.message))
          } else {
            log.error(`Réponse incohérente sur ${options.uri}`, body)
            next(Error('Réponse incohérente, impossible de récupérer la ressource'))
          }
        })
      } catch (error) {
        next(error)
      }
    }

    /**
     * Passe un rid à next
     * @param mixedId un oid ou baseId/oid ou baseId/origine/idOrigine ou origine/idOrigine
     * @param next appelé avec (error, rid)
     */
    function fetchRid (mixedId, next) {
      function send (error, ressource) {
        if (error) next(error)
        else if (ressource) next(null, ressource.rid)
        else next(new Error(`aucune ressource ${mixedId}`))
      }

      const [baseId, id] = getComponents(mixedId)
      if (baseId === myBaseId) return $ressourceRepository.load(id, send)
      if (!exists(baseId)) return $ressourceRepository.load(mixedId, send)
      // c'est un rid externe, faut appeler son /api/getRid?id=xxx
      const baseUrl = getBaseUrl(baseId)
      const options = {
        uri: baseUrl + 'api/public/getRid?id=' + id,
        json: true,
        timeout: 3000
      }
      request(options, function (error, response, body) {
        if (error) return next(error)
        if (response.statusCode === 200 && body.data && body.data.rid) return next(null, body.data.rid)
        if (body && body.message) return next(Error(body.message))
        // bizarre…
        log.error(`Réponse incohérente sur ${options.uri}`, body)
        next(Error('Réponse incohérente, impossible de récupérer la ressource'))
      })
    }

    /**
     * Renvoie une ressource récupérée ici ou ailleurs, en allant chercher l'original si rid remonte un alias.
     * Passe une erreur si la 2e ressource récupérée est encore un alias
     * (un alias d'alias ne devrait pas exister)
     * @memberOf $ressourceFetch
     * @param {string} aliasOf
     * @param {ressourceCallback} next
     */
    function fetchOriginal (aliasOf, next) {
      fetch(aliasOf, function (error, ressource) {
        if (error) return next(error)
        if (ressource.aliasOf) {
          // si c'est un alias on recommence, mais une seule fois (trop risqué de mettre du récursif ici)
          log.dataError(`alias d’alias (${aliasOf} => ${ressource.aliasOf})`)
          fetch(ressource.aliasOf, function (error, ress2) {
            if (error) return next(error)
            // on a toujours une erreur ou une ressource
            if (ress2.aliasOf) return next(Error(`Trop d’alias imbriqués (${aliasOf} => ${ressource.aliasOf} => ${ress2.aliasOf})`))
            next(null, ress2)
          })
        } else {
          next(null, ressource)
        }
      })
    }

    /**
     * Récupère le contenu d'une url externe
     * @param url {string}
     * @param context {Context}
     */
    function fetchURL (url, context) {
      const options = {
        url,
        timeout: 5000,
        gzip: true
      }
      const cacheKey = `copy${encodeURIComponent(url)}`

      function sendRaw (page) {
        const options = {}
        if (page.contentType) options.headers = {'Content-Type': page.contentType}
        context.raw(page.body, options)
      }

      $cache.get(cacheKey, (error, page) => {
        if (error) console.error(error)
        if (page) return sendRaw(page)

        request(options, (error, response, body) => {
          if (error || response.statusCode !== 200) {
            if (error) log.error(error)
            else log.error(Error(`Réponse ${response.statusCode} sur ${url}`))
            return context.plain('Impossible de récupérer la page ' + url)
          }

          // on met ça en cache pendant 10min
          const page = {
            body,
            contentType: response.headers['content-type']
          }
          $cache.set(cacheKey, page, 600, (error) => {
            if (error) log.error(error)
          })

          sendRaw(page)
        })
      })
    }

    return {
      fetch,
      fetchOriginal,
      fetchRid,
      fetchURL
    }
  })
}
