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

  var seq = require('seq')
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
   * @param {Ressource}     ressourceOriginale
   * @param {Ressource}     ressourceNew
   * @param {errorCallback} next
   * @memberOf $personneControl
   */
  $personneControl.checkGroupes = function (context, ressourceOriginale, ressourceNew, next) {
    log.debug("checkGroupes")
    if (ressourceOriginale && _.isEqual(ressourceNew.groupes, ressourceOriginale.groupes)) {
      next()
    } else {
      var groupes = [],
          tmpGroupes
      if (!ressourceOriginale) ressourceOriginale = {groupes:[], auteurs:[$accessControl.getCurrentUserOid(context)]}
      if (_.isArray(ressourceNew.groupes)) {
        groupes = ressourceNew.groupes
      } else if (typeof ressourceNew.groupes === "string") {
      // on normalise si on récupère une string
        tmpGroupes = ressourceNew.groupes.split(",")
        ressourceNew.groupes = []
        tmpGroupes.forEach(function (groupe) {
          groupes.push(groupe.trim())
        })
      }
      ressourceNew.groupes = []


      if ($accessControl.hasPermission("updateGroupes", context, ressourceOriginale)) {
        // on ajoute new si besoin
        if (ressourceNew.groupesSup) {
          tmpGroupes = ressourceNew.groupesSup.split(",")
          tmpGroupes.forEach(function (groupe) {
            groupes.push(groupe.trim())
          })
        }
        // groupes contient tous ceux que l'on veut mettre, on vérifie qu'ils existent et que l'utilisateur peut ajouter
        seq(groupes).seqEach(function (groupeNom) {
          var nextGroupe = this
          // si l'utilisateur n'a pas le droit générique sur les groupes, on regarde l'appartenance avant de charger le groupe
          if (!$accessControl.hasPermission("updateGroupes", context) && !$accessControl.isInGroupe(context, groupeNom)) {
            ressourceNew.warnings.push("Vous devez faire partie du groupe " +groupeNom +" pour y partager cette ressource")
          } else {
            $personneRepository.loadGroupeByNom(groupeNom, function (error, groupe) {
              if (error) {
                addError(ressourceNew, error.toString())
              } else if (groupe) {
                ressourceNew.groupes.push(groupe.nom)
              } else {
                addWarning(ressourceNew, "Le groupe " +groupe.nom +" n'existe pas")
              }
              nextGroupe()
            })
          }
        }).seq(function () {
          next()
        })
      } else {
        ressourceNew.groupes = ressourceOriginale.groupes
        addWarning(ressourceNew, "Vous ne pouvez pas modifier les groupes d'une ressources dont vous n'êtes pas l'auteur")
        next()
      }
    }
  }

  /**
   * Normalise les propriétés auteurs et contributeurs (en vérifiant qu'ils existent)
   * @param {Context}       context
   * @param {Ressource}     ressourceOriginale
   * @param {Ressource}     ressourceNew
   * @param {errorCallback} next
   */
  $personneControl.checkPersonnes = function (context, ressourceOriginale, ressourceNew, next) {
    log.debug("checkPersonnes")
    if (ressourceOriginale && _.isEqual(ressourceNew.auteurs, ressourceOriginale.auteurs) && _.isEqual(ressourceNew.contributeurs, ressourceOriginale.contributeurs) ) {
      next()
    } else {
      // qqchose a changé
      var auteurs = ressourceNew.auteurs,
          contributeurs = ressourceNew.contributeurs,
          tmp
      // si pas d'originale, on met le user en auteur
      if (!ressourceOriginale) ressourceOriginale = {auteurs:[$accessControl.getCurrentUserOid(context)], contributeurs:[]}
      ressourceNew.auteurs = []
      ressourceNew.contributeurs = []

      if ($accessControl.hasPermission("updateAuteurs", context, ressourceOriginale)) {
        // on ajoute new si besoin
        if (ressourceNew.auteursSup) {
          tmp = ressourceNew.auteursSup.split(",")
          tmp.forEach(function (oid) {
            auteurs.push(oid.trim())
          })
        }
        if (ressourceNew.contributeursSup) {
          tmp = ressourceNew.contributeursSup.split(",")
          tmp.forEach(function (oid) {
            contributeurs.push(oid.trim())
          })
        }
        // et on vérifie qu'ils existent
        seq().seq(function () {
          var nextStep = this

          // seq auteurs
          seq(auteurs).seqEach(function (oid) {
            var nextAuteur = this
            $personneRepository.load(oid, function (error, personne) {
              if (error) {
                addError(ressourceNew, error.toString())
              } else if (personne) {
                ressourceNew.auteurs.push(personne.oid)
              } else {
                addWarning(ressourceNew, "L'auteur d'identifiant " + oid + " n'existe pas")
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

          // seq contributeurs
          seq(contributeurs).seqEach(function (oid) {
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
          next()
        }).catch(function (error) {
          addError(ressourceNew, error.toString())
          next()
        })
      } else {
        ressourceNew.auteurs = ressourceOriginale.auteurs
        ressourceNew.contributeurs = ressourceOriginale.contributeurs
        addWarning(ressourceNew, "Vous ne pouvez pas modifier les auteurs ou contributeurs d'une ressources dont vous n'êtes pas l'auteur")
        next()
      }
    }
  }

  return $personneControl
}
