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
const sesatheques = require('sesatheque-client/dist/sesatheques')
const {exists, getBaseUrl, getComponents} = sesatheques

const appConfig = require('../config')
const myBaseId = appConfig.application.baseId

/**
 * Service d'accès aux ressources d'autres sesatheques
 * @service $ressourceFetch
 * @requires $ressourceRepository
 */

module.exports = function serviceRessourceFetchFactory ($ressourceRepository) {
  const tokens = {}
  appConfig.sesatheques.forEach((s) => {
    if (s.baseId && s.apiToken) tokens[s.baseId] = s.apiToken
  })

  /**
   * Renvoie une ressource récupérée ailleurs ou ici
   * (Avec oid, attention à ne pas la sauvegarder localement si elle vient d'ailleurs !)
   * @memberOf $ressourceFetch
   * @param {string} rid (une string baseId/origine/idOrigine marche aussi)
   * @param {ressourceCallback} next (renvoie une EntityRessource si c'est local et ses propriétés sinon)
   */
  function fetch (rid, next) {
    try {
      const [baseId, id] = getComponents(rid)
      if (baseId === myBaseId) return $ressourceRepository.load(id, next)
      if (!exists(baseId)) throw new Error(`rid ${rid} invalide ou correspondant à une sesathèque inconnue`)
      const baseUrl = getBaseUrl(baseId)
      var options = {
        uri: baseUrl + 'api/public/' + id,
        gzip: true,
        json: true,
        timeout: 3000
      }
      if (tokens[baseId]) {
        options.uri = baseUrl + 'api/ressource/' + id
        options.headers = {'X-ApiToken': tokens[baseId]}
      }
      request(options, function (error, response, ressource) {
        if (error) return next(error)
        if (response.statusCode === 200 && ressource) {
          if (ressource.error) return next(new Error(ressource.error))
          return next(null, ressource)
        }
        next(new Error(`Aucune ressource ${rid}`))
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
    if (baseId === myBaseId) {
      $ressourceRepository.load(id, send)
    } else if (exists(baseId)) {
      // faut appeler son /api/getRid?id=xxx
      const baseUrl = getBaseUrl(baseId)
      var options = {
        uri: baseUrl + 'api/public/getRid?id=' + id,
        json: true,
        timeout: 3000
      }
      request(options, function (error, response, data) {
        if (error) return next(error)
        if (response.statusCode === 200 && data && data.rid) return next(null, data.rid)
        if (data && data.error) return next(new Error(data.error))
        error = new Error(`${options.uri} ne retourne rien de compréhensible`)
        log.error(error, data)
        next(error)
      })
    } else {
      $ressourceRepository.load(mixedId, send)
    }
  }

  /**
   * Renvoie une ressource originale récupérée ici ou ailleurs.
   * Fait une 2e requête si aliasOf est lui-même un alias mais passe une erreur si la 2e est encore un alias
   * @memberOf $ressourceFetch
   * @param {string} aliasOf
   * @param {ressourceCallback} next
   */
  function fetchOriginal (aliasOf, next) {
    fetch(aliasOf, function (error, ressource) {
      if (error) return next(error)
      if (ressource && ressource.aliasOf) {
        // si c'est un alias on recommence, mais une seule fois (trop risqué de mettre du récursif ici)
        log.dataError(`alias d’alias (${aliasOf} => ${ressource.aliasOf})`)
        fetch(ressource.aliasOf, function (error, ress2) {
          if (error) return next(error)
          if (ress2 && ress2.aliasOf) return next(new Error(`Trop d’alias imbriqués (${aliasOf} => ${ressource.aliasOf} => ${ress2.aliasOf})`))
          if (ress2) return next(null, ress2)
          next(new Error(`Alias ${aliasOf} pointe sur ${ressource.aliasOf} qui n’existe pas`))
        })
      } else if (ressource) {
        next(null, ressource)
      } else {
        next(new Error(`Aucune ressource ${aliasOf}`))
      }
    })
  }

  return {
    fetch,
    fetchOriginal,
    fetchRid
  }
}
