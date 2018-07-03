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

import dom from 'sesajstools/dom'
import log from 'sesajstools/utils/log'
import {addSesatheques} from 'sesatheque-client/src/sesatheques'

import {sesatheques} from '../../../server/config'
import page from '../../page/index'

addSesatheques(sesatheques)

/**
 * Affiche l'arbre, avec les boutons pour déplier les branches et afficher l'aperçu des feuilles
 * @service plugins/arbre/display
 * @param {Ressource}      ressource  L'objet ressource
 * @param {displayOptions} options    Les options après init
 * @param {errorCallback}  next       La fct à appeler quand l'arbre sera chargé (sans argument ou avec une erreur)
 */
module.exports = function display (ressource, options, next) {
  require.ensure(['jquery', 'jstree', 'sesatheque-client/src/jstree'], function (require) {
    const $ = require('jquery')
    const stJstree = require('sesatheque-client/src/jstree')
    require('jstree')
    let error
    try {
      log('arbre.display avec', ressource)
      log('et les options', options)
      if (options.sesatheques) addSesatheques(options.sesatheques)

      const container = options.container
      if (!container) throw new Error('Il faut passer dans les options un conteneur html pour afficher cette ressource')
      const errorsContainer = options.errorsContainer
      if (!errorsContainer) throw new Error('Il faut passer dans les options un conteneur html pour les erreurs')

      dom.addCss(options.base + 'vendor/jstree/dist/themes/default/style.min.css')
      const pluginBase = options.pluginBase
      if (!ressource.base) ressource.base = '/'

      // un div d'aperçu
      // const apercuElt = dom.getElement('iframe', {id: dom.getNewId(), width:'50%',height:'400px', style : 'float:right;resize:both;overflow:scroll;'})
      // const apercuElt = dom.getElement('div', {id: dom.getNewId(), style : 'float:right;width:50%;height:400px;resize:both;border:none;'})
      // dom.addElement(apercuElt, 'iframe', {style : 'width:100%;height:100%;border:none;'})
      const apercuContainer = dom.addElement(container, 'div', {
        style: {
          position: 'absolute',
          'background-color': '#fff'
        }
      })
      // en global car on s'en sert souvent, pas la peine de le recalculer dans chaque fct
      const $apercuContainer = $(apercuContainer)
      // un flag pour savoir si on est en mode aperçu (true, false ou null)
      let isApercu = null
      // l'iframe sera créée au chargement
      let iframeApercu
      // quand on charge des swf, on a des erreurs
      // Error: Permission denied to access property 'toString'
      // que l'on peut ignorer (cf http://stackoverflow.com/a/13101119)

      /**
       * Ajoute les boutons
       * @private
       */
      const initApercu = () => {
        log('init aperçu')
        if (isApercu === null) {
          dom.empty(apercuContainer)
          // en relative
          const boutons = dom.addElement(apercuContainer, 'div', {
            style: {
              position: 'absolute',
              'z-index': 2,
              float: 'right',
              'right': 0
            }
          })
          const apercuFermer = dom.addElement(boutons, 'img', {
            src: pluginBase + 'images/fermer.png',
            alt: "fermer l'aperçu",
            style: { float: 'right' }
          })
          const apercuAgrandir = dom.addElement(boutons, 'img', {
            src: pluginBase + 'images/agrandir.png',
            alt: "agrandir l'aperçu",
            style: { float: 'right' }
          })
          const apercuReduire = dom.addElement(boutons, 'img', {
            src: pluginBase + 'images/reduire.png',
            alt: "réduire l'aperçu",
            style: { float: 'right' }
          })
          $(apercuFermer).click(fermer)
          $(apercuAgrandir).click(agrandir)
          $(apercuReduire).click(reduire)
          // on veut pas de transparent
          $apercuContainer.css('background-color', '#fff')
          $apercuContainer.show()
          // on ajoute l'iframe dedans
          iframeApercu = dom.addElement(apercuContainer, 'iframe', {
            style: {
              position: 'absolute',
              'z-index': 1,
              width: '100%',
              height: '100%'
            }
          })
          isApercu = false
        } else {
          log.error('div apercu déjà initialisé')
        }
      }

      const fermer = () => {
        log('on ferme')
        // on vide
        $apercuContainer.empty()
        iframeApercu = null
        // on cache
        $apercuContainer.hide()
        isApercu = null
      }

      const agrandir = () => {
        log('grand')
        if (isApercu === false) {
          $apercuContainer.css('top', '5%')
          $apercuContainer.css('left', '5%')
          $apercuContainer.height('90%')
          $apercuContainer.width('90%')
          isApercu = true
        }
      }

      const reduire = () => {
        log('petit')
        if (isApercu) {
          $apercuContainer.height('30%')
          $apercuContainer.width('30%')
          $apercuContainer.css('top', '70%')
          $apercuContainer.css('left', '70%')
          isApercu = false
        }
      }

      // on crée un div pour le tree et ses compagnons
      const caseTree = dom.addElement(container, 'div')
      // la recherche
      const searchContainer = dom.addElement(caseTree, 'div', { class: 'search' })
      dom.addElement(searchContainer, 'span', null, 'Mettre en valeur les titres contenant ')
      const searchInput = dom.addElement(searchContainer, 'input', { type: 'text' })

      // l'arbre
      const treeId = dom.getNewId()
      dom.addElement(caseTree, 'div', { id: treeId })

      const jstData = {
        'core': {
          'data': stJstree.getDataCallback(ressource, undefined, { errorCallback: page.addError })
        },
        plugins: [ 'search' ]
      }
      const $tree = $('#' + treeId)
      $tree.jstree(jstData)

      /* Pour récupérer un élément sous sa forme jstree, c'est (id est l'id jstree, sans #)
       * const jstNode = $.jstree.reference($tree).get_node(id)
       * et les data que l'on a mise sont dans
       * jstNode.original, par ex jstNode.original.a_attr['data-type']
       */

      // pour la recherche, on écoute la modif de l'input
      let timer
      const $searchInput = $(searchInput)
      $searchInput.keyup(function () {
        // on est appelé à chaque fois qu'une touche est relachée dans cette zone de saisie
        // on lancera la recherche dans 1/4s si y'a pas eu d'autre touche
        if (timer) {
          clearTimeout(timer)
        }
        timer = setTimeout(function () {
          let v = $searchInput.val()
          $tree.jstree(true).search(v)
        }, 250)
      })

      $tree.on('open_node.jstree', function (e, data) {
        log('open_node', e, data)
      })

      // pour l'aperçu, on peut pas écouter les clic sur a.jstree-anchor ni li.jstree-node car jstree les intercepte
      // on écoute donc l'événement select sur le jstree
      $tree.on('select_node.jstree', function (e, data) {
        const jstNode = data.node.original
        log("on veut l'aperçu du node", jstNode, data)
        if (jstNode && jstNode.a_attr) {
          if (jstNode.a_attr[ 'data-type' ] === 'arbre') {
            // on fait du toggle
            log('toggle sur l’arbre ' + jstNode.text)
            if ($tree.jstree('is_open', data.node)) $tree.jstree('close_node', data.node)
            else $tree.jstree('open_node', data.node)
          } else {
            if (isApercu === null) initApercu()
            // on resize avant chargement
            agrandir()
            // et on lui file une url à charger
            log('on va charger ' + jstNode.a_attr.href)
            iframeApercu.src = jstNode.a_attr.href
          }
        }
        /*
         const href = data.rslt.obj.children('a').attr('href')
         // this will load content into a div:
         $('#contents').load(href)
         // this will follow the link:
         document.location.href = href; */
      })
    } catch (e) {
      error = e
    }
    if (next) next(error)
    else if (error) page.addError(error)
  })
} // display
