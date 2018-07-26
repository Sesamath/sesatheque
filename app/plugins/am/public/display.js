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

const page = require('../../../client/page/index')
const swf = require('../../../client/display/swf')

let isLoaded

/**
 * Affiche une ressource am (aides mathenpoche : animations flash, sans réponse de l'élève)
 * @service plugins/am/display
 * @param {Ressource}      ressource  L'objet ressource
 * @param {displayOptions} options    Les options après init
 * @param {errorCallback}  next       La fct à appeler quand le swf sera chargé (sans argument ou avec une erreur)
 */
module.exports = function display (ressource, options, next) {
  try {
    let baseSwf, swfUrl, swfOpt
    const container = options.container
    if (!container) throw new Error('Il faut passer dans les options un conteneur html pour afficher cette ressource')
    const resultat = {
      score: 1,
      fin: true,
      deferSync: true
    }
    let isResultatSend = false
    // on enverra le résultat à la fermeture (si y'a eu un chargement, isLoaded sert de flag)
    if (options.resultatCallback && window.addEventListener) {
      window.addEventListener('unload', function () {
        if (options.sesatheque) resultat.sesatheque = options.sesatheque
        if (isLoaded && !isResultatSend) options.resultatCallback(resultat)
        // sinon le swf n'a pas été chargé (ou on a déjà cliqué sur "vu"), on envoie rien
      })
    }
    const params = ressource.parametres

    log('start am display avec la ressource', ressource)
    // les params minimaux
    if (!ressource.oid || !ressource.titre || !params) {
      throw new Error('Paramètres manquants')
    }

    // On réinitialise le conteneur
    dom.empty(container)

    // notre base (si ça vient pas de l'interface de développement des exo mathenpoche
    // faudra le préciser via ressource.parametres.baseUrl)
    if (ressource.origine !== 'am' && ressource.parametres.baseUrl) baseSwf = ressource.parametres.baseUrl
    else baseSwf = 'https://mep-col.sesamath.net/dev/aides/' + (params.mep_langue_id ? params.mep_langue_id : 'fr')
    // url du swf
    swfUrl = baseSwf + '/aide' + ressource.idOrigine + '.swf'
    // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
    container.setAttribute('width', 735)
    container.style.width = '735px'

    swfOpt = {
      base: baseSwf + '/',
      largeur: 735,
      hauteur: 450
    }
    swf.load(container, swfUrl, swfOpt, function (error) {
      if (error) return next(error)
      isLoaded = true
      if (options.resultatCallback) {
        page.addBoutonVu(function () {
          isResultatSend = true
          options.resultatCallback(resultat)
        })
      }
      next()
    })
  } catch (error) {
    if (next) next(error)
    else page.addError(error)
  }
}
