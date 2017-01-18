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

var log = require('sesajstools/utils/log')

/**
 * La liste des sesatheques
 * @private
 * @type {Object}
 */
var sesatheques = require('sesatheque-client/sesatheques.js')

/**
 * Ajoute des sésathèques à la liste connue, pour les baseId des éléments externes de l'arbre
 * @param {object} newSesatheques Un objet avec les sésathèques à ajouter {baseId:baseUrl,…}
 */
function addSesatheques (newSesatheques) {
  if (typeof newSesatheques === 'object') {
    for (var baseId in newSesatheques) {
      if (newSesatheques.hasOwnProperty(baseId) && newSesatheques[baseId].substr(0, 4) === 'http') {
        sesatheques[baseId] = newSesatheques[baseId]
        if (sesatheques[baseId].substr(-1) !== '/') sesatheques[baseId] += '/'
      }
    }
  }
}

/**
 * Retourne les datas qui nous intéressent à mettre sur le tag a
 * (pour a_attr : data-ref, data-type, href et alt)
 * @private
 * @return {Object}
 */
function getAttr (ressource, parentBaseId) {
  var attr = {}
  var base = getBase(ressource) || '/'
  // ref
  var ref = ressource.id || ressource.ref || ressource.oid
  if (!ref && ressource.origine && ressource.idOrigine) ref = ressource.origine + '/' + ressource.idOrigine
  var isPublic = (ressource.public || !ressource.restriction)
  var displayUrl
  var dataUrl
  if (ref) {
    attr['data-ref'] = ref
    // displayUrl
    if (isPublic) displayUrl = base + 'public/voir/' + ref
    else if (ressource.cle) displayUrl = base + 'public/voir/cle/' + ressource.cle
    else displayUrl = base + 'ressource/voir/' + ref
    // dataUrl
    if (isPublic) dataUrl = base + 'api/public/' + ref
    else if (ressource.cle) dataUrl = base + 'api/public/cle/' + ressource.cle
    else dataUrl = base + 'api/ressource/' + ref
  } else if (ressource.cle) {
    displayUrl = base + 'public/voir/cle/' + ressource.cle
    dataUrl = base + 'api/public/cle/' + ressource.cle
  }
  if (displayUrl) {
    attr.href = displayUrl
    attr['data-displayurl'] = displayUrl
  }
  if (dataUrl) attr['data-dataurl'] = dataUrl
  if (ressource.baseId) attr['data-baseid'] = ressource.baseId
  else if (ressource.base) attr['data-baseid'] = getBaseId(ressource.base)
  else if (parentBaseId) attr['data-baseid'] = parentBaseId
  if (ressource.type) attr['data-type'] = ressource.type
  if (ressource.resume) attr.alt = ressource.resume

  return attr
}

/**
 * Retourne la base d'une ressource si elle est fixée et connue (undefined sinon, à interpréter comme /)
 * @private
 * @param ressource
 * @returns {*}
 */
function getBase (ressource) {
  if (ressource && ressource.baseId) {
    if (sesatheques[ressource.baseId]) {
      return sesatheques[ressource.baseId]
    } else {
      log.error('base ' + ressource.baseId + ' inconnue')
    }
  }
}

/**
 * Retourne la baseId d'une ressource, si base est connue (undefined sinon)
 * @param {string} base l'url de base cherchée
 * @returns {string|undefined} baseId si connue
 */
function getBaseId (base) {
  for (var id in sesatheques) {
    if (sesatheques[id] === base) return id
  }
}

/**
 * Retourne un node jstree (propriétés text, icon et a_attr qui porte nos data)
 * @see http://www.jstree.com/docs/json/ pour le format
 * @param {Ressource} ressource
 */
function getJstNode (ressource, parentBaseId) {
  var node
  if (ressource) {
    if (!parentBaseId && ressource.baseId) {
      parentBaseId = ressource.baseId
      // et on l'ajoute avec l'url / si on la connait pas
      if (!sesatheques[parentBaseId]) sesatheques[parentBaseId] = '/'
    }
    node = {
      text: ressource.titre,
      a_attr: getAttr(ressource, parentBaseId),
      icon: ressource.type + 'JstNode'
    }
  } else throw new Error('getJstNode appelé sans ressource')

  return node
}

/**
 * Retourne un tableau children au format jstree
 * @param {string} nodeId Le nodeId dont on veut les enfants, passer '#' ou null pour la racine
 *               (pour trouver l'objet jstree._model.data[nodeId])
 * @param {object} jstree L'objet jstree complet, retourné par $.jstree.reference('#leTree')
 * @return {Array} Le tableau des enfants de nodeId
 */
function getEnfants (nodeId, jstree) {
  // log('getEnfants de ' +nodeId, jstree)
  var enfants = []
  var i = 0
  try {
    if (!nodeId) nodeId = '#'
    var root = jstree._model.data
    root[nodeId].children.forEach(function (rootChildId) {
      var child = root[rootChildId]
      var enfant = toRef(child, jstree)
      if (i < 5) {
        log('traitement child', child)
        log('devenu', enfant)
        i++
      }
      if (enfant && (enfant.ref || enfant.type === 'arbre')) enfants.push(enfant)
      else log.error('Pb de conversion du child, ni ref ni arbre', child)
    })
  } catch (error) {
    log.error(error)
  }
  // log('pour ' +nodeId +' on va retourner', enfants)

  return enfants
}

/**
 * Retourne un tableau children au format jstree
 * @param {Ressource} ressource
 * @param {string}    [parentBaseId]
 * @return {Array} Le tableau des enfants
 */
function getJstreeChildren (ressource, parentBaseId) {
  var children = []
  if (ressource.type === 'arbre' && ressource.enfants && ressource.enfants.forEach) {
    ressource.enfants.forEach(function (enfant) {
      var child
      if (ressource.baseId) parentBaseId = ressource.baseId
      if (enfant.type === 'arbre') {
        child = toJstree(enfant, parentBaseId)
      } else {
        child = getJstNode(enfant, parentBaseId)
      }
      children.push(child)
    })
  }

  return children
}

/**
 * Transforme un ressource de la bibli en node pour jstree
 * (il faudra le mettre dans un tableau, à un seul élément si c'est un arbre)
 * @param {Ressource|Alias} ressource Une ressource ou une référence à une ressource
 * @returns {Object}
 */
function toJstree (ressource, parentBaseId) {
  var node = getJstNode(ressource, parentBaseId)
  if (ressource.type === 'arbre') {
    if (ressource.enfants && ressource.enfants.length) {
      node.children = getJstreeChildren(ressource, parentBaseId)
    } else {
      node.children = []
    }
  }

  return node
}

/**
 * Retourne une Ref à partir d'un node jstree
 * @param {jQueryElement} node Un element de l'objet reference jstree _model.data[childId]
 * @param {object} jstree L'objet jstree complet, retourné par $.jstree.reference('#leTree')
 * @returns {Ref} La ref (presque, ref, titre, type, avec displayUrl & resume en plus,
 *                mais pas categories, et enfants seulement si on passe le jstree complet)
 */
function toRef (node, jstree) {
  // log('toRef de', node)
  var item = {}
  var nodeSrc
  if (node.text && node.a_attr) {
    nodeSrc = node
  } else if (node.original) {
    nodeSrc = node.original
  } else {
    log.error('node impossible à convertir en ref', node)
  }
  if (nodeSrc) {
    item.titre = nodeSrc.text
    if (nodeSrc.a_attr) {
      item.type = nodeSrc.a_attr['data-type']
      if (item.type === 'arbre' && node.children && node.children.length && jstree) {
        item.enfants = getEnfants(node.id, jstree)
      }
      if (nodeSrc.a_attr['data-ref']) item.ref = nodeSrc.a_attr['data-ref']
      if (nodeSrc.a_attr['data-baseid']) item.baseId = nodeSrc.a_attr['data-baseid']
      if (nodeSrc.a_attr.alt) item.resume = nodeSrc.a_attr.alt
    }
    // log('converti en', item)
  }

  return item
}

/**
 * Exporte des méthodes pour convertir ou manipuler des jstree
 * @service display/jstreeConverter
 */
var jstreeConverter = {
  addSesatheques: addSesatheques,
  getJstNode: getJstNode,
  getEnfants: getEnfants,
  getJstreeChildren: getJstreeChildren,
  toJstree: toJstree,
  toRef: toRef
}

module.exports = jstreeConverter
