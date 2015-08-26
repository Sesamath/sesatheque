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

module.exports = function (EntityPersonne, EntityGroupe, $cachePersonne, $cacheGroupe) {

  var _ = require('lodash')

  /**
   * Service d'accès aux personnes (et aux groupes), utilisé par les différents contrôleurs
   * @service $personneRepository
   */
  var $personneRepository = {}

  /**
   * Récupère une personne (en cache ou en bdd)
   * @param {string}           origine   Nom du authClient qui a authentifié cette personne
   * @param {string}           idOrigine Id de la personne dans son système d'authentification
   * @param {personneCallback} next      On aura pas d'entity si ça vient du cache
   * @memberOf $personneRepository
   */
  $personneRepository.load = function (origine, idOrigine, next) {
    log.debug('load personne ' + origine +'/' +idOrigine)
    if (origine && idOrigine) {
      $cachePersonne.get(idOrigine, function (error, personneCached) {
        if (personneCached) next(null, personneCached)
        else {
          EntityPersonne.match('origine').equals(origine).match('idOrigine').equals(idOrigine).grabOne(function (error, personne) {
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
    } else {
      next(new Error("origine ou idOrigine manquant, impossible de chercher en base de données."))
    }
  }

  /**
   * Récupère un groupe d'après son nom
   * @param {string} groupeNom
   * @param {groupeCallback} next
   * @memberOf $personneRepository
   */
  $personneRepository.loadGroupeByNom = function (groupeNom, next) {
    $cacheGroupe.getByNom(groupeNom, function (error, groupe) {
      if (groupe) return next(null, groupe)
      EntityGroupe.match('nom').equals(groupeNom).grabOne(function (error, groupe) {
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
   * @param {groupeCallback} next
   * @memberOf $personneRepository
   */
  $personneRepository.loadGroupe = function (oid, next) {
    if (parseInt(oid, 10) !== oid) return next(new Error("Incohérence, groupe.oid doit être entier"))
    $cacheGroupe.get(oid, function (error, groupe) {
      if (groupe) return next(null, groupe)
      EntityGroupe.match('oid').equals(oid).grabOne(function (error, groupe) {
        if (error) log.error(error)
        if (groupe) {
          $cacheGroupe.set(groupe)
        }
        next(error, groupe)
      })
    })
  }

  /**
   * Enregistre une personne en bdd (et met à jour le cache)
   * @param {EntityPersonne}       personne
   * @param {entityPersonneCallback} next
   * @memberOf $personneRepository
   */
  $personneRepository.save = function (personne, next) {
    if (!personne.store) personne = EntityPersonne.create(personne)
    personne.store(function (error, personne) {
      $cachePersonne.set(personne)
      // on passe à next sans attendre le résultat de la mise en cache
      next(error, personne)
    })
  }

  /**
   * Met à jour ou crée une personne
   * @param {Personne} personne
   * @param {personneCallback} next Avec l'argument personne fourni si y'avait rien à mettre à jour (EntityPersonne sinon)
   * @memberOf $personneRepository
   */
  $personneRepository.update = function (personne, next) {

    function checkUpdate(personne, personneNew, next) {
      var needUpdate = false
      for (var prop in personneNew) {
        if (personneNew.hasOwnProperty(prop) && !_.isEqual(personne[prop], personneNew[prop])) {
          needUpdate = true
          personne[prop] = personneNew[prop]
        }
      }
      if (needUpdate) personne.store(next)
      else next(null, personne)
    }

    if (personne.origine && personne.idOrigine) {
      $personneRepository.load(personne.origine, personne.idOrigine, function (error, personneBdd) {
        if (error) {
          next(error)
        } else if (personneBdd) {
          checkUpdate(personneBdd, personne, next)
        } else {
          EntityPersonne.create(personne).store(next)
        }
      })
    } else {
      next(new Error("Il manque l'identifiant de l'origine pour mettre à jour les données de cet utilisateur"))
    }
  }

  return $personneRepository
}
