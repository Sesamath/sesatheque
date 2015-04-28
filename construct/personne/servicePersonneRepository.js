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
 * Init de notre service $personneRepository avec ses dépendances en argument
 *
 * @param Personne
 * @param Groupe
 * @param $cachePersonne
 * @param $cacheGroupe
 * @returns {$personneRepository}
 */
module.exports = function (Personne, Groupe, $cachePersonne, $cacheGroupe) {
  /**
   * Service d'accès aux personnes, utilisé par les différents contrôleurs
   * @namespace $personneRepository
   */
  var $personneRepository = {}

  /**
   * Récupère une personne (en cache ou en bdd)
   * @param oid Id de la personne (à priori dans son référentiel, donc ≠ oid)
   * @param next
   */
  $personneRepository.load = function (oid, next) {
    log.debug('load ' + oid)
    $cachePersonne.get(oid, function (error, personneCached) {
      if (personneCached) next(null, personneCached)
      else {
        Personne.match('oid').equals(oid).grabOne(function (error, personne) {
          //log.debug('personne load remonte ', personne)
          if (error) next(error)
          else if (personne) {
            $cachePersonne.set(personne)
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
    $cacheGroupe.getByNom(groupeNom, function (error, groupe) {
      if (groupe) return next(null, groupe)
      Groupe.match('nom').equals(groupeNom).grabOne(function (error, groupe) {
        if (error) return next(error)
        if (groupe) {
          $cacheGroupe.set(groupe)
          return next(null, groupe)
        }
        next(null, null)
      })
    })
  }

  /**
   * Récupère un groupe d'après son oid (si erreur on la log)
   * @param {int} oid
   * @param {EntityInstance~StoreCallback} next
   */
  $personneRepository.loadGroupe = function (oid, next) {
    if (parseInt(oid, 10) !== oid) return next(new Error("Type mismatch, groupe.oid doit être entier"))
    $cacheGroupe.get(oid, function (error, groupe) {
      if (groupe) return next(null, groupe)
      Groupe.match('oid').equals(oid).grabOne(function (error, groupe) {
        if (error) log.error(error)
        if (groupe) {
          $cacheGroupe.set(groupe)
        }
        next(error, groupe)
      })
    })
  }

  return $personneRepository
}
