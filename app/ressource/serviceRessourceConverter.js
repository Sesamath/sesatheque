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

/**
 * Service qui regroupe les fonctions de transformation de données sur des ressources
 * (objets vers vue ou résultat de post vers controller)
 * @service $ressourceConverter
 * @requires $ressourceRepository
 * @requires $routes
 * @requires $accessControl
 */
var $ressourceConverter = {}

var _ = require('lodash')
var flow = require('an-flow')
const {exists} = require('sesatheque-client/dist/sesatheques')
// pour les constantes et les listes, ça reste nettement plus pratique d'accéder directement à l'objet
// car on a l'autocomplétion sur les noms de propriété
var config = require('./config')

var sTools = require('sesajstools')

module.exports = function (EntityRessource, $ressourceRepository, $routes, $accessControl) {
  /**
   * Ajoute des relations à une ressource en vérifiant que ce sont des tableau de 2 éléments
   * dont le 1er est un id de relation valide
   * @memberOf $ressourceConverter
   * @param ressource
   * @param relations
   * @returns {string[]} Les erreurs éventuelles, ou false si y'a pas eu d'erreur mais que l'on a rien modifié (la relation y était déjà)
   */
  $ressourceConverter.addRelations = function (ressource, relations) {
    let errors = []
    let isModif = false
    if (Array.isArray(relations)) {
      relations.forEach(([relId, relTarget, rest]) => {
        if (rest) {
          errors.push('une relation doit être un tableau à deux éléments [typeRelation, ridRessource]')
        } else if (!config.listes.relations[relId]) {
          errors.push(`Une relation doit être un tableau à deux éléments [typeRelation, ridRessource], ${relId} n’est pas un type de relation valide`)
        } else if (typeof relTarget !== 'string' || relTarget.indexOf('/') < 1) {
          errors.push(`Une relation doit être un tableau à deux éléments [typeRelation, ridRessource], ${relTarget} n’est pas un rid valide`)
        } else if (relTarget === ressource.rid) {
          errors.push('Impossible de lier une ressource à elle-même')
        } else if (relTarget === (ressource.origine + '/' + ressource.idOrigine)) {
          errors.push(`Une relation doit être un tableau à deux éléments [typeRelation, ridRessource], ${relTarget} n’est pas un rid valide`)
        } else {
          // ça semble bon, on regarde si la base est valide

          // et si cette relation n'y est pas déjà...
          const alreadyHere = ressource.relations.find(([exRelId, exRelTarget]) => exRelId === relId && exRelTarget === relTarget)
          if (!alreadyHere) {
            const [baseId, , oups] = relTarget.split('/')
            if (oups) {
              errors.push(`Une relation doit être un tableau à deux éléments [typeRelation, ridRessource], ${relTarget} n’est pas un rid valide`)
            } else if (!exists(baseId)) {
              errors.push(`Une relation doit être un tableau à deux éléments [typeRelation, ridRessource], ${relTarget} n’est pas un rid valide (baseId inconnue)`)
            } else {
              ressource.relations.push([relId, relTarget])
              isModif = true
            }
          }
        }
      })
    } else {
      errors.push('relations incorrectes')
    }

    // si y'a ni erreur ni modifs on return false pour dire qu'il n'y a rien à changer
    if (!errors.length && !isModif) errors = false

    return errors
  }

  /**
   * Ajoute les propriétés urlXXX à chaque elt du tableau de ressource
   * @memberOf $ressourceConverter
   * @param {Ressource[]}   ressources
   * @param {Context} context
   * @returns {Array} ressources
   */
  $ressourceConverter.addUrlsToList = function (ressources, context) {
    if (!ressources) return []
    if (!ressources.length) return []
    return ressources.map((ressource) => {
      ressource.urlDescribe = $routes.getAbs('describe', ressource)
      ressource.urlPreview = $routes.getAbs('preview', ressource)
      ressource.urlDisplay = $routes.getAbs('display', ressource)
      if (context && $accessControl.hasPermission('update', context, ressource)) {
        ressource.urlEdit = $routes.getAbs('edit', ressource)
      }
      return ressource
    })
  }

  // noinspection FunctionWithMoreThanThreeNegationsJS
  /**
   * Peuple les enfants d'un arbre en allant les chercher en bdd
   * @memberOf $ressourceConverter
   * @param {Context} context
   * @param ressource
   * @param next
   */
  $ressourceConverter.populateArbre = function (context, ressource, next) {
    /**
     * Parcours les enfants de parent pour les transformer et appeler nextStep
     * (sans argument, nextStep peut être le this de seq)
     * @private
     * @param parent
     * @param nextStep
     */
    function populateEnfants (parent, nextStep) {
      /**
       * Met à jour un enfant chez son parent d'après une ressource récupérée en bdd
       * @private
       * @param enfantIndex
       * @param ressourceBdd
       * @param next
       */
      function updateEnfant (enfantIndex, ressourceBdd, next) {
        var enfant = parent.enfants[enfantIndex]
        if (ressourceBdd) {
          var newEnfant = {
            oid: ressourceBdd.oid,
            titre: ressourceBdd.titre,
            type: ressourceBdd.type
          }
          if (enfant.contenu) newEnfant.contenu = enfant.contenu
          if (enfant.enfants && enfant.enfants.length) newEnfant.enfants = enfant.enfants
          // visiblement seq casse les références, on affecte directement à la variable parent restée hors du flux
          parent.enfants[enfantIndex] = newEnfant
        } else {
          // sinon on laisse en l'état mais on logue
          log.dataError('On a pas trouvé la ressource ' + enfant.idOrigine + ' ' + enfant.id)
          parent.enfants[enfantIndex].titre += ' (non trouvé)'
        }
        populateEnfants(parent.enfants[enfantIndex], next)
      }

      if (parent.enfants && parent.enfants.length) {
        flow(parent.enfants).seqEach(function (enfant, enfantIndex) {
          var finEach = this
          // pour permettre de récupérer des objets d'après leur ref d'origine, on accepte aussi id et idOrigine (à la place de ref)
          if (enfant.origine && enfant.idOrigine) {
            // on le cherche en db
            // var logSuffix = enfant.idOrigine + ' - ' + enfant.id
            // log('load ' + logSuffix)
            $ressourceRepository.loadByOrigin(enfant.origine, enfant.idOrigine, function (error, ressource) {
              if (error) log.error(error)
              log.debug('on traite l’enfant ' + enfant.titre + ' et on a récupéré ', ressource)
              updateEnfant(enfantIndex, ressource, finEach)
            })
          } else if (enfant.aliasOf) {
            $ressourceRepository.load(enfant.aliasOf, function (error, ressource) {
              if (error) log.error(error)
              updateEnfant(enfantIndex, ressource, finEach)
            })
          } else {
            // pas de ref ni idOrigine
            populateEnfants(enfant, finEach)
          }
        }).seq(function () {
          nextStep()
        }).catch(function (error) {
          log.error(new Error("L'analyse de l'arbre a planté (cf aussi erreur suivante)"), parent)
          log.error(error)
          nextStep()
        })
      } else {
        nextStep()
      }
    } // populateEnfants

    // checks
    if (ressource.type !== 'arbre') {
      next(new Error('Méthode réservée au type arbre'))
    } else if (!sTools.isArrayNotEmpty(ressource.enfants)) {
      log.debug('arbre vide', ressource)
      next(new Error('Impossible de peupler un arbre vide'))
    } else {
      // go
      populateEnfants(ressource, next)
    }
  }

  return $ressourceConverter
}
