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
//var tools = require('../tools')
var Ref = require('./public/vendors/sesamath/Ref')
var jstreeConverter = require('./public/vendors/sesamath/tools/jstreeConverter')

module.exports = function (EntityRessource, $ressourceRepository, $routes, $settings) {
  /**
   * Retourne un node jstree (propriétés text, icon et a_attr qui porte nos data)
   * @see http://www.jstree.com/docs/json/ pour le format
   * @private
   * @param {Ressource} ressource
   */
  function getJstNode (ressource) {
    /**
     * Retourne les datas qui nous intéressent à mettre sur le tag a
     * (pour a_attr : data-ref, data-typeTechnique, href et alt)
     * @private
     * @param {Ressource} ressource
     * @return {Object}
     */
    function getAttr() {
      var attr = {}
      // id
      if (ressource.oid) attr['data-ref'] = ressource.oid
      else if (ressource.ref) attr['data-ref'] = ressource.ref
      else if (ressource.origine && ressource.idOrigine) attr['data-ref'] = ressource.origine +'/' +ressource.idOrigine
      // url complète
      if (ressource.displayUri) attr.href = $settings.get('application.baseUrl', '') +ressource.displayUri
      if (ressource.typeTechnique) attr['data-typeTechnique'] = ressource.typeTechnique
      if (ressource.resume) attr.alt = ressource.resume

      return attr
    }

    var node
    if (ressource) {
      node = {
        text  : ressource.titre,
        a_attr: getAttr(),
        icon  : ressource.typeTechnique + 'JstNode'
      }
    } else log.error(new Error("getJstNode appelé sans ressource"))

    return node
  }

  // les 2 méthodes jstree
  if (jstreeConverter) {
    jstreeConverter.setBaseUrl($settings.get('application.baseUrl', ''))
    $ressourceConverter.getJstreeChildren = jstreeConverter.getJstreeChildren
    $ressourceConverter.toJstree = jstreeConverter.toJstree
  }

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
   * @param {Array} ressources
   * @returns {Array} ressources
   */
  $ressourceConverter.addUrlsToList = function (ressources) {
    if (ressources && ressources.length) ressources.forEach(function (ressource) {
      ressource.urlDescribe = $routes.getAbs('describe', ressource)
      ressource.urlPreview = $routes.getAbs('preview', ressource)
      ressource.urlDisplay = $routes.getAbs('display', ressource)
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
            typeTechnique: ressourceBdd.typeTechnique
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
        flow(parent.enfants)
          // seqEach passe au suivant de la boucle quand la cb appelle this
          // et au seq suivant quand la dernière cb appele this
            .seqEach(function (enfant, enfantIndex) {
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
                     }) // seqEach
            .seq(function () {
                   nextStep()
                 })
            .catch(function(error) {
                     log.error(new Error("L'analyse de l'arbre a planté (cf aussi erreur suivante)"), parent)
                     log.error(error)
                     nextStep()
                   })
      } else {
        nextStep()
      }
    } // populateEnfants

    // checks
    if (ressource.typeTechnique !== 'arbre') {
      next(new Error("Impossible de peupler une ressource autre qu'un arbre"))
    } else if (!ressource.enfants ||
               !ressource.enfants instanceof Array ||
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
   * @returns {Arbre|undefined} l'arbre (ou undefined si la ressource n'était pas de typeTechnique arbre)
   */
  $ressourceConverter.toArbre = function (ressource) {
    var arbre
    if (ressource.typeTechnique === 'arbre') {
      var clone = _.clone(ressource)
      arbre = {
        oid          : clone.oid,
        titre        : clone.titre,
        typeTechnique: 'arbre',
        attributes   : clone.parametres.attributes || {},
        enfants      : clone.enfants || []
      }
    }

    return arbre
  }

  /**
   * Renvoie une Ref à une ressource (avec tous les enfants)
   * @memberOf $ressourceConverter
   * @param ressource
   * @return {Ref}
   */
  $ressourceConverter.toRef = function (ressource) {
    return new Ref(ressource)
  }

  /**
   * Renvoie la ressource au format compact (oid, origine, idOrigine, titre, typeTechnique, categories, restriction, dataUri)
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
      typeTechnique: ressource.typeTechnique,
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
    if (ressource.typeTechnique === 'arbre' && ressource.enfants) {
      ressource.enfants.forEach(function (enfant) {
        var child
        if (enfant.typeTechnique === 'arbre') {
          child = $ressourceConverter.toJstree(enfant)
        } else {
          child = getJstNode(enfant)
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
   * @param {Ressource|Ref} ressource Une ressource ou une ref à une ressource
   * @returns {Object}
   */
  $ressourceConverter.toJstree = function (ressource) {
    var node = getJstNode(ressource)
    if (ressource.typeTechnique === 'arbre') {
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
