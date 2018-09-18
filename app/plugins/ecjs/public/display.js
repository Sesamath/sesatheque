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

import 'client-react/styles/display.scss'

const dom = require('sesajstools/dom')
const log = require('sesajstools/utils/log')
const sjtUrl = require('sesajstools/http/url')

const page = require('../../../client/page/index')
const showOptionsEditor = require('./showOptionsEditor')

/**
 * Affiche les ressources ecjs (exercices calculatice en javascript)
 * inspiré de http://calculatice.ac-lille.fr/calculatice/bibliotheque/javascript/api/
 * @service plugins/ecjs/display
 * @param {Ressource}      ressource  L'objet ressource
 * @param {displayOptions} options    Possibilité de passer ecjsBase pour modifier http://ressources.sesamath.net/replication_calculatice/javascript
 * @param {errorCallback}  [next]     La fct à appeler quand le swf sera chargé
 */
const display = (ressource, options, next) => {
  function displayEcjs () {
    // pour utiliser le serveur de calculatice mettre http://calculatice.ac-lille.fr/calculatice/bibliotheque/javascript
    // pb, les exercices avec canvas ne fonctionnent pas (pb de CORS sur les getImageData
    // => security restrictions on reading canvas pixel data with local or cross-domain images)
    // on contourne avec le domaine local, et on redirige /replication_calculatice via le frontal web (varnish)
    const ecjsBase = sjtUrl.getParameter('ecjsBase') || options.ecjsBase || window.location.protocol + '//' + window.location.host + '/addons/replication_calculatice/javascript'

    // d'après {ecjsBase}/api/clc-api.main.js
    // celui-là détruit notre style et semble ne rien apporter dans les exos
    // 'http://calculatice.ac-lille.fr/calculatice/squelettes/css/clear.css',
    dom.addCss(ecjsBase + '/lib-externes/jquery/css/start/jquery-ui-1.10.4.custom.min.css')
    dom.addCss(ecjsBase + '/clc/css/clc.css')
    // si on prend pas le css original qui reset html et body, ça casse tout (le rectangle clc s'affiche pas),
    // mais en le laissant ça casse nos styles, faudrait le mettre toujours en iframe :-/

    // on vire require que Raphael et Big ne supportent pas
    // on espère que plus personne n'en aura besoin
    if (typeof window.define !== 'undefined') {
      console.error('Les bibliotheques Raphael et Big utilisées par calculatice ne sont pas compatibles avec requireJs, on désactive define et require')
      window.define = undefined // eslint-disable-line no-native-reassign
      window.require = undefined
    }
    if (typeof window.require !== 'undefined') {
      console.error('Les bibliotheques Raphael et Big utilisées par calculatice ne sont pas compatibles avec commonJs, on désactive require')
      window.require = undefined
    }
    // Cf /home/sesamath/bin/fetchCalculatice.sh qui tourne sur le serveur web ressources.sesamath.net
    // pour la liste des js concaténés dans scripts.js
    page.loadAsync(ecjsBase + '/scripts.js', function () {
      // on vérifie que l'on a tous les objets globaux souhaités
      ;[ 'Modernizr', '$', 'SVG', 'Raphael', 'Big', 'createjs', 'CLC' ].forEach((prop, i) => {
        if (typeof window[prop] === 'undefined') throw new Error(`Problème de chargement d’une dépendance calcul@tice, ${prop} n’existe pas`)
      })

      // On réinitialise le conteneur
      const container = options.container
      dom.empty(container)
      const divExoClc = dom.addElement(container, 'div', { id: 'exoclc', style: { margin: '0 auto', width: '735px' } })
      const footer = dom.addElement(container, 'p', {
        style: {
          'text-align': 'right',
          margin: '0 auto',
          width: '735px'
        }
      }, 'Exercice original provenant du site ')
      dom.addElement(footer, 'a', { href: 'http://calculatice.ac-lille.fr/', target: '_blank' }, 'Calcul@tice')
      const $divExoClc = $(divExoClc)

      const isOptionsEditorMode = typeof options.onLoadEditorCb === 'function'

      if (isOptionsEditorMode) {
        const {exoBase: pristineExoBase} = CLC
        const exoBase = (arg) => {
          const exo = pristineExoBase(arg)
          window.currentExo = exo
          return exo
        }
        CLC.exoBase = exoBase
      }

      // les options clc
      const optionsClc = ressource.parametres.options || {}
      if (options.hasOwnProperty('parametrable')) optionsClc.parametrable = options.parametrable
      else if (isOptionsEditorMode) optionsClc.parametrable = true
      else optionsClc.parametrable = !!options.isFormateur
      // le nom de l'exo
      const nomExo = ressource.parametres.fichierjs
      const cheminExo = ecjsBase + '/exercices/'
      // des flags
      let exoLoaded = false

      // si ça intéresse l'appelant et que le chargement est KO on finira par le dire après 10s
      if (next && typeof next === 'function') {
        setTimeout(function () {
          if (!exoLoaded) next(new Error('Exercice calculatice toujours pas chargé après 10s'))
        }, 10000) // on laisse 10s avant d'envoyer une erreur de chargement
      }

      // cree un exo de maniere asynchrone
      log('on va charger l’exo ' + nomExo + ' avec les options', optionsClc)
      const reqExo = CLC.loadExo(cheminExo + nomExo, optionsClc)

      // quand l'exo est pret on le met dans son div
      reqExo.done(function (exoClc) {
        $divExoClc.html(exoClc)
        // on a pas d'événement sur l'exo chargé, faut attendre que le js de calculatice ait complété le dom
        $divExoClc.ready(function () {
          exoLoaded = true

          // ////////     MODE ÉDITION DES OPTIONS    //////////
          // si l'utilisateur veut récupérer les paramètres, on les affiche directement
          // (en cliquant sur le bouton de paramétrage à sa place)
          // et on lui file une fonction pour récupérer une promesse de récupération de ces options
          if (isOptionsEditorMode) {
            showOptionsEditor($, {exoClc, ressource, options})

            // ////////     MODE STANDARD avec envoi de résultats    //////////
          } else if (options.resultatCallback) {
            let resultatSent = false
            /* global CLC, $ */
            // le 2e arg se retrouve dans event.data (event 1er arg passé à la callback)
            // pour la liste des événements, chercher 'publier' dans les sources calculatice
            // on a validationQuestion, validationOption, finExercice
            // pour finExercice on récupère {idExo, numExo, score {int, nb de bonnes réponses}, total {int, nb total de questions}, duree {int, en secondes}}
            const envoyerScoreExoJs = (event, data) => {
              log('résultats reçus du js calculatice', data)
              if (!options || typeof options.resultatCallback !== 'function') return
              resultatSent = true // même si ça plante, pas la peine de recommencer au unload
              const dataToSend = {
                fin: true,
                // on veut pas laisser affiché le bouton recommencer
                $resetDelay: 0
              }
              if (data.total > 0) {
                const score = parseInt(data.score, 10) || 0
                dataToSend.score = score / data.total
                dataToSend.reponse = score + ' sur ' + data.total
              } else {
                dataToSend.reponse = 'score indéterminé'
              }
              if (options.resultatCallback) {
                options.resultatCallback(dataToSend)
              }
            }

            // on le met en listener de la fin d'exo
            exoClc.on('finExercice', null, envoyerScoreExoJs)
            // et au unload
            window.addEventListener('unload', function () {
              log('unload ecjs')
              if (exoLoaded && !resultatSent) {
                envoyerScoreExoJs(null, {
                  score: 0,
                  reponse: 'Aucune réponse',
                  fin: true
                })
              }
            })
          } // fin du else envoyer résultat

          if (next && typeof next === 'function') {
            next()
          }
        }) // $divExoClc.ready
      }) // reqExo.done
    })
  } // displayEcjs

  try {
    // vérifs de base
    if (!options.container) throw new Error('Paramétrage manquant (conteneur)')
    if (!ressource.parametres.fichierjs) throw new Error('Paramétrage manquant (type d’exercice à lancer)')
    displayEcjs()
  } catch (error) {
    if (next) next(error)
    else page.addError(error)
  }
}

export default display
