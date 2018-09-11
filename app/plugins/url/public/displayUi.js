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
 * @file Module js pour gérer l'affichage / masquage de question / réponse / page
 * D'après l'ancien url.js de l'outil labomep
 */

 import forwardImage from './images/forward.png'

/* eslint-disable camelcase */
const dom = require('sesajstools/dom')
const log = require('sesajstools/utils/log')

const page = require('../../../client/page/index')

// attention à mettre la même chose que dans display et le css
const divIframeId = 'page'

/**
 * Retourne une seule fonction qui affectera les comportements de l'interface
 * avec la gestion des étapes pour les ressources url
 * @service plugins/url/displayUi
 * @param {Ressource}      ressource
 * @param {displayOptions} options
 * @param {errorCallback}  next
 */
module.exports = function (ressource, options, next) {
  require.ensure(['jquery', 'jquery-ui'], function (require) {
    const $ = require('jquery')
    // on utilise que dialog
    require('jquery-ui/ui/widgets/dialog')
    // pas besoin de préfixer par style! ou css! car webpack est configuré
    // pour toujours les utiliser sur les extensions css
    // @FIXME pourquoi faut mettre ce vieux css si on veut voir les dialog ?
    dom.addCss(options.base + 'vendor/jqueryUi/1.11.4.dialogRedmond/jquery-ui.min.css')
    // on passe le plus récent après
    require('jquery-ui/themes/base/base.css')
    require('jquery-ui/themes/base/theme.css')
    require('jquery-ui/themes/base/dialog.css')

    // faut attendre que jQuery soit ready
    $(function () {
      function addReponseDialog () {
        const form = dom.addElement(divReponse, 'form', {action: ''})
        const textarea = dom.addElement(form, 'textarea', {id: 'answer', cols: '50', rows: '10'})
        $textarea = $(textarea)
        if (hasCkeditor) {
          /* global CKEDITOR */
          if (CKEDITOR.env.ie && CKEDITOR.env.version < 9) CKEDITOR.tools.enableHtml5Elements(document)
          CKEDITOR.config.height = 150
          CKEDITOR.config.width = 'auto'
          if (params.answer_editor === 'ckeditorTex') {
            CKEDITOR.config.extraPlugins = 'mathjax'
            CKEDITOR.config.mathJaxLib = `${options.baseUrl}vendor/mathjax/2.2/MathJax.js?config=TeX-AMS-MML_HTMLorMML`
          }
          CKEDITOR.replace('answer', {
            toolbarGroups: [
              {name: 'clipboard', groups: ['clipboard', 'undo']},
              {name: 'editing', groups: ['find', 'selection']},
              {name: 'insert'},
              {name: 'forms'},
              {name: 'tools'},
              {name: 'document', groups: ['mode', 'document', 'doctools']},
              {name: 'others'},
              '/',
              {name: 'basicstyles', groups: ['basicstyles', 'cleanup']},
              {name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi']},
              {name: 'styles'},
              {name: 'colors'},
              {name: 'about'}
            ],
            removeButtons: 'Styles,Source',
            customConfig: '' // on veut pas charger le config.js
          })
        } else if (hasMqEditor) {
          editor(form, params.mqEditorConfig, options)
        }

        if (sendResultat) {
          // qqun veut récupérer la réponse
          dom.addElement(form, 'br')
          const boutonReponse = dom.addElement(form, 'button', {id: 'envoi'}, 'Enregistrer cette réponse')
          // on ajoute l'envoi de la réponse sur le bouton et à la fermeture
          $(boutonReponse).click(sendReponse)
          $('body').on('unload', function () {
            sendResultat(null, true)
          })
          $textarea.change(function () {
            isResultatSent = false
          })
        } else if (options.preview) {
          dom.addElement(form, 'p', null, "Réponse attendue mais pas d'envoi possible en prévisualisation")
        } else {
          dom.addElement(form, 'p', { 'class': 'info', style: { margin: '1em;' } },
            "Aucun enregistrement ne sera effectué (car aucune destination n'a été fournie pour l'envoyer, c'est normal en visualisation seule)")
        }
      } // addReponseDialog

      /**
       * Envoie la réponse saisie avec le résultat
       */
      function sendReponse () {
        if (isResultatSent) {
          log('Résultat déjà envoyé')
          return
        }
        sendResultat($textarea.val(), false, function (retour) {
          if (retour && (retour.ok || retour.success)) isResultatSent = true
        })
      }

      /**
       * Retourne un DomElement img créé pour l'occasion
       * @return {HTMLElement}
       */
      function getLienSuivant () {
        const lien = dom.getElement('img', {
          'class': 'lienSuivant',
          src: forwardImage,
          align: 'absmiddle',
          alt: 'suivant'
        })
        if (etapes.hasNext()) $(lien).click(etapes.next)
        return lien
      }

      /**
       * Initialise les fenêtres modales
       */
      function init () {
        // les comportements qui dépendent pas du contexte
        $lienConsigne.click(consigne.toggle)
        $lienReponse.click(reponse.toggle)
        $lienInfo.click(information.toggle)

        // les fenetres modales
        const informationDialogOptions = {
          autoOpen: false,
          // buttons: {'Vu': () => $information.dialog('close')},
          resizable: false,
          // collision none change rien, ça danse quand on enlève un dialog
          // collision fit idem
          position: {my: 'left top+50', at: 'left bottom', of: '#entete'},
          title: 'Information'
        }
        $information.dialog(informationDialogOptions)

        const consigneDialogOptions = {
          autoOpen: false,
          // buttons: {'Vu': () => $consigne.dialog('close')},
          // height: 350,
          // postition: {collision: 'flipfit', within: '#display'},
          position: {my: 'center top+200', at: 'center bottom', of: '#entete'},
          resizable: true,
          title: 'Consigne',
          width: 450
        }
        $consigne.dialog(consigneDialogOptions)

        const reponseDialogOptions = {
          autoOpen: false,
          // height: hasCkeditor ? 400 : 320,
          // position: [$('body').width() - 30 - 472, 50],
          // postition: {collision: 'flipfit', within: '#display'},
          position: {collision: 'fit', my: 'right bottom', at: 'right bottom', of: '#display'},
          resizable: true,
          title: 'Ta réponse',
          width: hasCkeditor ? 580 : 480
        }
        $reponse.dialog(reponseDialogOptions)
      } // init

      /**
       * Charge les éventuelles dépendances avant d'appeler next
       * @private
       * @param next
       */
      function loadDependencies (next) {
        const dependances = []
        if (hasTexConsigne && typeof MathJax === 'undefined') dependances.push('mathjax')
        if (dependances.length) page.loadAsync(dependances, next)
        else next()
      }

      /**
       * Construit la liste des étapes d'après les options
       * @private
       */
      function setEtapes () {
        let hasInfo = true
        /**
         * Option de l'affichage de la question qui peut prendre les valeurs
         *   'off'    : pas de question
         *   'before' : avant la page
         *   'while'  : pendant la page
         *   'after'  : après la page
         * @type {string}
         */
        const question_option = ressource.parametres.question_option || 'off'
        /**
         * Option de l'affichage de la réponse qui peut prendre les valeurs
         *   'off'      : pas de réponse attendue
         *   'question' : pendant l'affichage de la question
         *   'while'    : pendant l'affichage de la page
         *   'after'    : après la page
         * @type {string}
         */
        const answer_option = ressource.parametres.answer_option || 'off'

        // pas de question
        if (question_option === 'off') {
          if (answer_option === 'while') {
            etapes.liste = [[information, iframe, reponse]]
            etapes.titres = ['Visualisation du document et réponse']
            information.setContent('Observe ce document et envoie ta réponse.')
          } else if (answer_option === 'after') {
            etapes.liste = [[information, iframe], [reponse]]
            etapes.titres = ['Visualisation du document', 'Réponse']
            information.setContent('Observe ce document puis clique sur ', getLienSuivant(), ' pour répondre.')
          } else {
            // off (car pas de before possible pour la réponse)
            etapes.liste = [[iframe]]
            etapes.titres = ['Visualisation du document']
            hasInfo = false
          }

        // question avant
        } else if (question_option === 'before') {
          // consigne puis page
          if (answer_option === 'off') {
            etapes.liste = [[information, consigne], [iframe]]
            etapes.titres = ['Lecture de la consigne', 'Visualisation du document']
            information.setContent('Commence par lire la consigne, puis clique sur ', getLienSuivant(), ' pour voir le document.')
          } else if (answer_option === 'while') {
            etapes.liste = [[information, consigne], [iframe, reponse]]
            etapes.titres = ['Lecture de la consigne', 'Visualisation du document et réponse']
            information.setContent('Lis la consigne, clique sur ', getLienSuivant(), ' pour voir le document et répondre.')
          } else if (answer_option === 'after') {
            etapes.liste = [[information, consigne], [iframe], [reponse]]
            etapes.titres = ['Lecture de la consigne', 'Visualisation du document', 'Réponse']
            information.setContent('Lis la consigne, clique sur ', getLienSuivant(), ' pour voir le document, puis encore une fois pour répondre.')
          } else {
            // answer_option = question
            etapes.liste = [[information, consigne, reponse], [iframe]]
            etapes.titres = ['Lecture de la consigne et réponse', 'Visualisation du document']
            information.setContent('Réponds à la question, puis clique sur ', getLienSuivant(), ' pour voir le document.')
            // réponse avant l'info
          }

        // question pendant
        } else if (question_option === 'while') {
          if (answer_option === 'after') {
            etapes.liste = [[information, consigne, iframe], [reponse]]
            etapes.titres = ['Réponse', 'Visualisation de la consigne et du document']
            information.setContent('Lis la consigne, observe bien le document puis clique sur ', getLienSuivant(), ' pour pouvoir répondre.')
          } else if (answer_option === 'while' || answer_option === 'question') {
            etapes.liste = [[information, consigne, iframe, reponse]]
            etapes.titres = ['Consigne, visualisation du document et réponse']
            information.setContent('Lis la consigne et observe bien le document avant de répondre.')
          } else {
            // off
            etapes.liste = [[consigne, iframe]]
            etapes.titres = ['Consigne et visualisation du document']
            hasInfo = false
          }

        // question après
        } else if (question_option === 'after') {
          if (answer_option === 'off') {
            etapes.liste = [[information, iframe], [consigne]]
            etapes.titres = ['Visualisation du document', 'consigne']
            information.setContent('Observe bien le document puis clique sur ', getLienSuivant(), ' pour lire la consigne.')
          } else if (answer_option === 'after') {
            etapes.liste = [[information, iframe], [consigne], [reponse]]
            etapes.titres = ['Visualisation du document', 'Lecture de la consigne', 'Réponse']
            information.setContent('Observe bien le document puis clique sur ', getLienSuivant(), ' pour lire la consigne et encore une fois pour répondre.')
          } else {
            // while ou question
            etapes.liste = [[information, iframe], [consigne, reponse]]
            etapes.titres = ['Visualisation du document', 'Consigne et réponse']
            information.setContent('Observe bien le document puis clique sur ', getLienSuivant(), ' pour lire la consigne et répondre.')
          }
        }

        // les rares cas où_l'affichage de l'information n'a pas de sens sont ci-dessus avec hasInfo = false
        if (hasInfo) {
          $lienInfo.show()
          $information.dialog('open')
        } else {
          $lienInfo.hide()
        }
      } // setEtapes

      /**
       * Réactualise l'affichage avec l'étape etapes.currentIndex
       * @private
       */
      function showEtape () {
        const {currentIndex} = etapes
        const etape = etapes.liste[currentIndex]
        const titre = etapes.titres[currentIndex]
        // log(`showEtape ${currentIndex} ${titre}`)
        let i
        // on cache tout
        information.desactiver()
        reponse.desactiver()
        consigne.desactiver()
        iframe.desactiver()

        // active les elts de l'etape en cours
        log(`étape ${etapes.currentIndex}`, etapes)
        log(`étape ${etapes.currentIndex} (${etape.map(e => e.name).join('+')}) ${titre}`)
        etape.forEach(item => item.activer())
        // cache les boutons close
        $('.ui-dialog-titlebar-close').hide()

        // reconstruction du fil d'ariane, titre des étapes passées
        // + titre actuel ≠ + suivant)
        $filariane.empty()
        for (i = 0; i < currentIndex; i++) {
          $filariane.append(`Étape ${i + 1} : ${etapes.titres[i]} >> `)
        }
        // ajout titre courant
        $filariane.append(`Étape ${currentIndex + 1} : `).append(dom.getElement('span', {'class': 'highlight'}, titre))
        // le lien suivant éventuel
        if (etapes.hasNext()) {
          const lien = getLienSuivant()
          $filariane.append(lien)
        }
      } // showEtape

      // les variables communes à nos fcts, affectées dans le try
      let consigne,
        divConsigne,
        divReponse,
        editor,
        etapes,
        hasCkeditor,
        hasConsigne,
        hasMqEditor,
        hasReponse,
        hasTexConsigne,
        iframe,
        information,
        isResultatSent,
        params,
        reponse,
        sendResultat,
        $filariane,
        $consigne,
        $reponse,
        $information,
        $lienConsigne,
        $lienInfo,
        $lienReponse,
        $page,
        $textarea
      try {
        log('urlUi avec ', ressource.parametres, options)
        isResultatSent = false
        const params = ressource.parametres
        const {container} = options
        sendResultat = options.sendResultat
        hasConsigne = params.question_option !== 'off'
        hasReponse = params.answer_option !== 'off'
        /**
         * Editeur à utiliser pour la réponse
         *   textarea : un textarea tout simple
         *   ckeditor : ckeditor en version standard
         *   ckeditorTex : ckeditor avec le plugin mathjax
         *   mqEditor : mathquill (à implémenter)
         * @private
         * @type {string}
         */
        const hasCkeditor = (params.answer_editor && params.answer_editor.indexOf('ckeditor') === 0)
        const hasMqEditor = (params.answer_editor === 'mqEditor')
        // on les liste explicitement pour aider webpack
        if (hasCkeditor) editor = require('../../../client/editors/multiEditor')
        else if (hasMqEditor) editor = require('../../../client/editors/multiEditor')

        $page = $(`#${divIframeId}`)
        // on ajoute tous nos div même si tous ne serviront pas, pour simplifier le code
        // les liens
        const entete = options.entete
        $lienReponse = $(dom.addElement(entete, 'div', {id: 'lienReponse'}, 'Réponse'))
        $lienConsigne = $(dom.addElement(entete, 'div', {id: 'lienConsigne'}, 'Consigne'))
        $lienInfo = $(dom.addElement(entete, 'div', {id: 'lienInfo'}, 'Information'))
        $filariane = $(dom.addElement(entete, 'div', {id: 'filariane'}))
        // les dialogs
        $information = $(dom.addElement(container, 'div', {id: 'information', 'class': 'invisible'}))
        divConsigne = dom.addElement(container, 'div', {id: 'consigne', 'class': 'invisible'})
        $consigne = $(divConsigne)
        divReponse = dom.addElement(container, 'div', {id: 'reponse', 'class': 'invisible'})
        $reponse = $(divReponse)
        if (hasConsigne) {
          if (params.consigne) {
            $(divConsigne).html(params.consigne)
          } else {
            log.error(`Pas de consigne alors que question_option vaut ${params.question_option}`)
            $(divConsigne).html('Pas de consigne donnée.')
          }
        }

        // gestion réponse
        // console.log(`url avec hasReponse ${hasReponse} et cb ${sendResultat ? 'oui' : 'non'} `)
        if (hasReponse) {
          // y'a une réponse à faire
          addReponseDialog()
        } else if (sendResultat) {
          // pas de réponse demandée mais qqun attend un résultat, on ajoute le bouton vu
          page.addBoutonVu(() => sendResultat(null, true))
        }

        etapes = {
          currentIndex: 0,
          // chaque elt est une etape : un tableau avec les objets à afficher (parmi consigne, reponse, information, iframe)
          liste: [],
          // les titres de chaque étape
          titres: [],
          hasNext: function () {
            return etapes.currentIndex < (etapes.liste.length - 1)
          },
          next: function () {
            if (etapes.hasNext()) {
              etapes.currentIndex++
              showEtape()
            }
          }
        }

        /*
         * Nos 4 éléments qui peuvent entrer dans une étape : iframe, information, consigne, reponse
         */

        /* La page en iframe, ou div si swf */
        iframe = {
          name: 'iframe',
          activer: function () {
            $page.show()
          },
          desactiver: function () {
            $page.hide()
          }
        }

        /* objet pour la fenêtre modale information */
        information = {
          name: 'information',
          activer: function () {
            $information.dialog('open')
            $lienInfo.show()
          },
          desactiver: function () {
            $information.dialog('close')
            $lienInfo.hide()
          },
          setContent: function (content) {
            $information.html(content)
            if (arguments.length > 1) {
              for (let i = 1; i < arguments.length; i++) {
                $information.append(arguments[i])
              }
            }
          },
          toggle: function () {
            if ($information.dialog('isOpen')) $information.dialog('close')
            else $information.dialog('open')
          }
        }

        /* objet pour la fenêtre modale consigne */
        consigne = {
          name: 'consigne',
          activer: function () {
            $consigne.dialog('open')
            $lienConsigne.show()
            if (hasTexConsigne) {
              // @see https://groups.google.com/forum/#!topic/mathjax-users/v6nVeANKihs
              // http://docs.mathjax.org/en/latest/queues.html
              /* global MathJax */
              MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'consigne'])
            }
          },
          desactiver: function () {
            $consigne.dialog('close')
            $lienConsigne.hide()
          },
          toggle: function () {
            if ($consigne.dialog('isOpen')) $consigne.dialog('close')
            else $consigne.dialog('open')
          }
        }

        /* objet pour la fenêtre modale réponde */
        reponse = {
          name: 'reponse',
          activer: function () {
            $reponse.dialog('open')
            $lienReponse.show()
          },
          desactiver: function () {
            $reponse.dialog('close')
            $lienReponse.hide()
          },
          toggle: function () {
            if ($reponse.dialog('isOpen')) $reponse.dialog('close')
            else $reponse.dialog('open')
          }
        }

        // ce truc renvoie toujours 0 !!! (il ne compte que le visible ?)
        // const hasTexConsigne = ($consigne.filter('.math-tex').length > 0)
        hasTexConsigne = ($consigne.find('.math-tex').length > 0)
        // const hasTexConsigne = $consigne.html().indexOf('class='math-tex'')

        loadDependencies(function () {
          init()
          setEtapes()
          log(`les étapes : ${etapes.liste.map(etape => etape.map(item => item.name).join('+')).join(' > ')}`, etapes.titres)
          showEtape()
          next()
        })
      } catch (error) {
        console.error(error)
        next(new Error('Une erreur est survenue'))
      }
    }) // $(code)
  }) // require.ensure
}
