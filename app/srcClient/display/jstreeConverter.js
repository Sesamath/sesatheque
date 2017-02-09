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
 * Fichier à virer dès que tout le monde utilisera le module sesatheque-jstree
 * @obsolete
 */

var log = require('sesajstools/utils/log')

/**
 * La gestion des sesatheques
 * @private
 * @type {Object}
 */
var sesatheques = require('sesatheque-client/dist/sesatheques.js')

/**
 * Retourne les datas qui nous intéressent à mettre sur le tag a
 * (propriété a_attr du node, avec href, alt, data-(ref|type|baseid|dataurl)
 * @private
 * @return {Object}
 */
function getAttr (ressource, parentBaseId) {
  var attr = {}
  var base = getBase(ressource, parentBaseId)
  var baseId = getBaseId(ressource, parentBaseId)
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
  if (displayUrl) attr.href = displayUrl
  if (dataUrl) attr['data-dataurl'] = dataUrl
  if (baseId) attr['data-baseid'] = baseId
  if (ressource.type) attr['data-type'] = ressource.type
  if (ressource.resume) attr.alt = ressource.resume

  return attr
}

/**
 * Retourne la base d'une ressource si elle est fixée et connue (undefined sinon, à interpréter comme /)
 * @private
 * @param {Ressource|Ref} ressource
 * @param {string} parentBaseId
 * @returns {string} baseUrl ("/" si baseId pas trouvée ou inconnue)
 */
function getBase (ressource, parentBaseId) {
  let baseUrl
  try {
    if (ressource && ressource.baseId) baseUrl = sesatheques.getBaseUrl(ressource.baseId)
    else if (parentBaseId) baseUrl = sesatheques.getBaseUrl(parentBaseId)
  } catch (error) {
    console.error(error)
  }
  // on connait pas on retourne /
  if (!baseUrl) baseUrl = '/'
  return baseUrl
}

/**
 * Retourne la baseId d'une ressource si elle est connue (undefined sinon)
 * @param {Ressource|Ref} ressource
 * @param {string} parentBaseId
 * @returns {string|undefined} baseId si connue
 */
function getBaseId (ressource, parentBaseId) {
  try {
    if (ressource && ressource.baseId) return sesatheques.getBaseUrl(ressource.baseId)
    if (parentBaseId) return sesatheques.getBaseUrl(parentBaseId)
  } catch (error) {
    console.error(error)
  }
}

/**
 * Retourne un node jstree (propriétés text, icon et a_attr qui porte nos data)
 * SANS les enfants (utiliser toJstree pour les avoir)
 * @see http://www.jstree.com/docs/json/ pour le format
 * @param {Ressource} ressource
 * @param {string} parentBaseId
 */
function getJstNode (ressource, parentBaseId) {
  if (ressource) {
    return {
      text: ressource.titre,
      a_attr: getAttr(ressource, parentBaseId),
      icon: ressource.type + 'JstNode'
    }
  } else {
    throw new Error('getJstNode appelé sans ressource')
  }
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
    if (ressource.baseId) parentBaseId = ressource.baseId
    ressource.enfants.forEach(function (enfant) {
      var child
      if (enfant.type === 'arbre') {
        child = toJstree(enfant, parentBaseId)
      } else {
        child = getJstNode(enfant, parentBaseId)
      }
      children.push(child)
    })
  }
  if (children.length === 0) children = true

  return children
}

/**
 * Transforme un ressource de la bibli en node pour jstree
 * (il faudra le mettre dans un tableau, à un seul élément si c'est un arbre)
 * @param {Ressource|Alias} ressource Une ressource ou une référence à une ressource
 * @param {string}          [parentBaseId]
 * @returns {Object}
 */
function toJstree (ressource, parentBaseId) {
  var node = getJstNode(ressource, parentBaseId)
  if (ressource.type === 'arbre') {
    if (ressource.enfants && ressource.enfants.length) {
      node.children = getJstreeChildren(ressource, parentBaseId)
    } else {
      node.children = true
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
  getJstNode: getJstNode,
  getEnfants: getEnfants,
  getJstreeChildren: getJstreeChildren,
  toJstree: toJstree,
  toRef: toRef
}

module.exports = jstreeConverter
