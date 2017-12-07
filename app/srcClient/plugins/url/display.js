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

const dom = require('sesajstools/dom')
const log = require('sesajstools/utils/log')
const page = require('../../page/index')
const swf = require('../../display/swf')

// attention à mettre la même chose que dans displayUi et le css
const divIframeId = 'page'
const divIframeSelector = '#page'

/**
 * Affiche les ressources de type url (page externe) en créant une iframe dans le container (ou un div si l'url est un swf)
 * @service plugins/url/display
 * @param {Ressource}      ressource  L'objet ressource
 * @param {displayOptions} options    Les options après init
 * @param {errorCallback}  next       La fct à appeler quand le contenu sera chargé
 */
module.exports = function urlDisplay (ressource, options, next) {
  require.ensure(['jquery'], function (require) {
    /**
     * Ajoute le bouton vu et le listener sur unload quand il n'y a pas de réponse demandée
     */
    function addDefaultResultatCb () {
      // un listener pour envoyer 'affiché' comme score (i.e. un score de 1 avec une durée)
      options.container.addEventListener('unload', function () {
        if (isLoaded && !isResultatSent) sendResultat(null, true)
      })
      // le bouton vu
      page.addBoutonVu(function () {
        sendResultat(null, true)
      })
    }

    /**
     * Ajoute l'iframe (ou un div si c'est un swf directement)
     * @private
     */
    function addPage (url, params, next) {
      log('addPage avec les params', params)
      var divIframe = dom.addElement(options.container, 'div', {id: divIframeId, 'class': 'invisible'})
      var divIframeSrcId = 'urlSrc'
      dom.addElement(divIframe, 'p', {id: divIframeSrcId}, 'source : ' + params.adresse)
      const autosizeBlocs = [divIframeSrcId]
      const autosizeOptions = {offsetHeight: 0, offsetWidth: 40}
      // toujours autosize sur le conteneur
      page.autosize(divIframeId, autosizeBlocs, null, autosizeOptions)
      // url sera ajouté après l'appel de afterLoading, pour éviter que l'eventListener soit ajouté après le load (si c'est en cache)
      var args = {id: 'pageContent'}

      // l'iframe, mais on fait un cas particulier pour les urls en swf qui ne renvoient pas un DOMDocument
      // ff aime pas et sort une erreur js Error: Permission denied to access property 'toString'
      // chrome râle aussi parce que c'est pas un document
      if (/^[^?]+.swf(\?.*)?$/.test(url)) { // faut pas prendre les truc.php?toto=truc.swf
        log("C'est un swf, on ajoute un div et pas une iframe")
        var swfId = 'swf' + (new Date()).getTime()
        var swfOptions = {id: swfId}
        if (params.hauteur) {
          args.height = params.hauteur
          swfOptions.hauteur = params.hauteur
        }
        if (params.largeur) {
          args.width = params.largeur
          swfOptions.largeur = params.largeur
        }
        var swfContainer = dom.addElement(divIframe, 'div', args)
        log('On charge ' + url + ' dans #page avec', swfOptions)
        // ne pas passer directement next en cb sinon il sera appelé avec un argument, qui sera interprété comme une erreur
        swf.load(swfContainer, url, swfOptions, function () {
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
          if (!swfOptions.largeur || !swfOptions.hauteur) page.autosize(swfId, [divIframeSrcId, 'titre'])
        })
        /* */
      } else if (/^[^?]+.(png|jpe?g|gif)(\?.*)?$/.test(url)) {
        // c'est un tag img
        if (params.hauteur > 100) args.height = params.hauteur
        if (params.largeur > 100) args.width = params.largeur
        log("c'est une image, pas d'iframe mais un tag img", args, params)
        var img = dom.addElement(divIframe, 'img', args)
        afterLoading(img, next)
        img.src = url
      } else {
        // c'est bien une iframe, on regarde si on peut la charger
        if (window.location.protocol === 'https:' && !/^https:/.test(url)) {
          const p = dom.addElement(divIframe, 'p', {}, 'La page externe demandée ne peut être incorporée ici car elle n’est pas en https. Vous pouvez ')
          dom.addElement(p, 'a', {href: url, target: '_blank'}, 'l’ouvrir dans un nouvel onglet')
          dom.addText(p, '.')
          next()
        } else {
          // on peut mettre une iframe, le texte sera écrasé à son chargement
          var iframe = dom.addElement(divIframe, 'iframe', args, 'Si vous lisez ce texte,' +
            ' votre navigateur ne supporte probablement pas les iframes')
          // url source (non cliquable) en footer
          const iframeAutosizeOptions = {
            ...autosizeOptions,
            minHeight: 300,
            minWidth: 300,
            offsetHeight: 80,
            offsetWidth: 60
          }
          page.autosize(args.id, autosizeBlocs, [], iframeAutosizeOptions)
          afterLoading(iframe, next)
          iframe.src = url
        }
      }
    } // addPage

    /**
     * Appelle next quand elt sera chargé (evt load)
     * @param {HTMLElement} elt
     * @param {simpleCallback} next
     */
    function afterLoading (elt, next) {
      function loadListener () {
        isLoaded = true
        elt.removeEventListener('load', loadListener)
        next()
      }

      if (elt && elt.addEventListener) {
        elt.addEventListener('load', loadListener)
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
      const resultat = {
        score: 1
      }
      if (deferSync) {
        resultat.fin = true
        resultat.deferSync = true
      }
      if (reponse) resultat.reponse = reponse
      isResultatSent = true
      resultatCallback(resultat, next)
    }

    const $ = require('jquery')
    const {resultatCallback} = options
    let isLoaded
    // pour éviter de reposter au unload si on a cliqué sur le bouton vu avant
    let isResultatSent = false

    try {
      if (!next) {
        next = function displayUiError (error) {
          if (!error) return
          console.error(error)
          page.addError(error)
        }
      }
      // les params minimaux
      if (!ressource) throw new Error('Ressource manquante')
      ;['oid', 'titre', 'parametres'].forEach(p => {
        if (!p) throw new Error(`Ressource incomplète (propriété ${p} manquante)`)
      })
      ;['base', 'pluginBase', 'container', 'errorsContainer'].forEach(function (param) {
        if (!options[param]) throw new Error('Paramètre ' + param + ' manquant')
      })
      // raccourcis
      const params = ressource.parametres || {}
      const url = params.adresse
      if (!url) throw new Error('Url manquante')
      if (!/^https?:\/\//.test(url)) throw new Error('Url invalide : ' + url)

      // init
      dom.addCss(options.pluginBase + 'url.css')

      var hasConsigne = params.question_option !== 'off'
      var hasReponse = params.answer_option !== 'off'
      var isBasic = !hasConsigne && !hasReponse
      // ni question ni réponse, pas grand chose à faire
      if (isBasic) {
        return addPage(url, params, function () {
          if (resultatCallback) addDefaultResultatCb()
          $(divIframeSelector).show()
          next()
        })
      }
      // sinon, faut charger la gestion des dialog jQueryUi
      require.ensure(['./displayUi'], function (require) {
        const displayUi = require('./displayUi')
        // on ajoute l'entete avant la page
        const entete = dom.addElement(options.container, 'div', {id: 'entete'})
        addPage(url, params, () => {
          // on ajoute ça pour displayUi
          if (resultatCallback) options.sendResultat = sendResultat
          options.entete = entete
          displayUi(ressource, options, next)
        })
      })
    } catch (error) {
      next(error)
    }
  })
}
