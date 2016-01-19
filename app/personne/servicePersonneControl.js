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

module.exports = function (EntityPersonne, EntityGroupe, $personneRepository, $accessControl) {
  /**
   * Ajoute un warning à une ressource
   * @param {Ressource} ressource
   * @param {string}    warning
   */
  function addWarning(ressource, warning) {
    if (!ressource.warnings) ressource.warnings = []
    ressource.warnings.push(warning)
  }
  /**
   * Ajoute une erreur à une ressource
   * @param {Ressource} ressource
   * @param {string}    errorMsg
   */
  function addError(ressource, errorMsg) {
    if (!ressource.errors) ressource.errors = []
    ressource.errors.push(errorMsg)
  }

  var flow = require('an-flow')
  var _ = require('lodash')
  //var tools = require('../tools')

  /**
   * Service de gestion des droits (donc demande le contexte en argument, parfois la ressource concernée)
   * à la jonction entre personne et ressource.
   * @service $personneControl
   */
  var $personneControl = {}

  /**
   * Normalise la propriété groupes d'une ressource (en vérifiant les droits et que les groupes existent)
   * Un prof peut enlever/ajouter des groupes s'il est auteur (rien sinon)
   * @param {Context}       context
   * @param {Ressource}     [ressourceOriginale]
   * @param {Ressource}     ressourceNew
   * @param {ressourceCallback} next
   * @memberOf $personneControl
   */
  $personneControl.checkGroupes = function (context, ressourceOriginale, ressourceNew, next) {
    log.debug("checkGroupes")
    if (!ressourceNew.groupes) ressourceNew.groupes = []
    // les 2 cas où y'a rien à faire
    if (ressourceOriginale && _.isEqual(ressourceNew.groupes, ressourceOriginale.groupes)) {
      // update sans modif de groupe
      next(null, ressourceNew)
    } else if (!ressourceOriginale && !ressourceNew.groupes.length) {
      // création sans groupes
      next(null, ressourceNew)
    } else {
      // faut examiner les différences, on regarde d'abord si c'est le format attendu
      if (!_.isArray(ressourceNew.groupes)) {
        // on vide et on signale l'erreur sans aller plus loin
        log.error(new Error("groupes n'était pas un array"), ressourceNew.groupes)
        if (!ressourceNew.errors) ressourceNew.errors = []
        ressourceNew.errors.push("Groupes invalides")
        ressourceNew.groupes = []
        next(null, ressourceNew)
      } else {
        var groupesVoulus = ressourceNew.groupes
        var tmpGroupes
        ressourceNew.groupes = []
        // les droits, seulement si la ressource existait (sinon on suppose que si on est appelé c'est qu'il a les droits de création)
        if (ressourceOriginale && !$accessControl.hasPermission("updateGroupes", context, ressourceOriginale)) {
          ressourceNew.groupes = ressourceOriginale.groupes
          addError(ressourceNew, "Vous n'avez pas les droits suffisants pour modifier les groupes de cette ressource")
          next(null, ressourceNew)
        } else {
          // on a les droits, on ajoute les groupes sup si besoin
          if (ressourceNew.groupesSup) {
            tmpGroupes = ressourceNew.groupesSup.split(",")
            tmpGroupes.forEach(function (groupe) {
              groupesVoulus.push(groupe.trim())
            })
          }
          // groupes contient tous ceux que l'on veut mettre, on vérifie qu'ils existent et que l'utilisateur peut ajouter
          flow(groupesVoulus).seqEach(function (groupeNom) {
            var nextGroupe = this
            // si l'utilisateur n'a pas le droit générique sur les groupes, on regarde l'appartenance avant de charger le groupe
            if (!$accessControl.hasPermission("updateGroupes", context) && !$accessControl.isInGroupe(context, groupeNom)) {
              ressourceNew.warnings.push("Vous devez faire partie du groupe " + groupeNom + " pour y partager cette ressource")
              nextGroupe()
            } else {
              $personneRepository.loadGroupeByNom(groupeNom, function (error, groupe) {
                if (error) {
                  addError(ressourceNew, error.toString())
                } else if (groupe) {
                  ressourceNew.groupes.push(groupe.nom)
                } else {
                  addWarning(ressourceNew, "Le groupe " + groupe.nom + " n'existe pas")
                }
                nextGroupe()
              })
            }
          }).seq(function () {
            next(null, ressourceNew)
          }).catch(function (error) {
            next(error)
          })
        }
      }
    }
  }

  /**
   * Normalise les propriétés auteurs et contributeurs (en vérifiant qu'ils existent)
   * @param {Context}       context
   * @param {Ressource}     ressourceOriginale
   * @param {Ressource}     ressourceNew
   * @param {ressourceCallback} next
   */
  $personneControl.checkPersonnes = function (context, ressourceOriginale, ressourceNew, next) {
    log.debug("checkPersonnes avec les auteurs initiaux", ressourceOriginale && ressourceOriginale.auteurs)
    log.debug("et les nouveaux auteurs", ressourceNew.auteurs)
    // les cas où on a rien à faire
    if (
        ressourceOriginale &&
        _.isEqual(ressourceNew.auteurs, ressourceOriginale.auteurs) &&
        _.isEqual(ressourceNew.contributeurs, ressourceOriginale.contributeurs) &&
        !ressourceNew.auteursAdd &&
        !ressourceNew.contributeursAdd
    ) {
      // y'avait une ressource et on a rien changé
      next(null, ressourceNew)

    } else if ($accessControl.hasPermission("updateAuteurs", context, ressourceOriginale)) {
      // on a tous les droits sur les auteurs et qqchose a changé, on mémorise ce que l'on veut mettre
      var auteurs = ressourceNew.auteurs,
          contributeurs = ressourceNew.contributeurs,
          tmp
      // puis reset des personnes sur la nouvelle ressource
      ressourceNew.auteurs = []
      ressourceNew.contributeurs = []

      flow().seq(function () {
        var nextStep = this
        // on passe en revue les auteurs demandés, en ajoutant à la wishlist les auteurs sup s'il y en a
        if (ressourceNew.auteursAdd) {
          tmp = ressourceNew.auteursAdd.split(",")
          delete ressourceNew.auteursAdd
          tmp.forEach(function (id) {
            log.debug("push auteur " +id)
            var idClean = id.trim()
            if (idClean) auteurs.push(idClean)
          })
        }
        flow(auteurs).seqEach(function (id) {
          var nextAuteur = this
          $personneRepository.load(id, function (error, personne) {
            if (error) {
              addError(ressourceNew, error.toString())
            } else if (personne) {
              ressourceNew.auteurs.push(personne.oid)
            } else {
              addWarning(ressourceNew, "L'auteur d'identifiant " + id + " n'existe pas")
            }
            nextAuteur()
          })
        }).seq(function () {
          nextStep()
        }).catch(function (error) {
          nextStep(error)
        })

      }).seq(function () {
        var nextStep = this
        // aj contributeurs sup
        if (ressourceNew.contributeursAdd) {
          tmp = ressourceNew.contributeursAdd.split(",")
          delete ressourceNew.contributeursAdd
          tmp.forEach(function (oid) {
            var id = oid.trim()
            if (id) contributeurs.push(id)
          })
        }
        // flow contributeurs demandés
        flow(contributeurs).seqEach(function (oid) {
          var nextContributeur = this
          $personneRepository.load(oid, function (error, personne) {
            if (error) {
              addError(ressourceNew, error.toString())
            } else if (personne) {
              ressourceNew.contributeurs.push(personne.oid)
            } else {
              addWarning(ressourceNew, "Le contributeur d'identifiant " + oid + " n'existe pas")
            }
            nextContributeur()
          })
        }).seq(function () {
          nextStep()
        }).catch(function (error) {
          nextStep(error)
        })

      }).seq(function () {
        // terminé
        next(null, ressourceNew)

      }).catch(next)

    } else {
      // pas tous les droits sur les auteurs, on ajoute le user courant en auteur (nouvelle ressource) ou contributeur (modif existante) sans toucher au reste
      var currentUserOid = $accessControl.getCurrentUserOid(context)
      if (ressourceOriginale) {
        ressourceNew.auteurs = ressourceOriginale.auteurs || []
        ressourceNew.contributeurs = ressourceOriginale.contributeurs || []
      }
      if (ressourceNew.auteurs.indexOf(currentUserOid) < 0) {
        // il est pas auteur
        if (ressourceOriginale) {
          // y'avait une ressource, on l'ajoute en contributeurs s'il n'y était pas
          if (ressourceNew.contributeurs.indexOf(currentUserOid) < 0) ressourceNew.contributeurs.push(currentUserOid);
        } else {
          // creation, mise d'office en auteur
          ressourceNew.auteurs = [currentUserOid]
        }
      }
      next(null, ressourceNew)
    }
  }

  return $personneControl
}
