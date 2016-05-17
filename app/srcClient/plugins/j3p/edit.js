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
// pour l'édition de graphe via l'injection d'une iframe et de listener sur les postmessage,
// cf commits antérieurs au 17/05/2016

var dom = require('sesajstools/dom')
var log = require('sesajstools/utils/log')
var tools = require('sesajstools')
var embedEditGraphe = require('babel-loader!sesaeditgraphe/src/embed').default

var page = require('../../page/index')

/**
 * Ajoute le listener sur submit pour remplir le textarea avec les params d'éditgraphe
 */
function addSubmitHandler () {
  // au submit on veut récupérer le contenu d'éditgraphe
  var $form = $('#formRessource')
  $form.submit(function () {
    log('submit demandé')
    // si on a mis le flag la dernière fois on sort direct pour validation du form
    if (isSubmitForced) return true
    // sinon on essaie de récupérer les paramètres
    try {
      var parametres = getEgParams()
      if (parametres && parametres.g) {
        try {
          var paramString = JSON.stringify(parametres, null, 2)
        } catch (error) {
          log.error(error)
          throw new Error('L’éditeur de graphe n’a pas renvoyé de graphe valide, valider de nouveau enregistrera l’ancien graphe')
        }
        log('on met dans le textarea', paramString)
        $textarea.val(paramString)
        log('après modif le textarea contient', $textarea.val())
        log('après modif le textarea', $textarea)
        return true
      } else {
        throw new Error('L’éditeur de graphe n’a pas renvoyé de graphe, valider de nouveau enregistrera l’ancien graphe')
      }
    } catch (error) {
      page.addError(error)
      // on passe à true pour pouvoir valider au prochain submit
      isSubmitForced = true
    }
    return false
  })
}

/**
 *
 * @param {Element} toggleButton
 * @param {Element} container
 * @param {Ressource} ressource
 */
function addToggleHandler (toggleButton, container, ressource) {
  log('addToggleHandler')
  toggleButton.addEventListener('click', function () {
    log('clic toggleButton')
    if (isGraphic) {
      try {
        var strParams = JSON.stringify(getEgParams(), null, 2)
        $textarea.val(strParams)
        $editgraphe.hide()
        $textarea.show()
        $toggleButton.html(graphMode)
        isGraphic = false
      } catch (error) {
        log.error(error)
        page.addError('L’éditeur de graphe a renvoyé des paramètres invalides')
      }
    } else {
      try {
        var params = JSON.parse($textarea.val())
        ressource.parametres = params
        loadGraphic(container, ressource)
        $toggleButton.html(textMode)
        isGraphic = true
      } catch (error) {
        log.error(error)
        page.addError('Paramètres invalides (pb json)')
      }
    }
  })
}

/**
 * Ajoute editgraphe dans le container
 * @param {Element}   container
 * @param {Ressource} ressource
 */
function loadGraphic (container, ressource) {
  dom.empty(container)
  var assets = {
    // cf https://github.com/webpack/file-loader
    js: require('file!sesaeditgraphe/dist/editGraphe.js'),
    css: require('file!sesaeditgraphe/dist/editGraphe.css')
  }
  embedEditGraphe(container, ressource, assets, function (error, getRessourceParametres) {
    log('retour de embedEditGraphe avec', error, getRessourceParametres, typeof getRessourceParametres)
    if (error) {
      page.addError(error)
    } else if (getRessourceParametres) {
      // on teste cette fct globale pour savoir si on a déjà ajouté le handler
      if (!getEgParams) addSubmitHandler()
      // mais faut de toute façon l'écraser avec la nouvelle
      getEgParams = getRessourceParametres
    } else {
      page.addError(new Error('Le chargement de l’éditeur de graphe n’a pas renvoyé de moyen de récupérer le graphe construit'))
    }
  })
} // loadGraphic

var wd = window.document
var $
/* jshint jquery:true */
var isSubmitForced = false      // pour forcer le submit au coup suivant en cas d'erreur de récupération de graphe sur le 1er
var $editgraphe
var $textarea
var $toggleButton
var getEgParams = function () {
  log.error('L’éditeur de graphe n’a pas encore été chargé')
}
var isGraphic = true
// nos libellés de bouton
var graphMode = 'Mode graphique'
var textMode = 'Mode texte'

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
module.exports = function edit (ressource, options) {
  page.loadAsync(['jquery'], function () {
    $ = window.jQuery
    try {
      if (!ressource || !ressource.parametres) throw new Error('Il faut passer une ressource à éditer')
      var textarea = wd.getElementById('parametres')
      if (!textarea) throw new Error('Pas de textarea #parametres trouvé dans cette page')
      $textarea = $(textarea)
      // le container pour editgraphe
      var parent = wd.getElementById('groupParametres')
      if (!parent) {
        log('pas trouvé de #groupParametres, on prend le parent du textarea en container')
        parent = textarea.parentNode
      }
      var editor = tools.getURLParameter('editor') || 'graphic'
      isGraphic = (editor === 'graphic')
      // le bouton toggle
      var toggleButton = dom.addElement(parent, 'button', {id: 'toggleButton'}, isGraphic ? textMode : graphMode)
      var container = dom.addElement(parent, 'div', {id: 'editgraphe'})
      $editgraphe = $(container)
      addToggleHandler(toggleButton, container, ressource)
      // et l'init avec le bon éditeur
      if (isGraphic) {
        loadGraphic(container, ressource)
        $textarea.hide()
        // Scrolle pour mettre editgraphe en haut de la fenêtre visible, seulement à l'init et plus au toggle
        $editgraphe.scrollTop(0)
      } else {
        if (editor !== 'text') page.addError('Éditeur ' + editor + ' inconnu, on prend text')
      }
    } catch (error) {
      page.addError(error)
    }
  })
}
