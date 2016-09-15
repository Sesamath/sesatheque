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

var _ = require('lodash')
var flow = require('an-flow')
var merge = require('sesajstools').merge

module.exports = function (EntityPersonne, EntityGroupe, $cachePersonne, $groupeRepository) {
  /**
   * Service d'accès aux personnes, utilisé par les différents contrôleurs
   * @service $personneRepository
   */
  var $personneRepository = {}

  /**
   * Ajoute un groupe à la personne (en le créant s'il n'existait pas),
   * et sauvegarde les modifs de personne
   * @param {Personne} personne
   * @param {string} groupeNom
   * @param {groupeCallback} next
   * @memberOf $personneRepository
   */
  $personneRepository.addGroupe = function (personne, groupeNom, next) {
    var uid = personne.oid
    if (!uid) return next(new Error('Impossible d’ajouter un groupe à une personne sans oid'))
    if (_.include(personne.groupesMembre, groupeNom)) {
      return next(null, {nom: groupeNom})
    }
    // on commence par récupérer une entity si on en a pas déjà une
    flow().seq(function () {
      if (!personne.store) $personneRepository.load(uid, this)
      else this(null, personne)
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
        var newGroupe = {
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
   * Récupère une personne (en cache ou en bdd)
   * @param {string}           id   Oid ou origine/idOrigine
   * @param {personneCallback} next Renvoie toujours une EntityPersonne
   * @memberOf $personneRepository
   */
  $personneRepository.load = function (id, next) {
    log.debug('load personne ' + id)
    // cast en string
    id += ''
    // on découpe sur le premier slash avec deux morceaux non vides
    var match = id.match(/^([^\/]+)\/(.+)$/)
    if (match && match.length === 3) {
      $personneRepository.loadByOrigin(match[1], match[2], next)
    } else if (id) {
      $cachePersonne.get(id, function (error, personneCached) {
        if (error) log.error(error)
        if (personneCached) {
          next(null, EntityPersonne.create(personneCached))
        } else {
          EntityPersonne.match('oid').equals(id).grabOne(function (error, personne) {
            // log.debug('personne load remonte ', personne)
            if (error) {
              next(error)
            } else if (personne) {
              $cachePersonne.set(personne)
              next(null, personne)
            } else {
              next()
            }
          })
        }
      })
    } else {
      next(new Error('id manquant, impossible de charger une personne.'))
    }
  }

  /**
   * Récupère une personne (en cache ou en bdd)
   * @param {string}           origine   Nom du authClient qui a authentifié cette personne
   * @param {string}           idOrigine Id de la personne dans son système d'authentification
   * @param {personneCallback} next      Renvoie toujours une EntityPersonne
   * @memberOf $personneRepository
   */
  $personneRepository.loadByOrigin = function (origine, idOrigine, next) {
    log.debug('loadByOrigin personne ' + origine + '/' + idOrigine)
    if (origine && idOrigine) {
      $cachePersonne.getByOrigine(origine, idOrigine, function (error, personneCached) {
        if (error) log.error(error)
        if (personneCached) {
          next(null, EntityPersonne.create(personneCached))
        } else {
          EntityPersonne.match('origine').equals(origine).match('idOrigine').equals(idOrigine).grabOne(function (error, personne) {
            // log.debug('personne load remonte ', personne)
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
      next(new Error('origine ou idOrigine manquant, impossible de chercher en base de données.'))
    }
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
      var needUpdate = false
      for (var prop in personneNew) {
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
      if (error) {
        next(error)
      } else if (personneBdd) {
        checkUpdate(personneBdd, personne, next)
      } else {
        EntityPersonne.create(personne).store(next)
      }
    }

    if (personne.oid) $personneRepository.load(personne.oid, modify)
    else if (personne.origine && personne.idOrigine) $personneRepository.loadByOrigin(personne.origine, personne.idOrigine, modify)
    else next(new Error('Il manque un identifiant pour mettre à jour ou créer les données de cet utilisateur'))
  }

  return $personneRepository
}
