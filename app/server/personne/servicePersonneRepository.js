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
const {merge} = require('sesajstools/utils/object')
const {hasProp} = require('sesajstools')
const {userError} = require('../../utils')
const {looksLikePid} = require('../../utils/validators')

module.exports = function (component) {
  component.service('$personneRepository', function (EntityPersonne, EntityGroupe, $cachePersonne, $groupeRepository) {
    /**
     * Ajoute un groupe à la personne, comme membre (en le créant s'il n'existait pas),
     * @param {Personne|EntityPersonne} personne (sa prop groupesMembre sera modifiée)
     * @param {string} groupeNom
     * @param {errorCallback} next
     * @memberOf $personneRepository
     */
    function addGroupe (personne, groupeNom, next) {
      const oid = personne.oid
      if (!oid) return next(new Error('Impossible d’ajouter un groupe à une personne sans oid'))
      if (!Array.isArray(personne.groupesMembre)) personne.groupesMembre = []
      if (personne.groupesMembre.includes(groupeNom)) return next(Error(`La personne ${oid} était déjà membre du groupe ${groupeNom}`))

      // on veut une EntityPersonne si on en a pas déjà une (faudra la sauvegarder)
      const entityPersonne = personne.store ? personne : EntityPersonne.create(personne)

      // faut regarder si le groupe existe
      flow().seq(function () {
        $groupeRepository.loadByNom(groupeNom, this)
      }).seq(function (groupe) {
        if (groupe) return this(null, groupe)
        // sinon on le crée
        const newGroupe = {
          nom: groupeNom,
          gestionnaires: [oid]
        }
        EntityGroupe.create(newGroupe).store(this)
      }).seq(function (groupe) {
        entityPersonne.groupesMembre.push(groupe.nom)
        entityPersonne.store(this)
      }).seq(function (personneBdd) {
        // on mute le groupesMembre du personne passé en argument
        personne.groupesMembre = personneBdd.groupesMembre
        next()
      }).catch(next)
    }

    /**
     * Supprime une personne, ATTENTION, ne supprime pas cette personne des ressources qui l'auraient comme auteur
     * @param {string|Personne|EntityPersonne} who
     * @param next
     */
    function deletePersonne (who, next) {
      flow().seq(function () {
        if (typeof who === 'number') who += '' // oid numérique
        if (typeof who === 'string') return load(who, this)
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
    function load (id, next) {
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
        const key = id.includes('/') ? 'pid' : 'oid'
        EntityPersonne.match(key).equals(id).grabOne(this)
      }).seq(function (personne) {
        if (!personne) return next()
        $cachePersonne.set(personne)
        next(null, personne)
      }).catch(next)
    }

    /**
     * Retourne une liste de personnes d'apres une liste de oids
     * @param {string[]} oids Liste de oid
     * @param next callback appelée avec (error, personnes) (personnes étant un array de personne || null si l'oid est inconnu en bdd)
     */
    function loadByOids (oids, next) {
      if (!Array.isArray(oids)) return next(Error('arguments invalides'))
      flow(oids).seqEach(function (oid) {
        load(oid, this)
      }).seq(function (personnes) {
        next(null, personnes)
      }).catch(function (error) {
        next(error)
      })
    }

    /**
     * Retourne une personne d'après son pid si son nom correspond
     * @param {string} pid
     * @param {string} nom
     * @param {personneCallback} next
     */
    function loadByPidAndNom (pid, nom, next) {
      if (!looksLikePid(pid)) return next(Error('Paramètre pid invalide'))
      if (!nom) return next(Error('Paramètre nom manquant'))

      load(pid, (error, personne) => {
        if (error) return next(error)
        if (personne && personne.nom.trim().toLowerCase() === nom.trim().toLowerCase()) {
          // ok
          return next(null, personne)
        }
        // y'a un pb
        next(userError(`Aucun utilisateur avec l’identifiant ${pid} et le nom "${nom}"`, {status: 404}))
      })
    }

    /**
     * Retourne une liste de personnes d'apres une liste de pids
     * @param {string[]} pids Liste de pid
     * @param {function} next callback appelée avec (error, personnes) (personnes étant un array de personne || null si le pid est inconnu en bdd)
     */
    function loadByPids (pids, next) {
      if (!Array.isArray(pids)) return next(Error('arguments invalides'))
      flow(pids).seqEach(function (pid) {
        load(pid, this)
      }).seq(function (personnes) {
        next(null, personnes)
      }).catch(next)
    }

    /**
     * Efface un groupe chez toutes les personnes qui en sont membre ou qui le suivent
     * @param {string}            groupName Nom du groupe
     * @param {errorCallback} next      Avec la liste des personnes (ou un tableau vide)
     * @memberOf $personneRepository
     */
    function removeGroup (groupName, next) {
      // vire dans groupesMembre (et groupesSuivis pour les personnes concernées)
      const removeMembre = (skip) => {
        flow().seq(function () {
          EntityPersonne.match('groupesMembre').equals(groupName).grab({limit, skip}, this)
        }).seqEach(function (personne) {
          personne.groupesMembre = personne.groupesMembre.filter(notMatch)
          personne.groupesSuivis = personne.groupesSuivis.filter(notMatch)
          save(personne, this)
        }).seq(function (personnes) {
          if (personnes.length < limit) return removeSuivis(0)
          // faut refaire un tour
          removeMembre(skip + limit)
        }).catch(next)
      }
      // vire dans groupesSuivis s'il en reste
      const removeSuivis = (skip) => {
        flow().seq(function () {
          EntityPersonne.match('groupesSuivis').equals(groupName).grab({limit, skip}, this)
        }).seqEach(function (personne) {
          personne.groupesSuivis = personne.groupesSuivis.filter(notMatch)
          save(personne, this)
        }).seq(function (personnes) {
          if (personnes.length < limit) return next()
          removeSuivis(skip + limit)
        }).catch(next)
      }

      const limit = 100
      const notMatch = (grp) => grp !== groupName
      removeMembre(0)
    }

    /**
     * Renomme un groupe chez toutes les personnes qui sont membres ou abonnés
     * @param oldName
     * @param newName
     * @param next
     */
    function renameGroup (oldName, newName, next) {
      const limit = 100
      const modifier = (nom) => nom === oldName ? newName : nom

      const updateMembres = (skip) => {
        flow().seq(function () {
          EntityPersonne.match('groupesMembre').equals(oldName).grab({limit, skip}, this)
        }).seqEach(function (personne) {
          personne.groupesMembre = personne.groupesMembre.map(modifier)
          personne.groupesSuivis = personne.groupesSuivis.map(modifier)
          save(personne, this)
        }).seq(function (personnes) {
          if (personnes.length < limit) return updateSuiveurs(0)
          updateMembres(skip + limit)
        }).catch(next)
      }

      const updateSuiveurs = (skip) => {
        flow().seq(function () {
          // pour ceux qui suivaient sans être membre
          EntityPersonne.match('groupesSuivis').equals(oldName).grab({limit, skip}, this)
        }).seqEach(function (personne) {
          personne.groupesSuivis = personne.groupesSuivis.map(modifier)
          save(personne, this)
        }).seq(function (personnes) {
          if (personnes.length < limit) return next()
          updateSuiveurs(skip + limit)
        }).catch(next)
      }

      updateMembres(0)
    }

    /**
     * Enregistre une personne en bdd (et met à jour le cache)
     * @param {EntityPersonne}       personne
     * @param {entityPersonneCallback} next
     * @memberOf $personneRepository
     */
    function save (personne, next) {
      if (!personne.store) personne = EntityPersonne.create(personne)
      // La mise en cache est réalisée dans l'afterstore
      personne.store(next)
    }

    /**
     * Met à jour ou enregistre une nouvelle personne
     * @param {Personne} personne
     * @param {personneCallback} next Avec l'EntityPersonne
     * @memberOf $personneRepository
     */
    function updateOrCreate (personne, next) {
      function checkUpdate (personne, personneNew, next) {
        let needUpdate = false
        // eslint-disable-next-line no-unused-vars
        for (const prop in personneNew) {
          if (hasProp(personneNew, prop) && !_.isEqual(personne[prop], personneNew[prop])) {
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
      if (id) load(id, modify)
      else next(new Error('Il manque un identifiant pour mettre à jour ou créer les données de cet utilisateur'))
    }

    /**
     * Service d'accès aux personnes, utilisé par les différents contrôleurs
     * @service $personneRepository
     */
    const $personneRepository = {
      addGroupe,
      delete: deletePersonne,
      load,
      loadByOids,
      loadByPidAndNom,
      loadByPids,
      removeGroup,
      renameGroup,
      save,
      updateOrCreate
    }

    return $personneRepository
  })
}
