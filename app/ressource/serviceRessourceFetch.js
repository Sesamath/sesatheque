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

const _ = require('lodash')
const request = require('request')
const sesatheques = require('sesatheque-client/src/sesatheques.js')
const {getBaseUrl, getRidComponents} = sesatheques

const appConfig = require('../config')
const myBaseId = appConfig.application.baseId

/**
 * Service d'accès aux ressources d'autres sesatheques
 * @service $ressourceFetch
 * @requires $ressourceRepository
 */

module.exports = function serviceRessourceFetchFactory ($ressourceRepository) {
  /**
   * Renvoie une ressource récupérée ailleurs (sans son oid pour éviter les accidents)
   * @memberOf $ressourceFetch
   * @param {string} rid
   * @param {ressourceCallback} next
   */
  function fetch (rid, next) {
    try {
      const [baseId, oid] = getRidComponents(rid)
      if (baseId === myBaseId) return $ressourceRepository.load(oid, next)
      const baseUrl = getBaseUrl(baseId)
      var options = {
        uri: baseUrl + 'api/public/' + oid,
        gzip: true,
        json: true,
        timeout: 3000
      }
      let apiToken
      _.each(appConfig.sesatheques, (s) => {
        if (appConfig.sesatheques[s].apiToken) {
          apiToken = appConfig.sesatheques[s].apiToken
          return false
        }
      })
      if (apiToken) {
        options.uri = baseUrl + 'api/ressource/' + oid
        options.headers = {'X-ApiToken': apiToken}
      }
      request(options, function (error, response, ressource) {
        if (error) return next(error)
        if (response.statusCode === 200 && ressource) {
          if (ressource.error) return next(new Error(ressource.error))
          // sinon on vire oid avant de passer au suivant
          delete ressource.oid
          return next(null, ressource)
        }
        next(new Error(`Aucune ressource ${rid}`))
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Renvoie une ressource originale récupérée ailleurs (sans son oid pour éviter les accidents),
   * fait une 2e requête si aliasOf est lui-même un alias mais passe une erreur si la 2e est encore un alias
   * @memberOf $ressourceFetch
   * @param {string} rid
   * @param {ressourceCallback} next
   */
  function fetchOriginal (aliasOf, next) {
    fetch(aliasOf, function (error, ressource) {
      if (error) return next(error)
      if (ressource && ressource.aliasOf) {
        // si c'est un alias on recommence, mais une seule fois (trop risqué de mettre du récursif ici)
        log.errorData(`alias d’alias (${aliasOf} => ${ressource.aliasOf})`)
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
    fetchOriginal
  }
}
