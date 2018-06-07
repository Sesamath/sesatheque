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

const {addSesatheque, getBaseUrl} = require('sesatheque-client/src/sesatheques')
// Cette fonction ne peut pas être dans le module checkConfig, ça causerait des dépendances cycliques
// checkConfig => config => checkConfigSesatheques (ce module)

/**
 * Vérifie les couples baseId/baseUrl fournis et retourne une liste d'erreurs (vide si y'en a pas)
 * @param {Object[]} sesatheques
 * @return {string[]} la liste des erreurs
 * @private
 */
module.exports = function checkConfigSesatheques (sesatheques, addIfUnknown = false) {
  const errors = []
  if (!Array.isArray(sesatheques)) throw new Error('sesatheques doit être un Array')
  if (!sesatheques.length) throw new Error('sesatheques est vide')
  sesatheques.forEach(({baseId, baseUrl}, index) => {
    if (!baseId) errors.push(`La sésathèque ${index} n’a pas de baseId`)
    if (!baseUrl) errors.push(`La sésathèque ${index} n’a pas de baseUrl`)
    const knownBaseUrl = getBaseUrl(baseId, false)
    if (knownBaseUrl) {
      if (baseUrl !== knownBaseUrl) errors.push(`La sésathèque ${baseId} a la baseUrl ${baseUrl} mais devrait avoir ${knownBaseUrl}`)
    } else {
      if (addIfUnknown) addSesatheque(baseId, baseUrl)
      else errors.push(`La sésathèque ${baseId} est inconnue`)
    }
  })
  return errors
}
