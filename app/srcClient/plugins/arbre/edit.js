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
import sjtUrl from 'sesajstools/http/url'
import log from 'sesajstools/utils/log'

// @todo Reste à ajouter un options.eachEnfant pour modifier à la volée les enfants sur l'arbre de destination et empêcher le chargement des arbres en aliasOf (sinon ça les intègre d'office), en ajoutant sur ces éléments un menu de clic droit "incorporer tout le contenu ici"

// @todo ajouter l'aperçu

// @todo régler le pb des css (actuellement avec un dom.addCss de la css construite par webpack, faut fusionner avec les autres)

/**
 * Édite un arbre (avec jstree, src et dst), appelé depuis la vue editArbre depuis l'url /ressource/modifier/xxx
 * @service plugins/arbre/edit
 * @param arbre
 * @param options
 */
module.exports = function edit (arbre, options) {
  if (!options.sesatheques) throw new Error('Erreur interne, paramètre sesatheques manquant')
  if (!options.baseId) throw new Error('Erreur interne, paramètre baseId manquant')
  // jquery est déjà chargé par le edit.js, mais il est local à chaque module
  require.ensure(['jquery', 'jstree', 'sesatheque-client/dist/fetch', 'sesatheque-client/dist/jstree'], function (require) {
    // nos fcts internes
    /**
     * Ajoute le lien aperçu aux links
     * @param {object} links l'objet contextmenu.items de jstree
     * @param node
     */
    function addLinkApercu (links, node) {
      const url = node.a_attr && node.a_attr[ 'data-displayurl' ]
      // Apercu sur tous les éléments dont on a une ref
      if (url) {
        links.apercu = {
          label: 'Aperçu',
          action: function () {
            iframeApercu.src = url
          }
        }
      }
    }

    /**
     * Affiche un message d'erreur sur la page mais près de l'arbre en cours d'édition
     * @private
     * @param {string} errorMessage
     * @param {number} [delay] Si fourni efface le message après ce nb de s ou ms (si <1000 on * par 1000)
     */
    function addTreeError (errorMessage, delay) {
      $treeError.text(errorMessage)
      if (!$treeError.hasClass('error')) $treeError.addClass('error')
      if (delay) {
        if (delay < 1000) delay *= 1000 // on nous a passé des s
        setTimeout(() => $treeError.empty(), delay)
      }
    }

    /**
     * Ajoute le div pour l'arbre source et la gestion de son chargement
     * @private
     */
    function addLoadSrc () {
      dom.addElement(container, 'span', null, 'arbre source à charger ')
      inputRef = dom.addElement(container, 'input', { id: 'loadRef', type: 'text' })
      $inputRef = $(inputRef)
      // enter doit pas valider le form mais charger la ref
      $inputRef.keypress(function (event) {
        if (event.keyCode === 13) {
          loadSrc()
          event.preventDefault() // pour empêcher le submit
        }
      })
      // lien de chargement
      loadLink = dom.addElement(container, 'a', { href: '#' }, ' afficher')
      $(loadLink).click(loadSrc)
      // un div pour les erreurs
      const treeError = dom.addElement(container, 'p')
      $treeError = $(treeError)
    }

    /**
     * Crée un json de la liste des enfants de l'arbre destination et le met dans le textarea
     * @private
     */
    function dstTreeToTextarea () {
      let enfants
      let enfantsStr = ''
      try {
        const inst = $dstTree.jstree(true)
        enfants = getEnfants(inst)
        log('On récupère les enfants', enfants)
        // on a les enfants de la racine, il ne doit y en avoir qu'un
        if (enfants.length !== 1) {
          return addTreeError('Il ne doit y avoir qu’une racine')
        }
        if (enfants[0].enfants && enfants[0].enfants.length) enfantsStr = JSON.stringify(enfants[0].enfants, null, 2)
        else enfantsStr = '[]'
      } catch (error) {
        log.error('Le parsing json a planté', error, enfants)
        return addTreeError('Erreur interne, impossible de récupérer les enfants')
      }
      $textarea.val(enfantsStr)
    }

    /**
     * Charge initialise le dom et les liens pour changer de mode
     * @private
     * @param options
     */
    function initDom (options) {
      // Ajout css, si on a pas tant pis pour le css mais ça va être moche
      const vendorsBaseUrl = options.vendorsBaseUrl || '/vendor'
      dom.addCss(vendorsBaseUrl + '/jstree/dist/themes/default/style.min.css')
      // nos éléments html
      container = window.document.getElementById('display')
      $container = $(container)
      const blocTexte = window.document.getElementById('groupEnfants') // le textarea et son titre
      // faut ajouter nos eléments en first child
      // ancre
      dom.addElementFirstChild(blocTexte, 'a', { name: 'enfants' })
      // lien et comportement pour repasser en graphique
      const linkShowGraphic = dom.addElementFirstChild(blocTexte, 'a', {
        href: '#enfants',
        style: { float: 'left' }
      }, 'passer en mode graphique')
      $linkShowGraphic = $(linkShowGraphic)
      $linkShowGraphic.click(showGraphic)

      // lien et comportement pour passer en mode texte
      const linkShowTxt = dom.addElementFirstChild(blocTexte, 'a', {
        href: '#enfants',
        style: { float: 'left' }
      }, 'passer en mode texte')
      $linkShowTxt = $(linkShowTxt)
      $linkShowTxt.click(showTxt)
      // dom.addElement(blocTexte, 'br')
      // dom.addElement(blocTexte, 'a', {href:'?editor=texte'}, 'passer en mode texte sans sauvegarder')
    }

    /**
     * Initialise les éléments de dom pour le mode graphique
     * @private
     */
    function initDomGraphic () {
      addLoadSrc()
      // la recherche
      const searchContainer = dom.addElement(container, 'div', { class: 'search' })
      dom.addElement(searchContainer, 'span', null, 'Mettre en valeur les titres contenant ')
      searchInput = dom.addElement(searchContainer, 'input', { type: 'text' })

      srcGroup = dom.addElement(container, 'div', { id: 'srcGroup' })
      dom.addElement(srcGroup, 'span', null, 'arbre source')
      divSrcTree = dom.addElement(srcGroup, 'div')

      const dstGroup = dom.addElement(container, 'div', { id: 'dstGroup' })
      dom.addElement(dstGroup, 'strong', null, 'arbre à modifier')
      dom.addElement(dstGroup, 'em', { style: { 'font-size': '0.8em' } }, ' (clic droit pour enlever des éléments ou ajouter des dossiers)')
      divDstTree = dom.addElement(dstGroup, 'div')
      $dstTree = $(divDstTree)
      console.log('$dstTree keys', Object.keys($dstTree))

      dom.addElement(container, 'p', { style: 'clear:both;' }, "Aperçu d'un élément")
      iframeApercu = dom.addElement(container, 'iframe', { id: 'apercu' })
    }

    /**
     * Charge l'arbre destination
     * @private
     * @param arbre
     */
    function loadDst (arbre) {
      // nos cb au clic droit

      // ajoute une ressource
      function actionAdd (data) {
        const id = window.prompt('Id de la ressource (oid ou origine/idOrigine)\nPréfixe “sesabibli/” ou “sesacommun/” possible pour préciser la sesathèque à utiliser')
        if (id) {
          addNode($dstTree, id, data.reference, function (error, newNode) {
            if (error) addTreeError(error)
          })
        }
      }

      // Cb sur clic droit ajouter un dossier
      function actionAddFolder (data) {
        // la cb appellée avec le node créé
        function createCb (newNode) {
          // ici inst.edit existe bien, mais si c'est le 1er enfant d'un arbre vide
          // log('dans createCb', newNode, inst)
          inst.edit(
            newNode,
            'titre',
            function (newNode, status) {
              if (status) isDstModified = true
              log('après modif', inst)
            }
          )
        }

        // en 3.3 ce truc marche plus
        // const inst = $.jstree.reference(data.reference)
        // on fait plutôt
        const inst = $dstTree.jstree(true)
        log('instance', inst)
        const parentNode = inst.get_node(data.reference)
        log('node parent', parentNode)
        const newNode = {
          icon: 'arbreJstNode',
          a_attr: { 'data-type': 'arbre' }
        }
        inst.create_node(parentNode, newNode, 'last', createCb)
      }

      // retirer un item de l'arbre
      function actionDelete (data) {
        const inst = $dstTree.jstree(true)
        const node = inst.get_node(data.reference)
        if (inst.is_selected(node)) inst.delete_node(inst.get_selected())
        else inst.delete_node(node)
        isDstModified = true
      }

      // Aller éditer la ressource
      function actionEdit (data) {
        // on a un bind sur le node
        const inst = $dstTree.jstree(true)
        const node = inst.get_node(data.reference)
        if (isDstModified) {
          addTreeError("Enfants de l'arbre modifiés mais non sauvegardé (recharger la page pour annuler les modifications)")
        } else {
          const aliasOf = node.a_attr[ 'data-aliasof' ]
          if (aliasOf) {
            const slashPos = aliasOf.indexOf('/')
            if (slashPos) {
              const id = aliasOf.substr(slashPos + 1)
              if (id) {
                window.location = '/ressource/modifier/' + id
                return
              }
            }
          }
          addTreeError('Impossible de trouver l’url de modification de cet élément')
        }
      }

      // Renommer un dossier
      function actionRename (data) {
        const inst = $dstTree.jstree(true)
        const node = inst.get_node(data.reference)
        inst.edit(node)
        isDstModified = true
      }

      // Main de loadDst

      const jstOptions = {
        check_callback: function (action, node, parent) {
          log('check_callback avec', arguments)
          // on accepte le drop seulement dans des arbres (dossiers)
          if (action === 'copy_node') return (parent.id !== '#' && parent.a_attr && parent.a_attr[ 'data-type' ] === 'arbre')
          // tout le reste est autorisé
          else return true
        },
        plugins: [ 'dnd', 'contextmenu' ],
        contextmenu: {
          select_node: false
        },
        dnd: {
          inside_pos: 'last'
        },
        listeners: {
          'select_node.jstree': function (e, data) {
            const jstNode = data.node.original
            log('clic sur', jstNode)
            if (jstNode && jstNode.a_attr && jstNode.a_attr[ 'data-type' ] === 'arbre') {
              // on fait du toggle
              if ($dstTree.jstree('is_open', data.node)) $dstTree.jstree('close_node', data.node)
              else $dstTree.jstree('open_node', data.node)
            }
          }
        }
      } // jstOptions

      // clic droit au select, cf $jstree.defaults.contextmenu sur
      // https://github.com/vakata/jstree/blob/master/src/jstree.contextmenu.js#L58
      /**
       * La liste de nos éléments de menu
       * @see http://www.jstree.com/api/#/?q=$jstree.defaults&f=$jstree.defaults.contextmenu.items
       * @private
       * @param node Le node, avec les propriétés a_attr, icon, text
       * @param cb à rappeler avec les items du menu contextuel pour ce node
       */
      jstOptions.contextmenu.items = function (node, cb) {
        // on met une fct car le résultat dépend de l'item sur lequel on fait un clic droit
        const items = {}
        const isRacine = (node.parent === '#')
        const isArbreSansRef = node.a_attr[ 'data-type' ] === 'arbre' && !node.a_attr[ 'data-aliasof' ]
        const isArbreRef = node.a_attr[ 'data-type' ] === 'arbre' && node.a_attr[ 'data-aliasof' ]
        // on peut supprimer n'importe quel item sauf la racine
        if (!isRacine) {
          items.remove = {
            label: 'Supprimer',
            action: actionDelete,
            shortcut: 46, // suppr, cf http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
            shortcut_label: 'suppr'
          }
        }
        // On peut créer dans la racine ou les éléments arbre qui ne sont pas une ref vers un autre arbre (sinon faut aller éditer l'original)
        if (isRacine || isArbreSansRef) {
          items.create = {
            label: 'Ajouter un dossier',
            action: actionAddFolder
          }
          // idem pour les ressources
          items.add = {
            label: 'Ajouter une ressource',
            action: actionAdd
          }
        }
        // on peut renommer les arbres sans ref
        if (isArbreSansRef) {
          items.rename = {
            label: 'Renommer',
            action: actionRename
          }
        }
        // un raccourci pour aller éditer une ref
        if (isArbreRef && !isRacine) {
          items.editRef = {
            label: 'Éditer',
            action: actionEdit
          }
        }
        addLinkApercu(items, node)
        log('clic droit sur', node)
        cb(items)
      }

      $dstTree = build(divDstTree, arbre, jstOptions)
    } // loadDst

    /**
     * Charge l'arbre source d'après le contenu de $inputRef
     * @private
     * @return {boolean}
     */
    function loadSrc () {
      const rid = $inputRef.val()
      log('On va charger en source ' + rid)
      if (rid) {
        const slashPos = rid.indexOf('/')
        if (slashPos === -1) {
          fetchPublicRef(baseId, rid, showSrc)
        } else {
          const debut = rid.substr(0, slashPos)
          if (exists(debut)) fetchPublicRef(debut, rid.substr(slashPos + 1), showSrc)
          else fetchPublicRef(baseId, rid, showSrc)
        }
      } else {
        log('appel de load sans rid')
      }
    } // loadSrc

    /**
     * Récupère l'arbre jstree et complète le champ enfants avec
     * @private
     */
    function saveDst () {
      if (!isTextMode) {
        dstTreeToTextarea()
      }

      return true
    }

    /**
     * Affiche l'arbre en src
     * @param error
     * @param {Ref} arbre
     * @return {*}
     */
    function showSrc (error, arbre) {
      const rid = $inputRef.val()
      if (error) return addTreeError('Erreur au chargement de ' + rid + ' : ' + error.toString(), 5)
      if (!arbre) return addTreeError(`L’arbre ${rid} n’existe pas`)
      if (arbre.type !== 'arbre') return addTreeError(`La ressource ${rid} n’est pas un arbre`)
      // on peut y aller
      log('arbre source', arbre)
      const jstOptions = {
        plugins: [ 'contextmenu', 'dnd', 'search' ],
        contextmenu: {
          items: function (node, cb) {
            // cf http://www.jstree.com/api/#/?q=$jstree.defaults&f=$jstree.defaults.contextmenu.items
            const links = {}
            addLinkApercu(links, node)
            // ajout du 'charger ici'
            const aliasOf = node.a_attr && node.a_attr[ 'data-aliasof' ]
            if (aliasOf && node.a_attr[ 'data-type' ] === 'arbre') {
              links.replace = {
                label: 'Charger ici',
                action: function () {
                  log('Charger en source ' + aliasOf)
                  $inputRef.val(aliasOf)
                  loadSrc()
                }
              }
            }
            log('clic droit dans la source sur', node)
            cb(links)
          },
          // on veut pas qu'un clic droit sélectionne le node
          // cf https://www.jstree.com/api/#/?f=$.jstree.defaults.contextmenu.select_node
          select_node: false
        },
        dnd: { always_copy: true },
        listeners: {
          // pour ouvrir / fermer, on peut pas écouter les clic sur a.jstree-anchor ni li.jstree-node
          // car jstree les intercepte, on écoute donc l'événement select_node
          // cf https://www.jstree.com/api/#/?f=select_node.jstree
          'select_node.jstree': function (e, data) {
            const jstNode = data.node.original
            log('clic sur', jstNode)
            if (jstNode && jstNode.a_attr && jstNode.a_attr[ 'data-type' ] === 'arbre') {
              // on fait du toggle
              if ($srcTree.jstree('is_open', data.node)) $srcTree.jstree('close_node', data.node)
              else $srcTree.jstree('open_node', data.node)
            }
          }
        }
      }
      $srcTree = build(divSrcTree, arbre, jstOptions)

      // pour la recherche, on remet le comportement de la modif de l'input sur l'arbre
      let timer
      const $searchInput = $(searchInput)
      $searchInput.keyup(function () {
        // on est appelé à chaque fois qu'une touche est relachée dans cette zone de saisie
        // on lancera la recherche dans 1/4s si y'a pas eu d'autre touche
        if (timer) {
          clearTimeout(timer)
        }
        timer = setTimeout(function () {
          const v = $searchInput.val()
          $srcTree.jstree(true).search(v)
        }, 250)
      })
    } // showSrc

    /**
     * Passe en mode texte
     * @private
     */
    function showTxt () {
      $linkShowTxt.hide()
      $container.hide()
      dstTreeToTextarea()
      $textarea.show()
      $linkShowGraphic.show()
      isTextMode = true
    }

    /**
     * passe en mode graphique
     * @private
     */
    function showGraphic () {
      if (!$dstTree) initDomGraphic()
      const enfantsStr = $textarea.val()
      console.log(`#${enfantsStr}#`)
      try {
        if (enfantsStr) {
          dstTree.enfants = JSON.parse($textarea.val())
        } else {
          dstTree.enfants = []
        }
        $linkShowGraphic.hide()
        $textarea.hide()
        log('On va charger en dst', dstTree)
        loadDst(dstTree)
        $container.show()
        $linkShowTxt.show()
        isTextMode = false
      } catch (error) {
        addTreeError('json enfants invalide : \n' + enfantsStr)
        log.error(error)
      }
    }

    // ###########
    // MAIN
    // ###########
    const $ = require('jquery')
    require('jstree')
    if (!$.jstree) throw new Error('Problème de chargement jstree')

    const { addNode, build, getEnfants } = require('sesatheque-client/dist/jstree')
    const { addSesatheques, exists, fetchPublicRef } = require('sesatheque-client/dist/fetch')
    /* jshint jquery:true */

    addSesatheques(options.sesatheques)

    // les containers (variables locales au module), qui seront affectés par initDom()
    let iframeApercu, container, srcGroup, inputRef, loadLink, searchInput, divSrcTree, divDstTree, dstTree
    // quasi les mêmes jquerifiée
    let $container, $inputRef, $treeError, $srcTree, $dstTree, $saveButton, $textarea, $linkShowTxt, $linkShowGraphic
    let isTextMode = true
    let isDstModified = false
    // le textarea enfants
    $textarea = $('#enfants')
    if (!$textarea) throw new Error('Champ de sauvegarde des enfants non trouvé dans le formulaire')
    // var globale pour $.jstree qui n'existe plus dans les callbacks
    $saveButton = $('#saveButton')
    if (!$saveButton) throw new Error('Bouton de sauvegarde non trouvé dans la page')

    const editor = sjtUrl.getParameter('editor') || 'graphic'
    const baseId = options.baseId

    initDom(options)
    dstTree = arbre
    if (editor === 'graphic') {
      initDomGraphic()
      log("edit de l'arbre", arbre)
      log('$dstTree', $dstTree)

      // on charge l'arbre à éditer
      loadDst(arbre)
      showGraphic()
    } else {
      $linkShowTxt.hide()
      $textarea.val(JSON.stringify(arbre.enfants, null, 2))
    }
    // comportement au save
    $saveButton.click(saveDst)
  }) // require.ensure
}
