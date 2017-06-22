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

const _ = require('lodash')
const flow = require('an-flow')
const merge = require('sesajstools/utils/object').merge

module.exports = function (EntityPersonne, EntityGroupe, $cachePersonne, $groupeRepository) {
  /**
   * Service d'accès aux personnes, utilisé par les différents contrôleurs
   * @service $personneRepository
   */
  const $personneRepository = {}

  /**
   * Ajoute un groupe à la personne (en le créant s'il n'existait pas),
   * et sauvegarde les modifs de personne
   * @param {Personne} personne
   * @param {string} groupeNom
   * @param {groupeCallback} next
   * @memberOf $personneRepository
   */
  $personneRepository.addGroupe = function (personne, groupeNom, next) {
    const uid = personne.oid
    if (!uid) return next(new Error('Impossible d’ajouter un groupe à une personne sans oid'))
    if (_.include(personne.groupesMembre, groupeNom)) {
      return next(null, {nom: groupeNom})
    }
    // on commence par récupérer une entity si on en a pas déjà une
    flow().seq(function () {
      if (personne.store) this(null, personne)
      else $personneRepository.load(uid, this)
    }).seq(function (entityPersonne) {
      if (entityPersonne) {
        personne = entityPersonne
        $groupeRepository.load(groupeNom, this)
      } else {
        this(new Error('Aucun utilisateur d’oid ' + uid))
      }
    }).seq(function (groupe) {
      if (groupe) {
        this(null, groupe)
      } else {
        // on le crée
        const newGroupe = {
          nom: groupeNom,
          gestionnaires: [uid]
        }
        EntityGroupe.create(newGroupe).store(this)
      }
    }).seq(function (groupe) {
      if (groupe && groupe.nom) {
        if (!personne.groupesMembre) personne.groupesMembre = []
        personne.groupesMembre.push(groupe.nom)
        personne.store(function (error, personne) {
          if (error) next(error)
          else if (personne) next(null, groupe)
          else next(new Error('Erreur à l’affectation du groupe ' + groupeNom))
        })
      } else {
        next(new Error('Erreur à l’enregistrement du groupe ' + groupeNom))
      }
    }).catch(function (error) {
      next(error)
    })
  }

  /**
   * Supprime une personne, ATTENTION, ne supprime pas cette personne des ressources qui l'auraient comme auteur
   * @param {string|Personne|EntityPersonne} who
   * @param next
   */
  $personneRepository.delete = function (who, next) {
    flow().seq(function () {
      if (typeof who === 'number') who += '' // oid numérique
      if (typeof who === 'string') return $personneRepository.load(who, this)
      if (typeof who === 'object') {
        // on nous passe une personne
        if (who.delete) return this(null, who)
        else if (who.oid) return this(EntityPersonne.create(who))
      }
      const error = new Error('$personneRepositorydelete appelé avec un argument incorrect')
      log.error(error, who)
      this(error)
    }).seq(function (personne) {
      personne.delete(this)
      // on efface le cache en tâche de fond
      $cachePersonne.delete(personne.oid)
      $cachePersonne.delete(personne.pid)
    }).done(next)
  }

  /**
   * Récupère une personne (en cache ou en bdd)
   * @param {string}           id   Oid ou pid
   * @param {personneCallback} next Renvoie toujours une EntityPersonne
   * @memberOf $personneRepository
   */
  $personneRepository.load = function (id, next) {
    if (typeof id === 'number') id += ''
    if (typeof id !== 'string') {
      const error = new Error(`id invalide ${typeof id}`)
      log.error(error, id)
      return next(error)
    }
    flow().seq(function () {
      $cachePersonne.get(id, this)
    }).seq(function (personneCached) {
      if (personneCached) return next(null, EntityPersonne.create(personneCached))
      this()
    }).seq(function () {
      // on va chercher en bdd
      const key = (id.substr('/') === -1) ? 'oid' : 'pid'
      EntityPersonne.match(key).equals(id).grabOne(this)
    }).seq(function (personne) {
      if (!personne) return next()
      $cachePersonne.set(personne)
      next(null, personne)
    }).catch(next)
  }

  /**
   * Efface un groupe chez toutes les personnes qui en sont membre ou qui le suivent
   * @param {string}            groupName Nom du groupe
   * @param {errorCallback} next      Avec la liste des personnes (ou un tableau vide)
   * @memberOf $personneRepository
   */
  $personneRepository.removeGroup = function (groupName, next) {
    let offset = 0
    const nb = 100
    flow().seq(function () {
      EntityPersonne.match('groupesMembre').equals(groupName).grab(nb, offset, this)
    }).seqEach(function (personne) {
      personne.groupesMembre = personne.groupesMembre.filter(grp => grp !== groupName)
      personne.groupesSuivis = personne.groupesSuivis.filter(grp => grp !== groupName)
      $personneRepository.save(personne, this)
    }).seq(function () {
      // reste ceux qui suivaient sans être membre
      EntityPersonne.match('groupesSuivis').equals(groupName).grab(nb, offset, this)
    }).seqEach(function (personne) {
      personne.groupesSuivis = personne.groupesSuivis.filter(grp => grp !== groupName)
      $personneRepository.save(personne, this)
    }).done(next)
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
   * Met à jour ou enregistre une nouvelle personne
   * @param {Personne} personne
   * @param {personneCallback} next Avec l'EntityPersonne
   * @memberOf $personneRepository
   */
  $personneRepository.updateOrCreate = function (personne, next) {
    // log.debug("$personneRepository.updateOrCreate", personne, {max:2000})
    function checkUpdate (personne, personneNew, next) {
      let needUpdate = false
      for (let prop in personneNew) {
        if (personneNew.hasOwnProperty(prop) && !_.isEqual(personne[prop], personneNew[prop])) {
          needUpdate = true
          // pour groupesMembre on fusionne, histoire de pas écraser les groupes locaux
          // par des groupes donnés par l'authentification
          if (prop === 'groupesMembre') merge(personne.groupesMembre, personneNew.groupesMembre)
          // et pour les autres on remplace
          else personne[prop] = personneNew[prop]
        }
      }
      if (needUpdate) personne.store(next)
      else next(null, personne)
    }

    function modify (error, personneBdd) {
      if (error) next(error)
      else if (personneBdd) checkUpdate(personneBdd, personne, next)
      else EntityPersonne.create(personne).store(next)
    }

    let id = personne.oid || personne.pid
    // pour continuer à être compatible avec l'ancien format
    // @todo virer ça dès que l'update 24 aura été appliqué partout
    if (!id && personne.origine && personne.idOrigine) {
      log.error(new Error('on a passé à updateOrCreate une personne avec origine & idOrigine, on voudrait un pid'), personne)
      id = personne.origine + '/' + personne.idOrigine
    }
    if (id) $personneRepository.load(id, modify)
    else next(new Error('Il manque un identifiant pour mettre à jour ou créer les données de cet utilisateur'))
  }

  return $personneRepository
}
