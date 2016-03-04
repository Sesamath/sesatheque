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

var page = require('../../page')
var tools = require('../../tools')
var dom = require('../../tools/dom')
var log = require('../../tools/log')

var $
/* jshint jquery:true */

/**
 * Ajoute l'iframe d'editgraphe
 * @private
 * @param {string} urlEditGraphe
 * @param {Element} container
 */
function addEditGraphe(urlEditGraphe, container) {
  log('addEditGraphe avec ' +urlEditGraphe)
  var args = {src: urlEditGraphe, id:'editgraphe'}; // mettre ici allowfullscreen:'true' sert à rien, faut un setAttribute plus loin
  var editgraphe = dom.addElement(container, 'iframe', args, 'Si vous lisez ce texte, votre navigateur ne supporte pas les iframes')
  editgraphe.setAttribute('allowfullscreen', true)
  $editgraphe = $(editgraphe)
  autosize()
  return editgraphe.contentWindow
}

/**
 * Helper de loadGraphic qui ajoute un écouteur sur les messages envoyés par editGraphe
 * @param ressource
 * @param $form
 */
function addMessageListener(ressource, $form) {
  window.addEventListener('message', function (event) {
    // on teste pas event.origin, on accepte les messages de tous ceux que l'on embarque
    if (event.data) {
      log("Message reçu dans l'édition de la ressource", event)
      if (event.data.action === 'editGrapheReady') {
        egWindow.postMessage({action: 'load', ressource: ressource}, '*')
      } else if (event.data && event.data.action === 'saveParametres') {
        if (event.data.parametres) saveParametres(event.data.parametres)
        else page.addError("editgraphe envoi un message avec l'action saveParametres sans fournir parametres")
      } else if (event.data && event.data.action === 'saveAndSubmit') {
        if (event.data.parametres) {
          log('Dans saveAndSubmit on récupère les parametres', event.data.parametres)
          saveParametres(event.data.parametres, function () {
            if (isSubmitForced) {
              log('submit déjà fait en timeout')
            } else {
              isSubmitForced = true
              $form.submit()
            }
          })
        } else {
          page.addError("editgraphe envoi un message avec l'action saveAndSubmit sans fournir parametres, on sauvegarde en l'état dans 2s")
          setTimeout(function () {
            if (isSubmitForced) {
              log('submit déjà fait en timeout')
            } else {
              isSubmitForced = true
              $form.submit()
            }
          }, 2000)
        }
      }
    } else {
      log('message reçu sans data ???', event)
    }
  })
}

/**
 * Helper de loadGraphic qui ajoute l'écouteur sur submit
 * @param $form
 */
function addSubmitCallback($form) {
  $form.submit(function () {
    log('submit demandé')
    // on le fait qu'une fois, au cas où le user s'excite sur le bouton enregistrer
    if (!isSaveAndSubmitDone) {
      log('on transfère à saveAndSubmit et on attend')
      egWindow.postMessage({action: 'saveAndSubmit'}, '*')
      isSaveAndSubmitDone = true
      setTimeout(function () {
        log('timeout sans réponse, on force le submit tel quel')
        // au cas où j3p répond pas (navigateur qui gère pas les messages par ex, on soumet dans 3s
        isSubmitForced = true
        $form.submit()
      }, 3000)
    }

    return isSubmitForced; // on fera le submit au retour du message
  })
}

/**
 * Appelle resizeIframe et le colle comme comportement au resize de la fenêtre
 * @private
 */
function autosize() {
  // on redimensionne dès que jQuery est prêt
  $(resizeIframe)
  // et à chaque changement de la taille de la fenêtre
  $(window).resize(resizeIframe)
}

/**
 * Ajoute l'iframe, la gestion de messages et la sauvegarde auto du graphe
 * @param {object}    options
 * @param {Element}   container
 * @param {Ressource} ressource
 */
function loadGraphic(options, container, ressource) {
  var urlEditGraphe = 'http://j3p.'
  if (options.isDev) urlEditGraphe += 'dev'
  urlEditGraphe += 'sesamath.net/editgraphes/lanceur_graphique.html'
  //urlEditGraphe = 'http://j3p.local/editgraphes/lanceur_graphique.html'
  $textarea.hide()
  $textarea.before(dom.getElement('a', {href:'?editor=text'}, 'mode texte (sauvegarder les modifications avant)'))
  $textarea.before(dom.getElement('br'))
  egWindow = addEditGraphe(urlEditGraphe, container)
  // au submit on veut récupérer le contenu d'éditgraphe
  var $form = $('#formRessource')
  addMessageListener(ressource, $form)
  addSubmitCallback($form)
} // loadGraphic

/**
 * Modifie la taille de l'iframe pour le maximiser sur l'espace visible
 * @private
 */
function resizeIframe() {
  var tailleDispo = Math.floor(window.innerHeight)
  if (tailleDispo < 300) tailleDispo = 300
  $editgraphe.height(tailleDispo)
  log('resize iframe height à ' + tailleDispo)
  tailleDispo = $editgraphe.width()
  if (tailleDispo < 300) $editgraphe.width(300)
  else $editgraphe.css('width', '100%')
  $editgraphe.scrollTop(0)
}

/**
 * Met dans le textarea la string json de l'objet passé en param
 * @param {object}         parametres
 * @param {simpleCallback} [next]
 */
function saveParametres(parametres, next) {
  log('saveParametres', parametres)
  // sans le setTimeout, le $textarea.val(paramString) ne change rien dans le html, aucune idée du pourquoi...
  setTimeout(function () {
    try {
      var paramString = JSON.stringify(parametres, null, 2)
      log('on met dans le textarea', paramString)
      $textarea.val(paramString)
      log('après modif le textarea contient', $textarea.val())
      log('après modif le textarea', $textarea)
    } catch (error) {
      log.error("stringify plante avec l'objet", parametres)
      page.addError('Impossible de modifier les paramètres, objet malformé (' +error.toString() + ')', 5)
    }
    if (next) next()
  }, 0)
}

var $editgraphe,                 // iframe
    egWindow,
    isSaveAndSubmitDone = false, // on a envoyé le postMessage
    isSubmitForced = false,      // pour forcer le submit, postMessage fait ou pas
    $textarea
var wd = window.document

/**
 * Édite une ressource j3p
 * Donne la ressource à j3p:/editgraphes/lanceur_graphique.html?callback=initEditJ3p en iframe
 * (en passant par du postMessage pour communiquer avec l'iframe)
 * qui rappellera initEditJ3p(initCallback) quand il sera chargé pour qu'on lui renvoie les params avec
 * initCallback(ressource, resultatCallback)
 * @service plugins/j3p/edit
 * @param ressource
 * @param options
 */
module.exports = function edit(ressource, options) {
  page.loadAsync(['jquery'], function () {
    $ = window.jQuery
    try {
      if (!ressource || !ressource.parametres) throw new Error('Il faut passer une ressource à éditer')
      var textarea = wd.getElementById('parametres')
      if (!textarea) throw new Error('Pas de textarea #parametres trouvé dans cette page')
      $textarea = $(textarea)
      // le container pour l'iframe
      var container = wd.getElementById('groupParametres')
      if (!container) {
        log('pas trouvé de #groupParametres, on prend le parent du textarea en container')
        container = textarea.parentNode
      }
      var editor = tools.getURLParameter('editor') || 'graphic'
      if (editor === 'graphic') {
        loadGraphic(options, container, ressource)
      } else {
        if (editor !== 'text') page.addError('Éditeur ' + editor + ' inconnu, on prend text')
        $textarea.before(dom.getElement('a', { href: '?editor=graphic' }, 'mode graphique (sauvegarder les modifications avant)'))
        $textarea.before(dom.getElement('br'))
      }
    } catch (error) {
      page.addError(error)
    }
  })
}
