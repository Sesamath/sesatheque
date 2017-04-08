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
const myBaseId = lassi.settings.application.baseId
const configRoles = lassi.settings.components.personne.roles

module.exports = function (EntityPersonne, EntityGroupe, $cachePersonne, $groupeRepository, $accessControl) {
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
   * Récupère une personne (en cache ou en bdd)
   * @param {string}           id   Oid ou pid
   * @param {personneCallback} next Renvoie toujours une EntityPersonne
   * @memberOf $personneRepository
   */
  $personneRepository.load = function (id, next) {
    log.debug('load personne ' + id)
    // cast en string
    id += ''
    // on découpe sur le premier slash avec deux morceaux non vides
    const match = id.match(/^([^/]+)\/(.+)$/)
    if (match && match.length === 3) {
      if (match[1] === myBaseId) return $personneRepository.load(match[2], next)
      else $personneRepository.loadByOrigin(match[1], match[2], next)
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
              $personneRepository.setPermissions(personne)
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
              $personneRepository.setPermissions(personne)
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
   * Efface un groupe chez toutes les personnes qui en sont membre ou qui le suivent
   * @param {string}            groupName Nom du groupe
   * @param {errorCallback} next      Avec la liste des personnes (ou un tableau vide)
   * @memberOf $personneRepository
   */
  $personneRepository.removeGroup = function (groupName, next) {
    let offset = 0
    const nb = 100
    flow().seq(function recup () {
      const nextStep = this
      // log.debug('removeGroup membres de ' + groupName)
      EntityPersonne.match('groupesMembre').equals(groupName).grab(nb, offset, function (error, personnes) {
        // log.debug('on trouve ' + personnes.length + ' membres')
        if (error) throw error

        flow(personnes).seqEach(function (personne) {
          // log.debug('membre ' + personne.nom)
          // si on est là personne.groupesMembre contient forcément groupName
          personne.groupesMembre = personne.groupesMembre.filter(function (elt) { return elt !== groupName })
          // mais on peut avoir une anomalie et que groupName ne soit pas dans groupesSuivis, on check
          const index = personne.groupesSuivis && personne.groupesSuivis.indexOf(groupName)
          if (index) {
            personne.groupesSuivis = personne.groupesSuivis.filter(function (elt, i) { return index !== i })
          } else {
            log.error('La personne ' + personne.oid + ' avait le groupe ' + groupName + ' dans groupesMembre mais pas dans groupesSuivis')
          }
          // log.debug('avant store', personne.groupesMembre)
          // log.debug('avant store', personne.groupesSuivis)
          personne.store(this)
        }).seq(function () {
          // log.debug('fin personne pour membre')
          if (personnes.length < nb) {
            offset = 0
            nextStep()
          } else {
            offset += nb
            recup()
          }
        }).catch(function (error) {
          throw error
        })
        // fin du flow personnes
      })
    }).seq(function recup () {
      // log.debug('removeGroup suivi de ' + groupName)
      EntityPersonne.match('groupesSuivis').equals(groupName).grab(nb, offset, function (error, personnes) {
        // log.debug('on trouve les followers', personnes)
        if (error) throw error
        flow(personnes).seqEach(function (personne) {
          // log.debug('personne pour suivi', personne.nom)
          personne.groupesSuivis = personne.groupesSuivis.filter(function (elt) { return elt !== groupName })
          // log.debug('avant store', personne.groupesSuivis)
          personne.store(this)
        }).seq(function () {
          if (personnes.length < nb) {
            next()
          } else {
            offset += nb
            recup()
          }
        }).catch(function (error) {
          throw error
        })
      })
    }).catch(function (error) {
      log.error(error)
      next(error)
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
   * Calcule et affecte les permissions d'une personne en fonction de ses rôles
   * et des permissions données à chaque rôle en configuration
   * @param {Personne} personne
   * @returns {Object} avec les permissions en propriété (valeur true|false|undefined)
   * @memberOf $personneRepository
   */
  $personneRepository.setPermissions = function (personne) {
    var permissions = {}
    _.each(personne.roles, function (hasRole, role) {
      // on ajoute les permissions définies pour ce role en config
      if (hasRole && configRoles[role]) {
        // faut pas faire de merge, on pourrait écraser avec false
        // une permission déjà accordée par un rôle précédent
        _.each(configRoles[role], function (hasPerm, perm) {
          if (hasPerm) permissions[perm] = true
        })
      }
    })
    personne.permissions = permissions
    console.log('perm après set', personne.permissions)
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
