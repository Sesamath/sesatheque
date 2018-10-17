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
const {isInArray} = require('sesajstools')
const {addError, addWarning} = require('../lib/ressource')
const {isSameSimpleArray} = require('../lib/tools')

module.exports = function (component) {
  component.service('$personneControl', function (EntityPersonne, EntityGroupe, $personneRepository, $groupeRepository, $accessControl) {
    /**
     * Charge groupeNom pour voir s'il existe, sinon, et si on a précisé shouldBeNew on le crée,
     * et ensuite l'ajoute à la ressource si on en est membre ou qu'il était dans whiteList
     * @private
     * @param {Context} context
     * @param {Ressource} ressource
     * @param {string} groupeNom
     * @param {object} [options]
     * @param {boolean} [options.isGroupeAuteur] Ajouter le groupe à groupesAuteurs et pas groupes
     * @param {string[]} [options.whiteList] Une liste de noms de groupes que l'on peut ajouter sans vérifier si on est membre ou pas
     * @param {errorCallback} next
     */
    function addGroupe (context, ressource, groupeNom, options, next) {
      if (!ressource) throw new Error('pas de ressource')
      if (!groupeNom) throw new Error('pas de nom de groupe')
      if (arguments.length === 4) {
        next = options
        options = {}
      }
      const isGroupeAuteur = options.isGroupeAuteur === true
      const whiteList = options.whiteList || []
      if (!Array.isArray(ressource.groupes)) ressource.groupes = []
      if (!Array.isArray(ressource.groupesAuteurs)) ressource.groupesAuteurs = []
      $groupeRepository.loadByNom(groupeNom, function (error, groupe) {
        if (error) return next(error)
        if (!groupe) {
          addWarning(ressource, `Le groupe ${groupeNom} n’existe pas (ou plus)`)
          return next()
        }
        const {nom} = groupe

        if (whiteList.includes(nom)) {
          if (isGroupeAuteur) ressource.groupesAuteurs.push(nom)
          else ressource.groupes.push(nom)
          return next()
        }

        // faut les droits
        if (!$accessControl.isGroupeMembre(context, nom)) {
          addWarning(ressource, `Vous devez faire partie du groupe « ${nom} » pour y partager cette ressource`)
          return next()
        }

        if (isGroupeAuteur) {
          // il faut en plus les droits updateAuteurs
          if ($accessControl.hasPermission('updateAuteurs', context, ressource)) {
            ressource.groupesAuteurs.push(nom)
          } else {
            addWarning(ressource, 'Vous n’avez pas les droits suffirants pour modifier les groupes pouvant modifier cette ressource')
          }
        } else {
          ressource.groupes.push(nom)
        }
        return next()
      })
    }

    /**
     * Normalise la propriété groupes d'une ressource (en vérifiant les droits et que les groupes existent)
     * Un prof peut enlever/ajouter des groupes s'il est auteur (rien sinon)
     * @param {Context}           context
     * @param {Ressource}         ressourceOriginale
     * @param {Ressource}         ressourceNew
     * @param {ressourceCallback} next
     * @memberOf $personneControl
     */
    function checkGroupes (context, ressourceOriginale, ressourceNew, next) {
      /**
       * ajoute l'erreur à la ressource et la passe à next
       * @private
       * @inner
       * @param {Error} error
       */
      function addErrorAndNext (error) {
        log.error(error)
        addError(ressourceNew, error.toString())
        next(null, ressourceNew)
      }

      if (!ressourceNew.groupes) ressourceNew.groupes = []
      if (!ressourceNew.groupesAuteurs) ressourceNew.groupesAuteurs = []
      if (!Array.isArray(ressourceNew.groupes)) {
        // on vide et on signale l'erreur sans aller plus loin
        log.error(new Error("groupes n'était pas un array"), ressourceNew.groupes)
        addError(ressourceNew, 'Groupes invalides')
        ressourceNew.groupes = []
        return next(null, ressourceNew)
      }
      if (!Array.isArray(ressourceNew.groupesAuteurs)) {
        log.error(new Error("groupesAuteurs n'était pas un array"), ressourceNew.groupesAuteurs)
        addError(ressourceNew, 'Groupes auteurs invalides')
        ressourceNew.groupesAuteurs = []
        return next(null, ressourceNew)
      }
      log.debug(`checkGroupes avec les groupes (${ressourceNew.groupes.join(',')}) groupesAuteurs (${ressourceNew.groupesAuteurs.join(',')})`)
      // les 2 cas où y'a rien à faire
      if (
        ressourceOriginale &&
        isSameSimpleArray(ressourceNew.groupes, ressourceOriginale.groupes) &&
        isSameSimpleArray(ressourceNew.groupesAuteurs, ressourceOriginale.groupesAuteurs)
      ) {
        // update sans modif de groupe
        return next(null, ressourceNew)
      }
      if (
        !ressourceOriginale &&
        !ressourceNew.groupes.length &&
        !ressourceNew.groupesAuteurs.length
      ) {
        // création de ressource sans groupes
        return next(null, ressourceNew)
      }

      // y'a des trucs à vérifier, les droits sur les groupes, seulement si la ressource existait
      // (sinon on suppose que si on est appelé c'est que le user a les droits de création de ressource donc d'updateGroupes dessus)
      if (ressourceOriginale && !$accessControl.hasPermission('updateGroupes', context, ressourceOriginale)) {
        // on remet comme c'était et on s'arrête là
        ressourceNew.groupes = ressourceOriginale.groupes
        ressourceNew.groupesAuteurs = ressourceOriginale.groupesAuteurs
        addError(ressourceNew, "Vous n'avez pas les droits suffisants pour modifier les groupes de cette ressource")
        return next(null, ressourceNew)
      }

      // on a les droits, on mémorise ce qui est demandé et ajoute les groupes sup s'il y en a
      const groupesVoulus = ressourceNew.groupes
      const groupesAuteursVoulus = ressourceNew.groupesAuteurs
      ressourceNew.groupes = []
      ressourceNew.groupesAuteurs = []
      // groupesVoulus contient tous ceux que l'on veut mettre, on vérifie s'ils y étaient déjà
      // et sinon qu'ils existent et que l'utilisateur peut les ajouter
      flow(groupesVoulus).seqEach(function (groupeNom) {
        const options = {
          whiteList: (ressourceOriginale && ressourceOriginale.groupes) || []
        }
        addGroupe(context, ressourceNew, groupeNom, options, this)
        // @todo faudrait vérifier que l'on a pas viré de groupe auxquel on appartient pas, et si c'était le cas cloner ?
      }).set(groupesAuteursVoulus).seqEach(function (groupeNom) {
        const options = {
          whiteList: (ressourceOriginale && ressourceOriginale.groupesAuteurs) || [],
          isGroupeAuteur: true
        }
        addGroupe(context, ressourceNew, groupeNom, options, this)
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
    function checkPersonnes (context, ressourceOriginale, ressourceNew, next) {
      // log.debug('checkPersonnes avec les auteurs initiaux', ressourceOriginale && ressourceOriginale.auteurs)
      // log.debug('les nouveaux auteurs', ressourceNew.auteurs)
      // log.debug('et les auteurs à ajouter', ressourceNew._auteursAdd)
      const pid = $accessControl.getCurrentUserPid(context)
      // les cas où on a rien à faire
      if (
        ressourceOriginale &&
        isSameSimpleArray(ressourceNew.auteurs, ressourceOriginale.auteurs) &&
        isSameSimpleArray(ressourceNew.contributeurs, ressourceOriginale.contributeurs) &&
        !ressourceNew._auteursAdd &&
        !ressourceNew._contributeursAdd
      ) {
        // y'avait une ressource et on a rien changé
        next(null, ressourceNew)
      } else if ($accessControl.hasPermission('updateAuteurs', context, ressourceOriginale)) {
        // on a tous les droits sur les auteurs et qqchose a changé

        // les pids que l'on veut mettre (case à cocher, parmi les précédents)
        const auteurs = []
        ressourceNew.auteurs.forEach((pid) => {
          if (!isInArray(auteurs, pid)) auteurs.push(pid)
        })
        // aj auteurs sup
        if (ressourceNew._auteursAdd) {
          const tmp = ressourceNew._auteursAdd.split(',')
          delete ressourceNew._auteursAdd
          tmp.forEach(function (pid) {
            pid = pid.trim() // vire d'éventuels espaces
            if (pid && !isInArray(auteurs, pid)) {
              auteurs.push(pid)
            }
          })
        }
        // idem contributeurs
        const contributeurs = []
        ressourceNew.contributeurs.forEach((pid) => {
          if (!isInArray(auteurs, pid) && !isInArray(contributeurs, pid)) contributeurs.push(pid)
        })
        // aj contributeurs sup
        if (ressourceNew._contributeursAdd) {
          const tmp = ressourceNew._contributeursAdd.split(',')
          delete ressourceNew._contributeursAdd
          tmp.forEach(function (pid) {
            if (pid && !isInArray(contributeurs, pid) && !isInArray(auteurs, pid)) contributeurs.push(pid)
          })
        }

        // puis reset des personnes sur la nouvelle ressource
        ressourceNew.auteurs = []
        ressourceNew.contributeurs = []

        flow().seq(function () {
          // auteurs voulus
          const nextStep = this
          flow(auteurs).seqEach(function (pid) {
            const nextAuteur = this
            $personneRepository.load(pid, function (error, personne) {
              if (error) {
                addError(ressourceNew, error.toString())
              } else if (personne) {
                ressourceNew.auteurs.push(personne.pid)
              } else {
                addWarning(ressourceNew, 'L’auteur d’identifiant ' + pid + ' n’existe pas')
              }
              nextAuteur()
            })
          }).done(nextStep)
        }).seq(function () {
          // contributeurs voulus
          const nextStep = this
          // flow contributeurs demandés
          flow(contributeurs).seqEach(function (pid) {
            const nextContributeur = this
            $personneRepository.load(pid, function (error, personne) {
              if (error) {
                addError(ressourceNew, error.toString())
              } else if (personne) {
                ressourceNew.contributeurs.push(personne.pid)
              } else {
                addWarning(ressourceNew, 'Le contributeur d’identifiant ' + pid + ' n’existe pas')
              }
              nextContributeur()
            })
          }).done(nextStep)
        }).seq(function () {
          // terminé, mais si y'a pas d'auteurs on met au moins le user courant, si y'en a un
          if (pid && !ressourceNew.auteurs.length) ressourceNew.auteurs.push(pid)
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
          if (ressourceNew.auteurs.indexOf(pid) === -1 && ressourceNew.contributeurs.indexOf(pid) === -1
          ) {
            // et il est pas mentionné, on le met en contributeur
            ressourceNew.contributeurs.push(pid)
          }
        } else {
          // si y'a pas d'auteurs on l'y ajoute
          ressourceNew.auteurs = [pid]
          // mais si y'a une ressource originale c'est pas normal
          if (ressourceOriginale) log.error(new Error('Il y avait une ressource sans auteurs ' + ressourceOriginale.oid))
        }
        next(null, ressourceNew)
      }
    }

    /**
     * Service de gestion des droits (donc demande le contexte en argument, parfois la ressource concernée)
     * à la jonction entre personne et ressource.
     * @service $personneControl
     */
    return {
      checkGroupes,
      checkPersonnes
    }
  })
}
