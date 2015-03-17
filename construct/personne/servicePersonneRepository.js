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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

/**
 * Service d'accès aux personnes, utilisé par les différents contrôleurs
 * @namespace $personneRepository
 */
var $personneRepository = {}

// Les dépendances
var Personne
var Groupe
var $cache
var cacheTTL

/**
 * Récupère une personne (en cache ou en bdd)
 * @param id
 * @param next
 */
$personneRepository.load = function(id, next) {
  log.dev('load ' +id)
  $cache.get('personne_' + id, function(error, personneCached) {
    if (personneCached) next(null, personneCached)
    else {
      Personne.match('id').equals(id).grabOne(function (error, personne) {
        //log.dev('personne load remonte ', personne)
        if (error) next(error)
        else if (personne) {
          $cache.set('personne_' + id, personne, cacheTTL)
          next(null, personne)
        } else {
          next(null, undefined)
        }
      })
    }
  })
}

/**
 * Récupère un groupe d'après son nom
 * @param {string} groupeNom
 * @param {EntityInstance~StoreCallback} next
 */
$personneRepository.loadGroupeByNom = function (groupeNom, next) {
  $cache.get('groupeByNom_' +groupeNom, function (error, groupe) {
    if (groupe) return next(null, groupe)
    Groupe.match('nom').equals(groupeNom).grabOne(function (error, groupe) {
      if (error) return next(error)
      if (groupe) {
        $cache.set('groupe_' +groupe.id, groupe, cacheTTL)
        $cache.set('groupeByNom_' +groupe.nom, groupe, cacheTTL)
        return next(null, groupe)
      }
      next(null, null)
    })
  })
}

/**
 * Récupère un groupe d'après son id (si erreur on la log)
 * @param {int} id
 * @param {EntityInstance~StoreCallback} next
 */
$personneRepository.loadGroupe = function (groupeId, next) {
  if (parseInt(groupeId, 10) !== groupeId) return next(new Error("Type mismatch, groupe.id doit être entier"))
  $cache.get('groupe_' +groupeId, function(error, groupe) {
    if (groupe) return next(null, groupe)
    Groupe.match('id').equals(groupeId).grabOne(function (error, groupe) {
      if (error) log.error(error)
      if (groupe) {
        $cache.set('groupe_' +groupeId, groupe, cacheTTL)
        $cache.set('groupeByNom_' +groupe.nom, groupe, cacheTTL)
      }
      next(error, groupe)
    })
  })
}


/**
 * Init de notre service $personneRepository qui réclame $cache en dépendance
 * @param personneEntity
 * @param groupeEntity
 * @param serviceCache
 * @param {number} ttl Le ttl du cache personne
 * @returns {$personneRepository}
 */
module.exports = function (personneEntity, groupeEntity, cacheService, ttl) {
  Personne = personneEntity
  Groupe = groupeEntity
  $cache = cacheService
  cacheTTL = ttl

  return $personneRepository
}
