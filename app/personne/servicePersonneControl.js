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
var _ = require('lodash')
var sjt = require('sesajstools')
var rTools = require('../tools/ressource')

module.exports = function (EntityPersonne, EntityGroupe, $personneRepository, $groupeRepository, $accessControl) {
  /**
   * Charge groupeNom pour voir s'il existe, sinon, et si on a précisé shouldBeNew on le crée,
   * et ensuite l'ajoute à la ressource si on en est membre ou qu'il était dans whiteList
   * @private
   * @param {Context} context
   * @param {Ressource} ressource
   * @param {string} groupeNom
   * @param {object} options  peut contenir les propriétés
   *                            shouldBeNew (boolean) Si le groupe n'existait pas, le créer avec le user courant en gestionnaire
   *                            isGroupeAuteur (boolean) Ajouter le groupe à groupesAuteurs et pas groupes
   *                            whiteList (Array) Une liste de noms de groupes que l'on peut ajouter sans vérifier si on est membre ou pas
   * @param {errorCallback} next
   */
  function checkGroupe (context, ressource, groupeNom, options, next) {
    var shouldBeNew = options && options.shouldBeNew || false
    var isGroupeAuteur = options && options.isGroupeAuteur || false
    var whiteList = options && options.whiteList || []
    if (!_.isArray(ressource.groupes)) ressource.groupes = []
    $groupeRepository.load(groupeNom, function (error, groupe) {
      if (error) return next(error)
      if (groupe) {
        if (_.includes(whiteList, groupe.nom)) {
          if (isGroupeAuteur) ressource.groupesAuteurs.push(groupe.nom)
          else ressource.groupes.push(groupe.nom)
        } else if ($accessControl.isInGroupe(context, groupe.nom)) {
          if (isGroupeAuteur) {
            // il faut en plus les droits updateAuteurs
            if ($accessControl.hasPermission('updateAuteurs', context, ressource)) ressource.groupesAuteurs.push(groupe.nom)
            else rTools.addWarning(ressource, 'Vous n’avez pas les droits suffirants pour modifier les groupes pouvant modifier cette ressource')
          } else {
            ressource.groupes.push(groupe.nom)
          }
        } else {
          rTools.addWarning(ressource, 'Vous devez faire partie du groupe ' + groupe.nom + ' pour y partager cette ressource')
        }
        next()
      } else if (shouldBeNew) {
        // il est nouveau et on voulait justement l'ajouter
        var currentUser = $accessControl.getCurrentUser(context)
        // à priori on récupère une Personne de la session mais pas une EntityPersonne, on teste quand même au cas où ça évoluerait
        if (!currentUser.store) currentUser = EntityPersonne.create(currentUser)
        $personneRepository.addGroupe(currentUser, groupeNom, function (error, groupe) {
          if (error) {
            next(error)
          } else if (groupe) {
            ressource.groupes.push(groupe.nom)
            next()
          } else {
            next(new Error('Erreur interne (addGroupe)'))
          }
        })
      } else {
        // il est nouveau et c'est pas normal
        rTools.addWarning(ressource, 'Le groupe ' + groupeNom + " n'existe pas (ou plus)")
        next()
      }
    })
  }

  /**
   * Service de gestion des droits (donc demande le contexte en argument, parfois la ressource concernée)
   * à la jonction entre personne et ressource.
   * @service $personneControl
   */
  var $personneControl = {}

  /**
   * Normalise la propriété groupes d'une ressource (en vérifiant les droits et que les groupes existent)
   * Un prof peut enlever/ajouter des groupes s'il est auteur (rien sinon)
   * @param {Context}           context
   * @param {Ressource}         ressourceOriginale
   * @param {Ressource}         ressourceNew
   * @param {string}            groupesSup La liste des groupes à ajouter (délimiteur , ou ; ou espace)
   * @param {ressourceCallback} next
   * @memberOf $personneControl
   */
  $personneControl.checkGroupes = function (context, ressourceOriginale, ressourceNew, groupesSup, next) {
    /**
     * ajoute l'erreur à la ressource et la passe à next
     * @private
     * @inner
     * @param {Error} error
     */
    function addErrorAndNext (error) {
      log.error(error)
      rTools.addError(ressourceNew, error.toString())
      next(null, ressourceNew)
    }

    if (!ressourceNew.groupes) ressourceNew.groupes = []
    if (!ressourceNew.groupesAuteurs) ressourceNew.groupesAuteurs = []
    if (!_.isArray(ressourceNew.groupes)) {
      // on vide et on signale l'erreur sans aller plus loin
      log.error(new Error("groupes n'était pas un array"), ressourceNew.groupes)
      rTools.addError(ressourceNew, 'Groupes invalides')
      ressourceNew.groupes = []
      return next(null, ressourceNew)
    }
    if (!_.isArray(ressourceNew.groupesAuteurs)) {
      log.error(new Error("groupesAuteurs n'était pas un array"), ressourceNew.groupesAuteurs)
      rTools.addError(ressourceNew, 'Groupes auteurs invalides')
      ressourceNew.groupesAuteurs = []
      return next(null, ressourceNew)
    }
    log.debug('checkGroupes avec les groupes (' + ressourceNew.groupes.join(',') + ') groupesAuteurs (' + ressourceNew.groupesAuteurs.join(',') + ') et les nouveaux (' + groupesSup + ')')
    // les 2 cas où y'a rien à faire
    if (
      ressourceOriginale &&
      _.isEqual(ressourceNew.groupes, ressourceOriginale.groupes) &&
      _.isEqual(ressourceNew.groupesAuteurs, ressourceOriginale.groupesAuteurs) &&
      !groupesSup
    ) {
      // update sans modif de groupe
      return next(null, ressourceNew)
    } else if (
      !ressourceOriginale &&
      !ressourceNew.groupes.length &&
      !ressourceNew.groupesAuteurs.length &&
      !groupesSup
    ) {
      // création de ressource sans groupes
      return next(null, ressourceNew)
    }

    // vérif des droits sur les groupes, seulement si la ressource existait
    // (sinon on suppose que si on est appelé c'est que le user a les droits de création de ressource donc d'updateGroupes dessus)
    if (ressourceOriginale && !$accessControl.hasPermission('updateGroupes', context, ressourceOriginale)) {
      ressourceNew.groupes = ressourceOriginale.groupes
      ressourceNew.groupesAuteurs = ressourceOriginale.groupesAuteurs
      rTools.addError(ressourceNew, "Vous n'avez pas les droits suffisants pour modifier les groupes de cette ressource")
      return next(null, ressourceNew)
    }

    // on a les droits, on mémorise ce qui est demandé et ajoute les groupes sup s'il y en a
    var groupesVoulus = ressourceNew.groupes
    var groupesAuteurVoulus = ressourceNew.groupesAuteurs
    ressourceNew.groupes = []
    ressourceNew.groupesAuteurs = []
    flow().seq(function () {
      // on boucle sur les groupes à ajouter
      flow(sjt.splitAndTrim(groupesSup, /[,;]+/)).seqEach(function (groupeNom) {
        log.debug('ajout du nouveau groupe ' + groupeNom)
        checkGroupe(context, ressourceNew, groupeNom, {shoulBeNew: true}, this)
      }).done(this)
    }).seq(function () {
      // groupesVoulus contient tous ceux que l'on veut mettre, on vérifie qu'ils existent
      // et que l'utilisateur peut ajouter ou qu'il y était déjà
      flow(groupesVoulus).seqEach(function (groupeNom) {
        // log.debug('affectation du groupe ' + groupeNom)
        checkGroupe(context, ressourceNew, groupeNom, {whiteList: ressourceOriginale.groupes}, this)
      }).done(this)
      // @todo faudrait vérifier que l'on a pas viré de groupe auxquel on appartient pas, et si c'était le cas cloner ?
    }).seq(function () {
      flow(groupesAuteurVoulus).seqEach(function (groupeNom) {
        // log.debug('affectation du groupeAuteur ' + groupeNom)
        checkGroupe(context, ressourceNew, groupeNom, {whiteList: ressourceOriginale.groupesAuteurs, isGroupeAuteur: true}, this)
      }).done(this)
    }).seq(function () {
      next(null, ressourceNew)
    }).catch(addErrorAndNext)
  }

  /**
   * Normalise les propriétés auteurs et contributeurs (en vérifiant qu'ils existent)
   * Vérifie que le user courant peut modifier les auteurs
   * @param {Context}       context
   * @param {Ressource}     ressourceOriginale
   * @param {Ressource}     ressourceNew
   * @param {ressourceCallback} next
   */
  $personneControl.checkPersonnes = function (context, ressourceOriginale, ressourceNew, next) {
    // log.debug('checkPersonnes avec les auteurs initiaux', ressourceOriginale && ressourceOriginale.auteurs)
    // log.debug('les nouveaux auteurs (parmi les anciens)', ressourceNew.auteurs)
    // log.debug('et les auteurs à ajouter', ressourceNew.auteursAdd)
    var currentUserOid = $accessControl.getCurrentUserOid(context)
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
    } else if ($accessControl.hasPermission('updateAuteurs', context, ressourceOriginale)) {
      // on a tous les droits sur les auteurs et qqchose a changé

      // on mémorise ce que l'on veut mettre (case à cocher, parmi les précédents)
      var oids = []
      var auteurs = ressourceNew.auteurs.filter(function (id) {
        id = Number(id)
        if (sjt.isInArray(oids, id)) return false
        oids.push(id)
        return true
      })
      // en ajoutant les supplémentaires
      var tmp
      // aj auteurs sup
      if (ressourceNew.auteursAdd) {
        tmp = ressourceNew.auteursAdd.split(',')
        delete ressourceNew.auteursAdd
        tmp.forEach(function (id) {
          id = Number(id) // vire d'éventuels espaces
          if (id && !sjt.isInArray(auteurs, id)) {
            auteurs.push(id)
          }
        })
      }
      // idem contributeurs
      oids = auteurs
      var contributeurs = ressourceNew.contributeurs.filter(function (id) {
        id = Number(id)
        if (sjt.isInArray(oids, id)) return false
        oids.push(id)
        return true
      })
      // aj contributeurs sup
      if (ressourceNew.contributeursAdd) {
        tmp = ressourceNew.contributeursAdd.split(',')
        delete ressourceNew.contributeursAdd
        tmp.forEach(function (id) {
          id = Number(id)
          if (id && !sjt.isInArray(contributeurs, id) && !sjt.isInArray(auteurs, id)) contributeurs.push(id)
        })
      }
      log('auteurs', auteurs)
      log('contrib', contributeurs)

      // puis reset des personnes sur la nouvelle ressource
      ressourceNew.auteurs = []
      ressourceNew.contributeurs = []

      flow().seq(function () {
        // auteurs voulus
        var nextStep = this
        flow(auteurs).seqEach(function (oid) {
          var nextAuteur = this
          $personneRepository.load(oid, function (error, personne) {
            if (error) {
              rTools.addError(ressourceNew, error.toString())
            } else if (personne) {
              log('ajout ' + personne.nom)
              ressourceNew.auteurs.push(personne.oid)
            } else {
              rTools.addWarning(ressourceNew, 'L’auteur d’identifiant ' + oid + ' n’existe pas')
            }
            nextAuteur()
          })
        }).done(nextStep)
      }).seq(function () {
        // contributeurs voulus
        var nextStep = this
        // flow contributeurs demandés
        flow(contributeurs).seqEach(function (oid) {
          var nextContributeur = this
          $personneRepository.load(oid, function (error, personne) {
            if (error) {
              rTools.addError(ressourceNew, error.toString())
            } else if (personne) {
              ressourceNew.contributeurs.push(personne.oid)
            } else {
              rTools.addWarning(ressourceNew, 'Le contributeur d’identifiant ' + oid + ' n’existe pas')
            }
            nextContributeur()
          })
        }).done(nextStep)
      }).seq(function () {
        // terminé, mais si y'a pas d'auteurs on met au moins le user courant
        if (_.isEmpty(ressourceNew.auteurs)) ressourceNew.auteurs.push(currentUserOid)
        next(null, ressourceNew)
      }).catch(next)
    } else {
      // pas tous les droits sur les auteurs, on ajoute le user courant en auteur (nouvelle ressource)
      // ou contributeur (modif existante) sans toucher au reste
      if (ressourceOriginale) {
        ressourceNew.auteurs = ressourceOriginale.auteurs || []
        ressourceNew.contributeurs = ressourceOriginale.contributeurs || []
      }
      // le mettre en auteur ?
      if (ressourceNew.auteurs.length) {
        // y'a des auteurs
        if (ressourceNew.auteurs.indexOf(currentUserOid) === -1 && ressourceNew.contributeurs.indexOf(currentUserOid) === -1
        ) {
          // et il est pas mentionné, on le met en contributeur
          ressourceNew.contributeurs.push(currentUserOid)
        }
      } else {
        // si y'a pas d'auteurs on l'y ajoute
        ressourceNew.auteurs = [currentUserOid]
        // mais si y'a une ressource originale c'est pas normal
        if (ressourceOriginale) log.error(new Error('Il y avait une ressource sans auteurs ' + ressourceOriginale.oid))
      }
      next(null, ressourceNew)
    }
  }

  return $personneControl
}
