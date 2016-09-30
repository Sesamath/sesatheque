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
/* eslint-disable camelcase */
var dom = require('sesajstools/dom')
var log = require('sesajstools/utils/log')

var page = require('../../page/index')

var $
/* jshint jquery:true */

/**
 * Retourne une seule fonction qui affectera les comportements de l'interface avec la gestion des étapes pour les ressources url
 * @service plugins/url/displayUi
 * @param {Ressource}      ressource
 * @param {displayOptions} options
 * @param {errorCallback}  next
 */
module.exports = function (ressource, options, next) {
  page.loadAsync(['jquery', 'jqueryUiDialog'], function () {
    $ = window.jQuery
    // faut attendre que tout soit fini de charger et que jQuery ai fini de manipuler le dom
    $(function () {
      function getLienSuivant () {
        return dom.getElement('img', {
          'class': 'lienSuivant',
          src: options.pluginBase + 'images/forward.png',
          align: 'absmiddle',
          alt: 'suivant',
          onclick: etapes.next
        })
      }

      /**
       * Initialise les fenêtres modales
       */
      function init () {
        // les comportements qui dépendent pas du contexte
        $lienConsigne.click(consigne.toggle)
        $lienReponse.click(reponse.toggle)

        // les fenetres modales
        var informationDialogOptions = {
          title: 'Information',
          autoOpen: false,
          resizable: false,
          position: {my: 'left+10 top+10', at: 'left bottom', of: '#entete'},
          buttons: {
            'OK': function () {
              $information.dialog('close')
            }
          }
        }
        $information.dialog(informationDialogOptions)

        var consigneDialogOptions = {
          // position : [30, 50],
          // cf http://api.jqueryui.com/position/
          position: {my: 'left+30 top+50', at: 'left bottom', of: '#entete'},
          width: 450,
          height: 350,
          resizable: true,
          autoOpen: false,
          title: 'Consigne',
          close: function () {
            $lienConsigne.css('font-weight', 'bold')
          },
          open: function () {
            if (hasTexConsigne) {
              // @see https://groups.google.com/forum/#!topic/mathjax-users/v6nVeANKihs
              // http://docs.mathjax.org/en/latest/queues.html
              log('open consigne')
              /* global MathJax */
              MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'consigne'])
            }
            $lienConsigne.css('font-weight', 'normal')
          }
        }
        $consigne.dialog(consigneDialogOptions)

        var reponseDialogOptions = {
          width: hasCkeditor ? 580 : 480,
          height: hasCkeditor ? 400 : 320,
          // position : [$('body').width() - 30 - 472, 50],
          position: {my: 'right-30 top+70', at: 'right bottom', of: '#entete'},
          resizable: true,
          autoOpen: false,
          title: 'Ta réponse',
          ferme: function () {
            $lienReponse.css('font-weight', 'bold')
          },
          ouvre: function () {
            $lienReponse.css('font-weight', 'normal')
          }
        }
        $reponse.dialog(reponseDialogOptions)
      } // init

      /**
       * Charge les éventuelles dépendances avant d'appeler next
       * @private
       * @param next
       */
      function loadDependencies (next) {
        var dependances = []
        if (hasTexConsigne && typeof MathJax === 'undefined') dependances.push('mathjax')
        if (dependances.length) page.loadAsync(dependances, next)
        else next()
      }

      /**
       * Construit la liste des étapes d'après les options
       * @private
       */
      function setEtapes () {
        /**
         * Option de l'affichage de la question qui peut prendre les valeurs
         *   'off'    : pas de question
         *   'before' : avant la page
         *   'while'  : pendant la page
         *   'after'  : après la page
         * @type {string}
         */
        var question_option = ressource.parametres.question_option || 'off'
        /**
         * Option de l'affichage de la réponse qui peut prendre les valeurs
         *   'off'      : pas de réponse attendue
         *   'question' : pendant l'affichage de la question
         *   'while'    : pendant l'affichage de la page
         *   'after'    : après la page
         * @type {string}
         */
        var answer_option = ressource.parametres.answer_option || 'off'
        log('lien suivant dans setEtapes', lienSuivant)

        if (question_option === 'off') {
          etapes.liste = [[information, iframe]]
          // pas de question, pour la réponse :
          if (answer_option === 'while') {
            etapes.titres = ['Visualisation du document et réponse']
            information.setContent('Observe ce document et envoie ta réponse.')
            // ajout de la réponse à la 1re étape
            etapes.liste[0].push(reponse)
          } else if (answer_option === 'after') {
            etapes.titres = ['Visualisation du document', 'Réponse']
            information.setContent('Observe ce document puis clique sur ', getLienSuivant(), ' pour répondre.')
            // ajout de la réponse en 2e étape
            etapes.liste.push([reponse])
          }
        } else if (question_option === 'before') {
          // consigne puis page
          etapes.liste = [[consigne, information], [iframe]]
          if (answer_option === 'off') {
            etapes.titres = ['Lecture de la consigne', 'Visualisation du document']
            information.setContent('Commence par lire la consigne, puis clique sur ', getLienSuivant(), ' pour voir le document.')
          } else if (answer_option === 'while') {
            etapes.titres = ['Lecture de la consigne', 'Visualisation du document et réponse']
            information.setContent('Lis la consigne, clique sur ', getLienSuivant(), ' pour voir le document et répondre.')
            etapes.liste[1].push(reponse)
          } else if (answer_option === 'after') {
            etapes.titres = ['Lecture de la consigne', 'Visualisation du document', 'Réponse']
            information.setContent('Lis la consigne, clique sur ', getLienSuivant(), ' pour voir le document, puis encore une fois pour répondre.')
            etapes.liste.push([reponse])
          } else if (answer_option === 'question') {
            etapes.titres = ['Lecture de la consigne et réponse', 'Visualisation du document']
            information.setContent('Réponds à la question, puis clique sur ', getLienSuivant(), ' pour voir le document.')
            // réponse avant l'info
            etapes.liste = [[consigne, reponse, information], [iframe]]
          }
        } else if (question_option === 'while') {
          etapes.liste = [[consigne, iframe]]
          if (answer_option === 'after') {
            etapes.liste[0].push(information)
            information.setContent('Lis la consigne, observe bien le document puis clique sur ', getLienSuivant(), ' pour pouvoir répondre.')
            etapes.liste.push([reponse])
            etapes.titres = ['Réponse', 'Visualisation de la consigne et du document']
          } else if (answer_option === 'while' || answer_option === 'question') {
            $filariane.hide()
            etapes.liste[0].push(reponse)
            etapes.titres = ['Consigne, visualisation du document et réponse']
          } else {
            $filariane.hide()
            etapes.titres = ['Consigne et visualisation du document']
          }
        } else if (question_option === 'after') {
          etapes.liste = [[page, information], [consigne]]
          if (answer_option === 'off') {
            etapes.titres = ['Visualisation du document', 'consigne']
            information.setContent('Observe bien le document puis clique sur ', getLienSuivant(), ' pour lire la consigne.')
          } else if (answer_option === 'after') {
            etapes.titres = ['Visualisation du document', 'Lecture de la consigne', 'Réponse']
            information.setContent('Observe bien le document puis clique sur ', getLienSuivant(), ' pour lire la consigne et encore une fois pour répondre.')
            etapes.liste.push([reponse])
          } else {
            information.setContent('Observe bien le document puis clique sur ', getLienSuivant(), ' pour lire la consigne et répondre.')
            etapes.liste[1].push(reponse)
            etapes.titres = ['Visualisation du document', 'Consigne et réponse']
          }
        }
      } // setEtapes

      /**
       * Réactualise l'affichage avec l'étape etapes.currentIndex
       * @private
       */
      function showEtape () {
        log('showEtape')
        var i
        // on ferme tout
        reponse.desactiver()
        consigne.desactiver()
        iframe.desactiver()

        // active les elts de l'etape en cours
        var etape = etapes.liste[etapes.currentIndex]
        for (i = 0; i < etape.length; i++) {
          // log('active ' +i +' ' +etapes.titres[i], etape[i])
          etape[i].activer()
        }

        // reconstruction du fil d'ariane, titre des étapes passées
        // + titre actuel ≠ + suivant)
        $filariane.empty()
        var c = etapes.currentIndex
        for (i = 0; i < c; i++) {
          $filariane.append('Étape ' + (i + 1) + ' : ' + etapes.titres[i] + ' >> ')
        }
        // ajout titre courant
        $filariane.append('Étape ' + (c + 1) + ' : ').append(dom.getElement('span', {'class': 'highlight'}, etapes.titres[c]))
        // titre suivant éventuel
        if (etapes.hasNext()) {
          $filariane.append(getLienSuivant())
          // $(lienSuivant).click(etapes.next)
        }
      } // showEtape

      try {
        if (!ressource || !ressource.parametres || !ressource.parametres.adresse) throw new Error('ressource manquante ou incomplète')
        log('urlUi avec ', ressource.parametres, options)
        /**
         * Editeur à utiliser pour la réponse
         *   textarea : un textarea tout simple
         *   ckeditor : ckeditor en version standard
         *   ckeditorTex : ckeditor avec le plugin mathjax
         * @private
         * @type {string}
         */
        var answer_editor = ressource.parametres.answer_editor || 'textarea'

        dom.addCss(options.base + 'vendor/jqueryUi/1.11.4.dialogRedmond/jquery-ui.min.css')

        var etapes = {
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

        /** Le html du lien suivant */
        var lienSuivant = dom.getElement('img', {
          'class': 'lienSuivant',
          src: options.pluginBase + 'images/forward.png',
          align: 'absmiddle',
          alt: 'suivant',
          onclick: etapes.next
        })

        /*
         * Nos 4 éléments qui peuvent entrer dans une étape : iframe, information, consigne, reponse
         */

        /* La page en iframe, ou div si swf */
        var iframe = {
          activer: function () {
            $page.show()
          },
          desactiver: function () {
            $page.hide()
          }
        }

        /* objet pour la fenêtre modale information */
        var information = {
          activer: function () {
            $information.dialog('open')
          },
          desactiver: function () {
            if ($information.dialog('isOpen')) $information.dialog('close')
          },
          setContent: function (content) {
            $information.html(content)
            if (arguments.length > 1) {
              for (var i = 1; i < arguments.length; i++) {
                $information.append(arguments[i])
              }
            }
          }
        }

        /* objet pour la fenêtre modale consigne */
        var consigne = {
          activer: function () {
            $consigne.dialog('open')
            $lienConsigne.show()
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
        var reponse = {
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

        var $filariane = $('#filariane')
        var $consigne = $('#consigne')
        var $reponse = $('#reponse')
        var $information = $('#information')
        var $lienConsigne = $('#lienConsigne')
        var $lienReponse = $('#lienReponse')
        var $page = $('#divPage')

        // ce truc renvoie toujours 0 !!! (il ne compte que le visible ?)
        // var hasTexConsigne = ($consigne.filter('.math-tex').length > 0)
        var hasTexConsigne = ($consigne.find('.math-tex').length > 0)
        // var hasTexConsigne = $consigne.html().indexOf('class='math-tex'')
        var hasCkeditor = (answer_editor !== 'textarea')

        loadDependencies(function () {
          init()
          setEtapes()
          log('les etapes', etapes)
          showEtape()
          next()
        })
      } catch (error) {
        if (next) next(error)
        else page.addError(error)
      }
    }) // $(code)
  }) // loadAsync
}
