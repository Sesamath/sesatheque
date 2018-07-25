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

const flow = require('an-flow')
const {getNormalizedName} = require('../lib/normalize')

// on ne peut pas mettre ces services en dépendance de $groupeRepository car ils sont déclarés après
let $ressourceRepository
let $personneRepository

module.exports = function (component) {
  component.service('$groupeRepository', function (EntityGroupe, $cacheGroupe) {
    /**
     * @typedef groupesCallback
     * @param {Error} [error]
     * @param {Groupe[]} groupes
     */

    /**
     * Récupère un groupe d'après son oip
     * @param {string} groupeNom
     * @param {groupeCallback} next
     * @memberOf $groupeRepository
     */
    function load (oid, next) {
      $cacheGroupe.get(oid, function (error, groupe) {
        if (error) return next(error)
        if (groupe) return next(null, groupe)
        // pas en cache, on va chercher en bdd
        EntityGroupe.match('oid').equals(oid).grabOne(function (error, groupe) {
          if (error) return next(error)
          if (!groupe) return next()
          $cacheGroupe.set(groupe)
          next(null, groupe)
        })
      })
    }

    /**
     * Récupère un groupe d'après son nom
     * @param {string} nom
     * @param {groupeCallback} next
     * @memberOf $groupeRepository
     */
    function loadByNom (nom, next) {
      $cacheGroupe.getByNom(nom, function (error, groupe) {
        if (error) log.error(error)
        if (groupe) return next(null, groupe)
        // pas en cache, on va chercher en bdd
        const indexedName = getNormalizedName(nom)
        EntityGroupe.match('nom').equals(indexedName).grabOne(function (error, groupe) {
          if (error) return next(error)
          if (!groupe) return next()
          next(null, groupe)
          $cacheGroupe.set(groupe)
        })
      })
    }

    /**
     * Récupère une liste de groupes
     * @param {string[]} noms
     * @param {groupesCallback} next
     */
    function fetchList (noms, next) {
      let groupes = []
      flow(noms).seqEach(function (nom) {
        $cacheGroupe.getByNom(nom, this)
      }).seq(function (cachedGroups) {
        const missing = []
        cachedGroups.forEach((groupe, index) => {
          if (groupe) groupes.push(groupe)
          else missing.push(noms[index])
        })
        if (!missing.length) return next(null, groupes)
        const indexedNames = missing.map(getNormalizedName)
        EntityGroupe.match('nom').in(indexedNames).grab(this)
      }).seq(function (grps) {
        next(null, groupes.concat(grps))
      }).catch(next)
    }

    /**
     * Récupère une liste de groupes dont le oid fourni est gestionnaire
     * @param {string} oid
     * @param {groupeListCallback} next
     * @memberOf $groupeRepository
     */
    function getListManagedBy (oid, next) {
      EntityGroupe.match('gestionnaires').equals(oid).sort('nom').grab(next)
    }

    /**
     * Récupère tous les groupes ouverts
     * @param {groupeCallback} next
     * @memberOf $groupeRepository
     */
    function loadOuvert (next) {
      EntityGroupe.match('ouvert').equals(true).grab(function (error, groupes) {
        if (error) return next(error)
        next(null, groupes)
      })
    }

    /**
     * Récupère tous les groupes publics
     * @param {groupeCallback} next
     * @memberOf $groupeRepository
     */
    function loadPublic (next) {
      EntityGroupe.match('public').equals(true).grab(function (error, groupes) {
        if (error) return next(error)
        next(null, groupes)
      })
    }

    /**
     * Enregistre une groupe en bdd (et met à jour le cache)
     * @param {EntityGroupe}       groupe
     * @param {entityPersonneCallback} next
     * @memberOf $groupeRepository
     */
    function save (groupe, next) {
      if (!groupe.nom) return next(Error('Impossible d’enregistrer un groupe sans nom'))
      if (!groupe.store) groupe = EntityGroupe.create(groupe)
      // la mise en cache est dans afterStore de l'entity
      groupe.store(next)
    }

    /**
     * Supprime un groupe (ET modifie les ressources liées)
     * @param {string} nom
     * @param {errorCallback} next
     * @memberOf $groupeRepository
     */
    function deleteGroupe (nom, next) {
      const indexedName = getNormalizedName(nom)
      // on affecte au 1er appel
      if (!$ressourceRepository) $ressourceRepository = lassi.service('$ressourceRepository')
      if (!$personneRepository) $personneRepository = lassi.service('$personneRepository')
      // on efface d'abord le groupe des ressources
      flow().seq(function () {
        $ressourceRepository.removeGroup(nom, this)
      }).seq(function () {
        $personneRepository.removeGroup(nom, this)
      }).seq(function () {
        EntityGroupe.match('nom').equals(indexedName).purge(this)
      }).seq(function () {
        // et on vire du cache
        $cacheGroupe.delete(nom, next)
      }).catch(next)
    }

    /**
     * Service d'accès aux groupes utilisé par les différents contrôleurs
     * @service $groupeRepository
     */
    const $groupeRepository = {
      delete: deleteGroupe,
      fetchList,
      getListManagedBy,
      load,
      loadByNom,
      loadOuvert,
      loadPublic,
      save
    }

    return $groupeRepository
  })
}
