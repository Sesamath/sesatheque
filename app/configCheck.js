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
const sesatheques = require('sesatheque-client/src/sesatheques')

module.exports = function configCheck (config) {
  const appLog = require('an-log')(config.application.name)
  appLog('config check')
  /**
   * Vérif des infos obligatoires
   */
  // baseId et baseUrl
  ;[ 'baseId', 'baseIdRegistrar', 'baseUrl' ].forEach((p) => {
    if (!config.application[p]) throw new Error(`config.application.${p} est obligatoire`)
  })
  if (!config.sesatheques) throw new Error('config.sesatheques est obligatoire')
  const baseId = config.application.baseId
  const baseUrl = config.application.baseUrl
  // on ajoute notre baseId à la liste des sesatheques si ce n'est pas encore le cas
  if (!config.sesatheques.find(s => s.baseId === baseId)) {
    config.sesatheques.push({baseId, baseUrl})
    config.sesathequesById[baseId] = baseUrl
  }
  // on vérifie que baseIdRegistrar connait notre baseId, sinon on le signale
  const baseUrlRegistrar = sesatheques.getBaseUrl(config.application.baseIdRegistrar) + 'api/baseId/' + baseId
  const baseIdRegistrar = config.application.baseIdRegistrar
  const reqOptions = {
    uri: baseUrlRegistrar,
    json: true,
    timeout: 3000
  }
  request(reqOptions, function (error, response, body) {
    if (error) {
      if (error.code === 'ETIMEDOUT') console.error(`${baseUrlRegistrar} n’a pas répondu après 3s, pas de réseau ?`)
      else console.error(error)
      return
    }
    if (response.statusCode === 200 && body) {
      if (body.error) return console.error(`Erreur lors de la vérification de ${baseUrlRegistrar}`, body.error)
      if (body.baseUrl) {
        if (body.baseUrl === config.application.baseUrl) appLog(`baseId correcte sur ${baseIdRegistrar}`)
        else console.error(`${baseIdRegistrar} connait ${baseId} mais avec l'url ${body.baseUrl} au lieu de ${baseUrl}`)
        // console.log('sesatheques', config.sesatheques)
        // console.log('donne', config.sesathequesById)
      } else {
        console.error(`${baseUrlRegistrar} ne donne pas de réponse conforme`, body)
      }
    } else {
      console.error(`${baseUrlRegistrar} ne donne pas de réponse conforme (code ${response.statusCode})`, body)
    }
  })
}
