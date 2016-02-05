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
 * @requires $settings
 */
var $ressourceConverter = {}

var _ = require('lodash')
var flow = require('an-flow')
//var moment = require('moment')
// pour les constantes et les listes, ça reste nettement plus pratique d'accéder directement à l'objet
// car on a l'autocomplétion sur les noms de propriété
var config = require('./config')
var appConfig = require('../config')
//var tools = require('../tools')
var Alias = require('./srcClient/constructors/Alias')
var jstreeConverter = require('./srcClient/display/jstreeConverter')
var defaultBase = appConfig.application.baseUrl

module.exports = function (EntityRessource, $ressourceRepository, $routes, $accessControl) {
  /**
   * Ajoute des relations à une ressource en vérifiant que ce sont des tableau de 2 éléments
   * dont le 1er est un id de relation valide
   * @memberOf $ressourceConverter
   * @param ressource
   * @param relations
   * @returns {Array} Les erreurs éventuelles, ou false si y'a pas eu d'erreur mais que l'on a rien modifié (la relation y était déjà)
   */
  $ressourceConverter.addRelations = function (ressource, relations) {
    var errors = []
    var isModif = false
    if (_.isArray(relations)) {
      relations.forEach(function (relation) {
        if (relation && relation.length === 2) {
          var idRelation = relation[0]
          if (relation[1] == ressource.oid || relation[1] === (ressource.origine +'/' +ressource.idOrigine))
              errors.push("Impossible de lier une ressource à elle-même")
          else if (config.listes.relations[idRelation]) {
            // on regarde si cette relation n'y est pas déjà...
            var exists = false
            _.each(ressource.relations, function (relationExistante) {
              if (relationExistante[0] == relation[0] && relationExistante[1] == relation[1]) {
                exists = true
                return false // pas la peine de continuer
              }
            })
            if (!exists) {
              ressource.relations.push(relation)
              isModif = true
            }
          }
          else errors.push(idRelation +" n'est pas un identifiant de relation valide")
        } else {
          errors.push("une relation doit être un tableau à deux éléments (idRelation, idRessource, ce dernier peut être un oid ou une chaine origine/idOrigine")
        }
      })
    } else errors.push('relations incorrectes')

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
    if (ressources && ressources.length) ressources.forEach(function (ressource) {
      ressource.urlDescribe = $routes.getAbs('describe', ressource)
      ressource.urlPreview = $routes.getAbs('preview', ressource)
      ressource.urlDisplay = $routes.getAbs('display', ressource)
      if (context && $accessControl.hasPermission('update', context, ressource)) ressource.urlEdit = $routes.getAbs('edit', ressource)
    })

    return ressources
  }

  //noinspection FunctionWithMoreThanThreeNegationsJS
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
    function populateEnfants(parent, nextStep) {
      /**
       * Met à jour un enfant chez son parent d'après une ressource récupérée en bdd
       * @private
       * @param enfantIndex
       * @param ressourceBdd
       * @param next
       */
      function updateEnfant(enfantIndex, ressourceBdd, next) {
        var enfant = parent.enfants[enfantIndex]
        if (ressourceBdd) {
          var newEnfant = {
            oid          : ressourceBdd.oid,
            titre        : ressourceBdd.titre,
            type: ressourceBdd.type
          }
          if (enfant.contenu) newEnfant.contenu = enfant.contenu
          if (enfant.enfants && enfant.enfants.length) newEnfant.enfants = enfant.enfants
          // visiblement seq casse les références, on affecte directement à la variable parent restée hors du flux
          parent.enfants[enfantIndex] = newEnfant
        } else {
          // sinon on laisse en l'état mais on logue
          log.errorData("On a pas trouvé la ressource " +enfant.idOrigine +' ' +enfant.id)
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
            //var logSuffix = enfant.idOrigine + ' - ' + enfant.id
            //log('load ' + logSuffix)
            $ressourceRepository.loadByOrigin(enfant.origine, enfant.idOrigine, function (error, ressource) {
              log("on traite l'enfant " +enfant.titre +" et on a récupéré ", ressource)
              updateEnfant(enfantIndex, ressource, finEach)
            })
          } else if (enfant.ref) {
            $ressourceRepository.load(enfant.ref, function (error, ressource) {
              updateEnfant(enfantIndex, ressource, finEach)
            })
          } else {
            // pas de ref ni idOrigine
            populateEnfants(enfant, finEach)
          }
         }).seq(function () {
           nextStep()
         }).catch(function(error) {
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
      next(new Error("Impossible de peupler une ressource autre qu'un arbre"))
    } else if (!ressource.enfants ||
               !(ressource.enfants instanceof Array) ||
               !ressource.enfants.length
    ) {
      log.debug('arbre vide', ressource)
      next(new Error("Impossible de peupler un arbre vide"))
    } else {
      // go
      populateEnfants(ressource, next)
    }
  }

  /**
   * Transforme la ressource de type arbre en arbre (les parametres de la ressource où on ajoute titre et id)
   * @memberOf $ressourceConverter
   * @returns {Arbre|undefined} l'arbre (ou undefined si la ressource n'était pas de type arbre)
   */
  $ressourceConverter.toArbre = function (ressource) {
    var arbre
    if (ressource.type === 'arbre') {
      var clone = _.clone(ressource)
      arbre = {
        oid          : clone.oid,
        titre        : clone.titre,
        type: 'arbre',
        attributes   : clone.parametres.attributes || {},
        enfants      : clone.enfants || []
      }
    }

    return arbre
  }

  /**
   * Renvoie un Alias à une ressource (le controleur devra ajouter le userOid)
   * @memberOf $ressourceConverter
   * @param ressource
   * @return {Alias}
   */
  $ressourceConverter.toAlias = function (ressource) {
    return new Alias(ressource)
  }

  /**
   * Renvoie une Ref à une ressource, c'est un Alias sans userOid, avec enfants éventuels
   * (si ce qui sort contient oid ET ref, c'était un alias)
   * @memberOf $ressourceConverter
   * @param {Ressource} ressource
   * @return {Object} un Alias sans oid ni userOid, mais avec enfants éventuels
   */
  $ressourceConverter.toRef = function (ressource) {
    var alias = new Alias(ressource)
    // on vire le proprio
    if (alias.userOid) delete alias.userOid
    // et on ajoute d'éventuels enfants
    if (alias.type === "arbre" && ressource.enfants) alias.enfants = ressource.enfants

    return alias
  }

  /**
   * Renvoie la ressource au format compact (oid, origine, idOrigine, titre, type, categories, restriction, dataUri)
   * @memberOf $ressourceConverter
   * @param ressource
   * @return {Object}
   */
  $ressourceConverter.toCompactFormat = function (ressource) {
    return {
      oid          : ressource.oid,
      origine      : ressource.origine,
      idOrigine    : ressource.idOrigine,
      titre        : ressource.titre,
      type: ressource.type,
      categories   : ressource.categories,
      restriction  : ressource.restriction,
      dataUri      : ressource.dataUri || $routes.getAbs('api', ressource)
    }
  }

  /**
   * Retourne un tableau children au format jstree
   * @memberOf $ressourceConverter
   * @param ressource
   * @return {Array} Le tableau des enfants
   */
  $ressourceConverter.getJstreeChildren = function (ressource) {
    var children = []
    if (ressource.type === 'arbre' && ressource.enfants) {
      ressource.enfants.forEach(function (enfant) {
        var child
        if (enfant.type === 'arbre') {
          child = $ressourceConverter.toJstree(enfant)
        } else {
          child = jstreeConverter.getJstNode(enfant, defaultBase)
        }
        children.push(child);
      });
    }

    return children
  }

  /**
   * Transforme un ressource de la bibli en node pour jstree
   * (il faudra le mettre dans un tableau, à un seul élément si c'est un arbre)
   * @memberOf $ressourceConverter
   * @param {Ressource|Alias} ressource Une ressource ou une référence à une ressource
   * @returns {Object}
   */
  $ressourceConverter.toJstree = function (ressource) {
    var node = jstreeConverter.getJstNode(ressource, defaultBase)
    if (ressource.type === 'arbre') {
      if (ressource.enfants && ressource.enfants.length) {
        node.children = $ressourceConverter.getJstreeChildren(ressource)
      } else {
        // url pour récupérer les enfants
        var url
        if (ressource.oid) url = '/api/jstree?id=' + ressource.oid
        else if (ressource.ref) url = '/api/jstree?id=' + ressource.ref
        else if (ressource.origine && ressource.idOrigine) url = '/api/jstree?id=' + ressource.origine + '/' + ressource.idOrigine
        if (url) {
          node.children = true
          node.data = {url: url + '&children=1'}
        }
      }
    }

    return node
  }

  return $ressourceConverter
}
