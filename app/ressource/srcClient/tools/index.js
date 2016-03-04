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

/**
 * Module de base pour les méthodes addCss, addElement, getElement, addError, hideTitle
 * et log (qui ne fait rien sauf si on appelle init avec options.verbose à true), log.error affiche toujours
 */
'use strict'

// on ajoute du forEach sur les Array si le navigateur connait pas
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (fn) { // jshint ignore:line
    for (var i = 0; i < this.length; i++) {
      // on passe en argument (eltDuTableau, index, tableau)
      fn(this[i], i, this)
    }
  }
}

var log = require('./log')

/**
 * Notre module pour toutes nos fonctions génériques
 * @module sesamath
 */
var tools = {}


/**
 * Récupère un paramètre de l'url courante
 * Inspiré de http://stackoverflow.com/a/11582513
 * Attention, les + sont transformés en espace (RFC 1738), les %20 aussi (RFC 3986),
 * pour récupérer des + faut qu'ils soient correctement encodés en %2B
 * @param {string}  name              Le nom du paramètre
 * @param {boolean} [noPlusTransform] Passer true pour conserver les '+' dans le retour,
 *                                      sinon ils seront transformés en espace (un + devrait être encodé %2B)
 * @returns {*} Sa valeur (ou null s'il n'existait pas)
 */
tools.getURLParameter = function (name, noPlusTransform) {
  var regexp = new RegExp('[?|&]' + name + '=([^&#]+?)(&|#|$)')
  var param = regexp.exec(window.location.search)
  if (param) {
    var component = noPlusTransform ? param[1] : param[1].replace(/\+/g, '%20')
    param = decodeURIComponent(component)
  }
  return param
}

/**
 * Retourne true si l'argument est un Array
 * @param arg
 * @returns {boolean}
 */
tools.isArray = function (arg) {
  return (arg instanceof Array)
}

/**
 * Retourne true si l'argument est une fonction
 * @param arg
 * @returns {boolean}
 */
tools.isFunction = function (arg) {
  return (typeof arg === 'function')
}

/**
 * Retourne true si l'argument est une string
 * @param arg
 * @returns {boolean}
 */
tools.isString = function (arg) {
  return (typeof arg === 'string')
}

/**
 * Retourne l'url avec slash de fin
 * @param {string} url
 * @returns {string}
 */
tools.urlAddSlashAdd = function (url) {
  if (typeof url === 'string') {
    if (url.length === 0 || url.substr(-1) !== '/') url += '/'
  } else {
    log.error('slashAdd veut une string, reçu ' +typeof url)
    url = '/'
  }

  return url
}

/**
 * Retourne l'url sans slash de fin
 * @param {string} url
 * @returns {string}
 */
tools.urlTrimSlash = function (url) {
  if (typeof url === 'string') {
    if (url.length > 0 && url.substr(-1) === '/') url = url.substr(0, url.length -1)
  } else {
    log.error('slashRemove veut une string, reçu ' +typeof url)
    url = ''
  }

  return url
}

module.exports = tools
