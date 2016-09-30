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

var dom = require('sesajstools/dom')
var log = require('sesajstools/utils/log')

var page = require('../../page/index')
var swf = require('../../display/swf')

var $
/* jshint jquery:true */

/**
 * Ajoute l'iframe (ou un div si c'est un swf directement)
 * @private
 */
function addPage (url, params, next) {
  log('addPage avec les params', params)
  var divIframeId = 'page'
  var divIframe = dom.addElement(container, 'div', {id: divIframeId})
  var divIframeSrcId = 'urlSrc'
  dom.addElement(divIframe, 'p', {id: divIframeSrcId}, 'source : ' + params.adresse)
  // toujours autosize sur le conteneur
  page.autosize(divIframeId, [divIframeSrcId], null, {offsetHeight: 20, offsetWidth: 40})
  // url sera ajouté après l'appel de pageLoaded, pour éviter que l'eventListener soit ajouté après le load (si c'est en cache)
  var args = {id: 'pageContent'}

  // l'iframe, mais on fait un cas particulier pour les urls en swf qui ne renvoient pas un DOMDocument
  // ff aime pas et sort une erreur js Error: Permission denied to access property 'toString'
  // chrome râle aussi parce que c'est pas un document
  if (/^[^?]+.swf(\?.*)?$/.test(url)) { // faut pas prendre les truc.php?toto=truc.swf
    log("C'est un swf, on ajoute un div et pas une iframe")
    var swfId = 'swf' + (new Date()).getTime()
    var options = {id: swfId}
    if (params.hauteur) {
      args.height = params.hauteur
      options.hauteur = params.hauteur
    }
    if (params.largeur) {
      args.width = params.largeur
      options.largeur = params.largeur
    }
    var swfContainer = dom.addElement(divIframe, 'div', args)
    log('On charge ' + url + ' dans #page avec', options)
    // ne pas passer directement next en cb sinon il sera appelé avec un argument, qui sera interprété comme une erreur
    swf.load(swfContainer, url, options, function () {
      // on est appelé quand swfobject a mis l'object dans le dom, mais le swf est pas forcément chargé
      // on regarde la hauteur pour savoir si c'est fait
      var $swfId = $('#' + swfId)
      if ($swfId.innerHeight() > 10) {
        isLoaded = true
        next()
      } else {
        $swfId.on('load', function () {
          isLoaded = true
          next()
        })
      }
      if (!options.height || !options.width) page.autosize(swfId, [divIframeSrcId])
    })
    /* */
  } else if (/^[^?]+.(png|jpe?g|gif)(\?.*)?$/.test(url)) {
    // c'est un tag img
    if (params.hauteur > 100) args.height = params.hauteur
    if (params.largeur > 100) args.width = params.largeur
    log("c'est une image, pas d'iframe mais un tag img", args, params)
    var img = dom.addElement(divIframe, 'img', args)
    pageLoaded(img, next)
    img.src = url
  } else {
    // c'est bien une iframe, le texte sera écrasé à son chargement
    var iframe = dom.addElement(divIframe, 'iframe', args, 'Si vous lisez ce texte,' +
        ' votre navigateur ne supporte probablement pas les iframes')
    // url source (non cliquable) en footer
    page.autosize(args.id, ['errors', 'warnings', 'titre', 'entete', 'urlSrc'], [], {minHeight: 300, minWidth: 300})
    pageLoaded(iframe, next)
    iframe.src = url
  }
}

function pageLoaded (elt, next) {
  if (elt && elt.addEventListener) {
    elt.addEventListener('load', function () {
      isLoaded = true
      next()
    })
  } else {
    // pas de addEventListener, on la considère déjà chargée
    isLoaded = true
    next()
  }
}

/**
 * Envoie le résultat à resultatCallback
 * @param {string}   reponse
 * @param {boolean}  deferSync
 * @param {function} next
 */
function sendResultat (reponse, deferSync, next) {
  var resultat = {
    score: 1,
    ressId: ressId,
    ressType: 'url'
  }
  if (deferSync) {
    resultat.fin = true
    resultat.deferSync = true
  }
  if (reponse) resultat.reponse = reponse
  resultatCallback(resultat, next)
}

var container
var ressId
var resultatCallback
var isLoaded

/**
 * Affiche les ressources de type url (page externe) en créant une iframe dans le container (ou un div si l'url est un swf)
 * @service plugins/url/display
 * @param {Ressource}      ressource  L'objet ressource
 * @param {displayOptions} options    Les options après init
 * @param {errorCallback}  next       La fct à appeler quand le contenu sera chargé
 */
module.exports = function display (ressource, options, next) {
  page.loadAsync('jquery', function () {
    $ = window.jQuery
    try {
      // les params minimaux
      if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.adresse) throw new Error('Ressource incomplète');
      [ 'base', 'pluginBase', 'container', 'errorsContainer' ].forEach(function (param) {
        if (!options[ param ]) throw new Error('Paramètre ' + param + ' manquant')
      })

      // init de nos var globales
      container = options.container
      if (typeof options.resultatCallback === 'function') resultatCallback = options.resultatCallback
      ressId = ressource.oid

      // raccourcis
      var params = ressource.parametres
      var url = params.adresse
      if (!url) throw new Error('Url manquante')
      if (!/^https?:\/\//.test(url)) throw new Error('Url invalide : ' + url)
      // si c'est pas du https on passe par notre proxy maison, en filant l'id de la ressource,
      // pour éviter de servir de proxy à n'importe quoi
      if (!/^https:\/\//.test(url)) {
        url = '/public/urlProxy/' + ressource.oid
      }
      // init
      dom.addCss(options.pluginBase + 'url.css')

      var hasConsigne = (params.question_option && params.question_option !== 'off')
      var hasReponse = (params.answer_option && params.answer_option !== 'off')
      var isBasic = !hasConsigne && !hasReponse
      // ni question ni réponse
      if (isBasic) {
        addPage(url, params, next)
        if (resultatCallback) {
          // un listener pour envoyer 'affiché' comme score (i.e. un score de 1 avec une durée)
          $('body').on('unload', function () {
            if (isLoaded) sendResultat(null, true)
          })
        } // sinon rien à faire
      } else {
        /**
         * Ajout des comportements pour la gestion des panneaux Consigne et Réponse avec jQueryUi
         * On charge ces dépendances avec notre loader
         */
        page.loadAsync([ 'jqueryUiDialog' ], function () {
          // les autres sont des modules à nous chargés par webpack
          require.ensure([], function (require) {
            function sendReponse () {
              if (!isResultatSent) {
                var reponse = $(textarea).val()
                sendResultat(reponse, false, function (retour) {
                  if (retour && (retour.ok || retour.success)) isResultatSent = true
                })
              }
            }

            var hasCkeditor = (params.answer_editor && params.answer_editor.indexOf('ckeditor') === 0)
            var hasMqEditor = (params.answer_editor === 'mqEditor')
            var editorName
            if (hasCkeditor) editorName = 'ckeditor'
            else if (hasMqEditor) editorName = 'mqEditor'
            var editor
            if (editorName) editor = require('../../editors/' + editorName)
            var urlUi = require('./displayUi')
            // on ajoute tous nos div même si tous ne serviront pas (car urlUi les cherche dans la page)
            var entete = dom.addElement(container, 'div', { id: 'entete' })
            dom.addElement(entete, 'div', { id: 'lienConsigne' }, 'Consigne')
            dom.addElement(entete, 'div', { id: 'lienReponse' }, 'Réponse')
            dom.addElement(entete, 'div', { id: 'filariane' })
            dom.addElement(entete, 'div', { id: 'information', 'class': 'invisible' })
            var divConsigne = dom.addElement(entete, 'div', { id: 'consigne', 'class': 'invisible' })
            var divReponse = dom.addElement(entete, 'div', { id: 'reponse', 'class': 'invisible' })
            if (hasConsigne) {
              if (params.consigne) $(divConsigne).html(params.consigne)
              else log.error('Pas de consigne alors que question_option vaut ' + params.question_option)
            }
            if (hasReponse) {
              var form = dom.addElement(divReponse, 'form', { action: '' })
              var textarea = dom.addElement(form, 'textarea', { id: 'answer', cols: '50', rows: '10' })
              if (hasCkeditor) {
                /* global CKEDITOR */
                if (CKEDITOR.env.ie && CKEDITOR.env.version < 9) CKEDITOR.tools.enableHtml5Elements(document)
                CKEDITOR.config.height = 150
                CKEDITOR.config.width = 'auto'
                if (params.answer_editor === 'ckeditorTex') {
                  CKEDITOR.config.extraPlugins = 'mathjax'
                  CKEDITOR.config.mathJaxLib = '/vendor/mathjax/2.2/MathJax.js?config=TeX-AMS-MML_HTMLorMML'
                }
                CKEDITOR.replace('answer', {
                  toolbarGroups: [
                    { name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
                    { name: 'editing', groups: [ 'find', 'selection' ] },
                    { name: 'insert' },
                    { name: 'forms' },
                    { name: 'tools' },
                    { name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
                    { name: 'others' },
                    '/',
                    { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
                    { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ] },
                    { name: 'styles' },
                    { name: 'colors' },
                    { name: 'about' }
                  ],
                  removeButtons: 'Styles,Source',
                  customConfig: '' // on veut pas charger le config.js
                })
              } else if (hasMqEditor) {
                editor(form, params.mqEditorConfig, options)
              }
              if (resultatCallback) {
                var isResultatSent = false
                dom.addElement(form, 'br')
                var boutonReponse = dom.addElement(form, 'button', { id: 'envoi' }, 'Enregistrer cette réponse')
                // on ajoute l'envoi de la réponse sur le bouton et à la fermeture
                $(boutonReponse).click(sendReponse)
                $('body').on('unload', function () {
                  sendReponse(null, true)
                })
                $(textarea).change(function () {
                  isResultatSent = false
                })
              } else if (options.preview) {
                dom.addElement(form, 'p', null, "Réponse attendue mais pas d'envoi possible en prévisualisation")
              } else {
                dom.addElement(form, 'p', { 'class': 'info', style: { margin: '1em;' } },
                  "Aucun enregistrement ne sera effectué (car aucune destination n'a été fournie pour l'envoyer, normal en visualisation seule)")
              }
              addPage(url, params, function () {
                urlUi(ressource, options, function () {
                  $('#loading').empty()
                  next()
                })
              })
            }
          }) // require.ensure
        }) // page.loadAsync
      } // fin question-réponse
    } catch (error) {
      if (next) next(error)
      else page.addError(error)
    }
  })
}
