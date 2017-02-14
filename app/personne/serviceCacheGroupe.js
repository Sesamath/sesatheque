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

// var crypto = require('crypto')
var flow = require('an-flow')
var _ = require('lodash')
var tools = require('../tools')

/**
 * Retourne la clé de cache d'un groupe (memcache est pénible, tools.sanitizeHashKey suffit pas)
 * @private
 * @param {string|Groupe} groupe
 * @returns {string}
 */
function getKey (groupe) {
  var key
  // si on tombait un jour sur une clé sortie de sanitizeHashKey qui plaisait pas à memcache,
  // utiliser un md5 du nom avec
  // key = crypto.createHash('md5').update(data).digest('hex')
  if (_.isString(groupe)) key = 'groupe_' + tools.sanitizeHashKey(groupe)
  else if (groupe && groupe.nom) key = 'groupe_' + tools.sanitizeHashKey(groupe.nom)
  return key
}

module.exports = function ($cache, $settings) {
  var ttl = $settings.get('components.personne.cacheTTL', 20 * 60)

  /**
   * Service helper de $personneRepository
   * Chaque groupe est mis en cache deux fois, par son nom et son oid
   * (vu la taille d'un groupe pas rentable de passer par nom => id)
   * @service $cacheGroupe
   */
  var $cacheGroupe = {}

  /**
   * Récupère un groupe dans le cache, d'après son nom
   * @param {string} nom
   * @param {groupeCallback} next
   * @memberOf $cacheGroupe
   */
  $cacheGroupe.get = function (nom, next) {
    var key = getKey(nom)
    if (key) $cache.get(key, next)
    else next(new Error('Nom de groupe vide'))
  }
  /**
   * Met un groupe en cache
   * @param {Groupe} groupe
   * @param {errorCallback} [next]
   * @memberOf $cacheGroupe
   */
  $cacheGroupe.set = function (groupe, next) {
    if (groupe && groupe.nom) {
      // ça plante sur certains noms, try/catch sert à rien car async
      const key = getKey(groupe)
      flow().seq(function () {
        $cache.set(key, groupe, ttl, this)
      }).seq(function () {
        if (next) next()
      }).catch(function (error) {
        log.error('le $cache.set a planté avec la clé ' + key, error)
        // pb de clé, tant pis, ça sera pas en cache (pas de risque d'avoir une ancienne
        // version foireuse car c'est la la clé qui plante)
        if (next) next()
      })
    } else {
      var error = new Error('Groupe invalide')
      log.error(error, groupe)
      if (next) next(error)
    }
  }

  /**
   * Efface un groupe du cache
   * @param {string|Groupe} groupe (l'objet ou son nom)
   * @param {errorCallback} next
   * @memberOf $cacheGroupe
   */
  $cacheGroupe.delete = function (groupe, next) {
    var key = getKey(groupe)
    if (key) $cache.delete(key, next)
    else next(new Error('groupe invalide'))
  }

  return $cacheGroupe
}
