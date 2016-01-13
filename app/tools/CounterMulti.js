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
 * Une série de compteurs, chaque clé étant un compteur pouvant être incrémenté, décrémenté ou supprimé
 * @constructor
 */
function CounterMulti() {
  /**
   * Le nombre de clés
   * @type {number}
   */
  this.length = 0
}

/**
 * Incrémente une clé (la créé si elle n'existait pas)
 * @param key
 */
CounterMulti.prototype.inc = function (key) {
  if (this.hasOwnProperty(key)) this[key]++
  else {
    this[key] = 1
    this.length++
  }
}

/**
 * Décrémente une clé (et la crée si elle n'existait pas)
 * @param key
 */
CounterMulti.prototype.dec = function (key) {
  if (this.hasOwnProperty(key)) this[key]--
  else {
    this[key] = -1
    this.length++
  }
}

/**
 * Efface une clé
 * @param key
 */
CounterMulti.prototype.delete = function (key) {
  if (this.hasOwnProperty(key)) delete this[key]
  this.length--
}

/**
 * Renvoie le total de tous les compteurs
 * @returns {number}
 */
CounterMulti.prototype.total = function () {
  var total = 0
  for (var key in this) {
    if (this.hasOwnProperty(key) && key !== 'length') total += this[key]
  }
  return total
}

/**
 * Recalcule la propriété length (si on a ajouté des propriétés manuellement)
 * @returns {number}
 */
CounterMulti.prototype.resetLength = function () {
  this.length = Object.keys(this).length -1
  return this.length
}

module.exports = CounterMulti