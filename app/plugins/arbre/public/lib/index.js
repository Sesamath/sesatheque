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
 * Ce fichier fait partie de lapplication Sésathèque, créée par lassociation Sésamath.
 *
 * Sésathèque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sésathèque est distribué dans lespoir quil sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou dADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */
'use strict'
// ce module est réservé à un usage dans un navigateur (build utilise jQuery)
import {fetchRef, callApiUrl} from 'sesatheque-client/src/fetch'
import {addSesatheque, getBaseIdFromRessource} from 'sesatheque-client/src/sesatheques'
import log from 'sesajstools/utils/log'
import {getJstreeChildren, toJstree} from './convert'

/**
 * Une mémorisation des conteneurs associés à des éléments pour build
 * @private
 * @type {Map}
 */
const builded = new Map()

// on réexporte ça pour éviter à ceux qui voudraient l'utiliser de charger un autre js
export {addSesatheque, log, getJstreeChildren, toJstree}

/**
 * Retourne une callback à mettre dans un arbre jstree dans core.data
 * @param {Ressource} ressource de type arbre (la racine)
 * @param {object} options avec éventuellement timeout et errorCallback
 * @returns {Function} fct à mettre sur jstree.core.data, appelée avec (node, cb) qui doit rappeler cb avec la liste des enfants
 *                     cf https://www.jstree.com/api/#/?q=data&f=$.jstree.defaults.core.data
 */
export function getDataCallback (ressource, options) {
  function errorCallback (error, next) {
    if (typeof options.errorCallback === 'function') options.errorCallback(error)
    // et de toute façon on log et rappelle next
    log.error(error)
    next([error.toString()])
  }

  /**
   * Callback à mettre dans core.data de l'objet passé à jstree pour initialiser un arbre
   * @param {object} node node jstree
   * @param {function} next callback à appeler avec les enfants à charger (donc un array)
   */
  function dataCallback (node, next) {
    log('dataCallback sur le node', node)
    if (node && node.id === '#') {
      const rootElt = toJstree(ressource)
      rootElt.state = {opened: true}
      log('rootNode', rootElt)
      next(rootElt)
    } else if (node) {
      // si y'à déja les children rien à faire sinon les retourner,
      // mais normalement jstree nous appelle pas dans ce cas là
      if (node.children && node.children.length) return next(node.children)
      // faut faire l'appel ajax nous même car jstree peut pas mixer json initial + ajax ensuite
      // @see http://git.net/jstree/msg12107.html
      const url = node.url || (node.data && node.data.url) || (node.a_attr && node.a_attr['data-dataurl'])
      if (url) {
        callApiUrl(url, {}, function (error, ressource) {
          // on a toujours error ou ressource non vide sans propriété error
          if (error) return errorCallback(error, next)
          if (ressource.type === 'arbre') {
            const children = getJstreeChildren(ressource, baseId)
            log('children récupérés', children)
            next(children)
          } else {
            log.error(new Error('le chargement des enfants ne remonte pas un arbre'))
            log.error('le node', node)
            log.error('la ressource récupérée', ressource)
            errorCallback('Aucun enfant récupéré', next)
          }
        })
      } else {
        errorCallback('Pas d’url pour récupérer ces éléments', next)
      }
    } else {
      // là faut pas pousser…
      throw new Error('Demande de chargement sans node')
    }
  }
  if (!ressource) throw new Error('ressource manquante')
  if (ressource.type !== 'arbre') throw new Error('La ressource n’est pas un arbre')
  const baseId = getBaseIdFromRessource(ressource)
  if (!options) options = {}
  if (options.debug) log.enable()

  return dataCallback
}

/**
 * Ajoute un arbre jstree dans le dom
 * Attention, pour écouter les événements jstree, il faut impérativement charger jQuery de votre coté puis le passer dans options.$,
 * sinon $(document).on('dnd_xxxx.vakata') ne sera jamais appelé chez vous !
 * @param elt
 * @param arbre
 * @param options avec les propriétés éventuelles
 * @param options.check_callback false par défaut, cf https://www.jstree.com/api/#/?q=check_callback&f=$.jstree.defaults.core.check_callback)
 * @param options.contextmenu: pour ajouter des actions au clic droit sur les items,
 *                    cf https://www.jstree.com/api/#/?q=$.jstree.defaults.contextmenu
 * @param options.debug si true on affiche la stack d'erreur éventuelle en console
 * @param options.dnd Si présent et dnd pas dans plugins on l'ajoutera
 *                     pour le contenu possible cf https://www.jstree.com/api/#/?q=dnd&f=$.jstree.defaults.dnd
 * @param options.errorCallback sera rappelée avec une erreur en cas de pb de chargement,
 *                              sinon l'erreur sera affichée au dessus de l'arbre
 * @param {object} options.listeners  passer une liste `{'eventFoo.jstree': cb1, 'eventBar.jstree': cb2, …}`
 * @param options.plugins array passé à jstree, cf https://www.jstree.com/plugins/
 * @param options.timeout delai max en ms pour charger les enfants
 * @return {object} Le wrapper jQuery de l'arbre
 */
export function build (elt, arbre, options) {
  if (typeof window === 'undefined') throw new Error('Cette méthode ne peut fonctionner que dans un navigateur')
  if (!options) options = {}
  const $ = options.$ || options.jQuery || require('jquery')
  if (!$.jstree) require('jstree')

  // vu qu'on reconstruit un nouveau conteneur si y'a pas de callback d'erreur,
  // faut qu'on mémorise l'élément qu'on nous passe pour le lier au conteneur qu'on a peut-être
  // créé la dernière fois, indispensable pour
  // - supprimer l'arbre avant d'en reconstruire un autre (sinon la reconstruction marche pas, et jstree dit rien)
  // - conserver le $errorContainer associé à $errorContainer
  let $container
  const memo = builded.get(elt)
  if (memo) {
    $container = memo[0]
    // si on nous passe une nouvelle fct errorCallback elle prend le dessus sur celle qu'on avait stockée la dernière fois
    if (!options.errorCallback) options.errorCallback = memo[1]
    // si on avait un conteneur d'erreur mémorisé pour cet élément (donc construit ici), on le vide
    if (memo[2]) memo[2].empty() // c'est $errorContainer donc avec la méthode jQuery empty
  } else {
    // c'est la 1re fois qu'on nous passe cet elt
    $container = $(elt)
    let $errorContainer
    // si on nous fourni pas de callback d'erreur on la gère nous-même
    if (!options.errorCallback) {
      // on crée 2 div dans l'ancien $container (un pour les erreurs et l'autre pour le nouveau $container)
      $errorContainer = $('<div></div>').appendTo($container)
      $container = $('<div></div>').appendTo($container)
      options.errorCallback = function errorCallback (error) {
        if (!error) return console.error(new Error('errorCallback appelé sans erreur à afficher'))
        if (options.debug && error.stack) $errorContainer.append(`<pre class="error">${error.stack}</pre>`)
        else $errorContainer.append(`<p class="error">${error}</p>`)
      }
    }
    builded.set(elt, [$container, options.errorCallback, $errorContainer])
  }

  // si on ne détruit pas un éventuel jstree existant il refuse d'en charger un autre
  const treeRef = $.jstree.reference($container)
  if (treeRef) treeRef.destroy()

  // on peut charger un arbre
  const jstData = {
    core: {
      check_callback: options.check_callback || false,
      data: getDataCallback(arbre, options)
      // data: function (node, next) {
      //   console.log('dataCallback', node)
      //   if (node && node.id === '#') {
      //     next([ 'root 1', 'root 2', 'root3' ])
      //   } else {
      //     next()
      //   }
      // }
    }
  }
  // plugins
  if (options.plugins && Array.isArray(options.plugins)) jstData.plugins = options.plugins
  // drag & drop
  if (options.dnd) {
    jstData.dnd = options.dnd
    if (jstData.plugins) {
      if (jstData.plugins.indexOf('dnd') === -1) jstData.plugins.push('dnd')
    } else {
      jstData.plugins = [ 'dnd' ]
    }
  }
  // clic droit
  if (options.contextmenu) {
    jstData.contextmenu = options.contextmenu
    // et on ajoute le plugin si ce n'est pas déjà fait
    if (jstData.plugins) {
      if (jstData.plugins.indexOf('contextmenu') === -1) jstData.plugins.push('contextmenu')
    } else {
      jstData.plugins = [ 'contextmenu' ]
    }
  }
  // listeners
  if (options.listeners) {
    Object.keys(options.listeners).forEach((eventName) => {
      $container.on(eventName, options.listeners[eventName])
    })
  }

  // console.log('sesatheque-client:jstree.build va construire', jstData)
  $container.jstree(jstData)

  return $container
}

/**
 * Ajoute un node à un arbre déjà dans le dom
 * @param {jqObject} $container Le conteneur jQuery de l'arbre (retourné par build)
 * @param {Ressource|Ref|string} ressource ou id
 * @param {string} [parentRef=#] L'id jstree du parent auquel ajouter ce node
 * @param {simpleCallback} next appelé avec (error, newNode) une fois le node chargé
 */
export function addNode ($container, ressource, parentRef = '#', next) {
  function create () {
    instance.create_node(parent, toJstree(ressource), 'last', function (newNode) {
      log('cb de addNode', arguments)
      next(null, newNode)
    })
  }
  const instance = $container.jstree(true)
  if (!instance) throw new Error('Arbre introuvable')
  const parent = instance.get_node(parentRef)
  if (!parent) throw new Error('Référence du parent introuvable')
  if (typeof ressource === 'string') {
    fetchRef(ressource, function (error, ref) {
      if (error) return next(error)
      ressource = ref
      create()
    })
  } else {
    create()
  }
}

/**
 * Retourne un node sous forme de Ref
 * @param {jqObject} $container Le conteneur jQuery de l'arbre (retourné par build)
 * @param {string} id L'id jstree du node que l'on veut récupérer, passer '#' pour récupérer l'arbre complet
 */
export function getAsRef ($container, jstId) {
  const instance = $container.jstree(true)
  if (!instance) throw new Error('Arbre jstree introuvable dans cet élément')
  if (jstId === '#') {
    // la racine est un cas particulier où on veut le 1er et unique enfant
    const root = instance.get_node(jstId)
    if (root.children.length !== 1) throw new Error('Arbre invalide')
    return toRef(instance, root.children[0].id)
  }
  return toRef(instance, jstId)
}

/**
 * Retourne le tableau des enfants d'un node jstree sous forme de Ref[]
 * @param {object} jstree L'instance jstree retourné par `$container.jstree(true)` ($container étant retourné par build)
 * @param {string} [parentId=#] Le nodeId dont on veut les enfants, '#' par défaut pour la racine
 * @return {Ref[]} Le tableau des enfants au format Ref
 */
export function getEnfants (jstree, parentId = '#') {
  const parent = jstree.get_node(parentId)
  if (!parent) throw new Error(`Référence du parent introuvable (${parentId})`)
  log('node parent', parent)
  return parent.children.map((childId) => toRef(jstree, childId))
}

/**
 * Retourne une Ref à partir d'un node jstree (le contraire de convert:getJstNode)
 * @param {object} jstree L'instance jstree retourné par `$container.jstree(true)` ($container étant retourné par build)
 * @param {string} childId L'id du child que l'on veut retourner au format ref
 * @returns {Ref} L'objet ref
 */
export function toRef (jstree, childId) {
  const ref = {}
  const child = jstree.get_node(childId)
  if (!child) throw new Error(`Élément ${childId} introuvable`)
  if (child.text && child.a_attr && child.a_attr['data-type']) {
    // on a le minimum requis
    ref.titre = child.text
    ref.type = child.a_attr['data-type']
    if (child.alt) ref.resume = child.alt
    if (child.a_attr['data-aliasof']) ref.aliasOf = child.a_attr['data-aliasof']
    if (child.a_attr['data-description']) ref.description = child.a_attr['data-description']
    if (child.a_attr['data-commentaires']) ref.commentaires = child.a_attr['data-commentaires']
    ref.public = child.a_attr.hasOwnProperty('data-public') ? child.a_attr['data-public'] === '1' : true
    if (!ref.public && child.a_attr['data-cle']) ref.cle = child.a_attr['data-cle']
    if (child.a_attr['data-categories']) ref.categories = JSON.parse(child.a_attr['data-categories'])
    if (child.children && child.children.length) ref.enfants = getEnfants(jstree, childId)
  } else {
    log.error('node impossible à convertir en ref', child)
    throw new Error('élément invalide')
  }

  return ref
}
