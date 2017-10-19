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
// @see https://nodejs.org/dist/latest-v8.x/docs/api/url.html
const {URL} = require('url')
// @see https://nodejs.org/dist/latest-v8.x/docs/api/querystring.html
const querystring = require('querystring')

/**
 * Retourne url modifiée pour lui ajouter / mettre à jour des arguments en queryString
 * @param {string} url
 * @param {object} args
 * @param {object} [options]
 * @param {boolean} [options.replace] Pour remplacer la querySting avec args (sinon update)
 * @return {string}
 */
function update (url, args, options) {
  if (!args) return url
  if (typeof args !== 'object') throw new TypeError('url.update veut un objet en 2e argument')
  if (typeof options !== 'object') options = {}
  if (!Object.keys(args).length) return url
  const urlObj = new URL(url)
  if (options.replace) {
    urlObj.search = '?' + querystring.stringify(args)
  } else {
    const search = (urlObj.search && urlObj.search.substr(1)) || ''
    const qs = querystring.parse(search)
    urlObj.search = '?' + querystring.stringify(Object.assign(qs, args))
  }
  return urlObj.href
}

module.exports = {
  update
}
