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

module.exports = function (EntityGroupe, $cacheGroupe) {
  /**
   * Service d'accès aux groupes utilisé par les différents contrôleurs
   * @service $groupeRepository
   */
  var $groupeRepository = {}

  /**
   * Récupère un groupe d'après son nom
   * @param {string} groupeNom
   * @param {groupeCallback} next
   * @memberOf $groupeRepository
   */
  $groupeRepository.load = function (groupeNom, next) {
    $cacheGroupe.get(groupeNom, function (error, groupe) {
      if (groupe) {
        next(null, groupe)
      } else {
        // pas en cache, on va chercher en bdd
        EntityGroupe.match('nom').equals(groupeNom).grabOne(function (error, groupe) {
          if (error) {
            next(error)
          } else if (groupe) {
            $cacheGroupe.set(groupe)
            next(null, groupe)
          } else {
            next()
          }
        })
      }
    })
  }

  /**
   * Récupère tous les groupes ouverts
   * @param {groupeCallback} next
   * @memberOf $groupeRepository
   */
  $groupeRepository.loadOpen = function (next) {
    EntityGroupe.match('ouvert').equals(true).grab(function (error, groupes) {
      if (error) {
        next(error)
      } else if (groupes) {
        next(null, groupes)
      } else {
        next(null, [])
      }
    })
  }

  /**
   * Enregistre une groupe en bdd (et met à jour le cache)
   * @param {EntityGroupe}       groupe
   * @param {entityPersonneCallback} next
   * @memberOf $groupeRepository
   */
  $groupeRepository.save = function (groupe, next) {
    if (!groupe.store) groupe = EntityGroupe.create(groupe)
    groupe.store(function (error, groupe) {
      if (!error && groupe) $cacheGroupe.set(groupe)
      // on passe à next sans attendre le résultat de la mise en cache
      next(error, groupe)
    })
  }

  return $groupeRepository
}
