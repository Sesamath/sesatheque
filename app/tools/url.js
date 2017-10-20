/**
 * This file is part of SesaXXX.
 *   Copyright 2014-2015, Association Sésamath
 *
 * SesaXXX is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * SesaXXX is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with SesaReactComponent (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de SesaReactComponent, créée par l'association Sésamath.
 *
 * SesaXXX est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * SesaXXX est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que SesaQcm
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */
'use strict'
// on pourrait se débrouiller avec https://nodejs.org/dist/latest-v8.x/docs/api/url.html
// mais c'est plus simple avec
// @see https://nodejs.org/dist/latest-v8.x/docs/api/querystring.html
// (et on préfère son comportement sur les params multiples)
const querystring = require('querystring')

// fonctions privées

/**
 * throw ou console.error suivant isStrict et retourne value
 * @private
 * @param {string} errorMessage
 * @param {boolean|object} isStrict
 * @param {boolean} [isStrict.strict]
 * @param {string} [value='']
 * @return {string} value
 * @throws {Error} si isStrict
 */
function errorHandler (errorMessage, isStrict, value = '') {
  if (typeof isStrict === 'object') {
    isStrict = isStrict.hasOwnProperty('strict') ? !!isStrict.strict : true
  }
  if (isStrict) throw new Error(errorMessage)
  console.error(new Error(errorMessage))
  return value
}

// fonctions exportées

/**
 * Retourne un paramètre d'une url
 * @param {string} url
 * @param {string} name
 * @param {object} [options]
 * @param {boolean} [options.strict=true] Passer false pour ne pas planter sur des erreurs d'arguments
 * @return {string|string[]|undefined} Si une seule valeur retourne une string, sinon un Array
 */
function getParam (url, name, options) {
  if (!url) return errorHandler('Pas d’url fournie', options)
  if (typeof url !== 'string') return errorHandler('Url fournie invalide', options)
  const [, qs] = split(url)
  const params = querystring.parse(qs) // renvoie toujours un object
  return params[name]
}

/**
 * Retourne tous les paramètres sous forme d'objet
 * @param {string} url absolue ou relative
 * @param {object} [options]
 * @param {boolean} [options.strict=true] Passer false pour ne pas planter sur des erreurs d'arguments
 * @return {object}
 */
function getAllParams (url, options) {
  if (!url) return errorHandler('Pas d’url fournie', options)
  if (typeof url !== 'string') return errorHandler('Url fournie invalide', options)
  const [, qs] = split(url)
  return querystring.parse(qs)
}

/**
 * Réuni les morceaux d'une url
 * @param {urlParts} parts
 * @return {string}
 */
function join (parts) {
  let url = parts[0]
  if (parts[1]) url += `?${parts[1]}`
  if (parts[2]) url += `#${parts[2]}`
  return url
}

/**
 * Découpe l'url en 3 morceaux
 * @param {string} url
 * @return {urlParts}
 */
function split (url) {
  if (!url || typeof url !== 'string') return ['', '', '']
  let base, qs
  let [start, anchor] = url.split('#') // si y'a plusieurs # on ignore la fin
  if (start) [base, qs] = start.split('?') // idem
  if (!base) base = ''
  if (!qs) qs = ''
  if (!anchor) anchor = ''
  return [base, qs, anchor]
}

/**
 * Retourne url modifiée pour lui ajouter / mettre à jour des arguments en queryString
 * @param {string} url
 * @param {object} args
 * @param {object} [options]
 * @param {boolean} [options.replace=false] Pour remplacer la querySting avec args (et pas update)
 * @param {boolean} [options.strict=true] Passer false pour ne pas planter sur des erreurs d'arguments
 * @return {string}
 */
function update (url, args, options) {
  if (typeof options !== 'object') options = {}
  const isStrict = options.hasOwnProperty('strict') ? options.strict : true
  // checks
  if (!url) return errorHandler('Pas d’url fournie', isStrict)
  if (typeof url !== 'string') return errorHandler('Url fournie invalide', isStrict)
  if (!args) return url
  if (typeof args !== 'object') return errorHandler('url.update veut un objet en 2e argument', isStrict, url)
  // args ok mais rien à faire
  if (!Object.keys(args).length) return url
  // faut analyser
  const [base, qs, anchor] = split(url)
  if (options.replace || !qs) return join([base, querystring.stringify(args), anchor])
  // faut un merge
  const oldParams = querystring.parse(qs)
  const allParams = Object.assign(oldParams, args)
  return join([base, querystring.stringify(allParams), anchor])
}

module.exports = {
  getParam,
  getAllParams,
  join,
  split,
  update
}

/**
 * 3 morceaux d'une url
 * @typedef {string[]} urlParts
 * @property {string} urlParts[0] base
 * @property {string} urlParts[1] queryString
 * @property {string} urlParts[2] anchor
 */
