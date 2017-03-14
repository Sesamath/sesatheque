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

var flow = require('an-flow')

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
      if (error) log.error(error)
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
   * Récupère une liste de groupes dont l'oid est gestionnaire
   * @param {number} oid
   * @param {groupeListCallback} next
   * @memberOf $groupeRepository
   */
  $groupeRepository.getListManagedBy = function (oid, next) {
    EntityGroupe.match('gestionnaires').equals(oid).sort('oid').grab(next)
  }

  /**
   * Récupère tous les groupes ouverts
   * @param {groupeCallback} next
   * @memberOf $groupeRepository
   */
  $groupeRepository.loadOuvert = function (next) {
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
   * Récupère tous les groupes publics
   * @param {groupeCallback} next
   * @memberOf $groupeRepository
   */
  $groupeRepository.loadPublic = function (next) {
    EntityGroupe.match('public').equals(true).grab(function (error, groupes) {
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
    if (!groupe.nom) {
      var error = new Error('Impossible d’enregistrer un groupe sans nom')
      log.error(error)
      return next(error)
    }
    if (!groupe.store) groupe = EntityGroupe.create(groupe)
    // la mise en cache est dans afterStore de l'entity
    groupe.store(next)
  }

  /**
   * Supprime un groupe (ET modifie les ressources liées)
   * @param {string} groupeName
   * @param {errorCallback} next
   * @memberOf $groupeRepository
   */
  $groupeRepository.delete = function (groupName, next) {
    if (!groupName) {
      var error = new Error('Impossible d’effacer un groupe sans nom')
      log.error(error)
      return next(error)
    }
    // on ne peut pas le mettre en dépendance du controleur, car il est déclaré après nous
    var $ressourceRepository = lassi.service('$ressourceRepository')
    var $personneRepository = lassi.service('$personneRepository')
    // on efface d'abord le groupe des ressources
    flow().seq(function () {
      // log.debug('début suppression du groupe ' + groupName)
      $ressourceRepository.getListe('groupe/' + groupName, {}, this)
    }).seqEach(function (ressource) {
      // log.debug('suppression de groupe, avec la ressource', ressource)
      ressource.groupes = ressource.groupes.filter((groupeNom) => groupeNom !== groupName)
      $ressourceRepository.save(ressource, this)
    }).seq(function () {
      // log.debug('suppression de groupe, personnes')
      $personneRepository.removeGroup(groupName, this)
    }).seq(function () {
      // log.debug('suppression de groupe, groupe')
      // on peut effacer le groupe, au cas où y'en aurait plusieurs du même nom on les cherche tous
      EntityGroupe.match('nom').equals(groupName).grab(function (error, groups) {
        if (error) return next(error)
        if (groups.length === 0) {
          var error2 = new Error('Il y a aucun groupe ' + groupName)
          log.error(error2)
          return next(error2)
        }
        if (groups.length > 1) log.error(new Error('Il y a ' + groups.length + ' groupes ' + groupName))
        flow(groups).seqEach(function (group) {
          var nextGroup = this
          group.delete(function (error) {
            if (error) return next(error)
            nextGroup()
          })
        }).seq(function () {
          // afterStore n'est pas appelé sur un delete, faut gérer le cache
          // mais lui on est sûr qu'il est en un seul exemplaire car il utilise le nom comme clé
          $cacheGroupe.delete(groupName, function (error) {
            if (error) log.error(error)
            // on fait pas suivre l'erreur car y'en a pas eu à la suppression en bdd
            next()
          })
        }).catch(next)
      })
    }).catch(next)
  }

  return $groupeRepository
}
