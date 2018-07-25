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

const {listeMax, listeNbDefault} = require('./config')
const {toAscii} = require('sesajstools')

/**
 * Normalise {skip, limit} et le retourne
 * @param {Object} [options]
 * @param {number} [options.limit]
 * @param {number} [options.skip]
 * @return {{limit: number, skip: number}}
 */
function getNormalizedGrabOptions (options) {
  if (!options || typeof options !== 'object') return {limit: listeNbDefault, skip: 0}
  const grabOptions = {}
  // on peut nous passer des strings
  const limit = Number(options.limit)
  const skip = Number(options.skip)

  grabOptions.limit = (Number.isInteger(limit) && limit > 0 && limit < listeMax) ? limit : listeNbDefault
  grabOptions.skip = (Number.isInteger(skip) && skip >= 0) ? skip : 0

  return grabOptions
}

/**
 * Callback de normalisation de string (utilisé pour l'index du nom d'un groupe)
 * @param {string} nom
 * @param {boolean} [strict=true] passer false pour renvoyer une chaîne vide plutôt que throw en cas de nom invalide
 * @return {string} Le nom sans caractères autres que [a-z0-9]
 * @throws {Error} si strict et nom invalide (pas une string ou retournerait une chaîne vide après normalisation)
 */
function getNormalizedName (nom, strict = true) {
  if (!nom || typeof nom !== 'string' || nom === 'undefined') {
    if (strict) throw Error('nom invalide')
    else return ''
  }
  const cleaned = toAscii(nom.toLowerCase()) // minuscules sans accents
    .replace(/[^a-z0-9]/g, ' ') // sans caractères autres que a-z0-9
    .replace(/  +/g, ' ').trim() // on vire les espaces en double + les éventuels de début et fin
  if (cleaned) return cleaned
  if (strict) throw Error(`nom ${nom} invalide`)
  return ''
}

module.exports = {
  getNormalizedGrabOptions,
  getNormalizedName
}
