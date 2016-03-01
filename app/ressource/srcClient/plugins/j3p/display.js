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
// var dom = require('../../tools/dom')
var log = require('../../tools/log')
var xhr = require('../../tools/xhr')

var urlBaseJ3p = 'http://j3p.sesamath.net'

/**
 * Affiche la ressource dans l'élément d'id mepRess
 * @service plugins/j3p/display
 * @param {Ressource}      ressource  L'objet ressource
 * @param {displayOptions} options    Les options après init
 * @param {errorCallback}  next       La fct à appeler quand le swf sera chargé
 */
module.exports = function display (ressource, options, next) {
  /**
   * Chargera la ressource quand on aura éventuellement récupéré lastResultat
   */
  function load () {
    log('lancement du chargement j3p sur ' + urlBaseJ3p)
    // cf https://github.com/petehunt/webpack-howto et
    // https://webpack.github.io/docs/code-splitting.html
    require.ensure(['./loader'], function (require) {
      var loader = require('./loader')
      try {
        // on cache toujours le titre
        page.hideTitle()
        // on lui donne nos params
        loader.init({urlBaseJ3p: urlBaseJ3p, log: log})
        var j3pOptions = {}
        if (options.resultatCallback) {
          j3pOptions.resultatCallback = options.resultatCallback
        }
        if (options.lastResultat) {
          j3pOptions.lastResultat = options.lastResultat
        }
        log('loader j3p avec le graphe', ressource.parametres.g)
        if (ressource.parametres.g instanceof Array) {
          loader.charge(options.container, ressource.parametres.g, j3pOptions)
          next() // le chargement sera pas terminé mais le loader propose pas de callback
        } else {
          next(new Error("Le graphe n'est pas un tableau"))
        }
      } catch (error) {
        page.addError(error)
      }
    })
  }

  try {
    log('j3p.display avec ressource et options', ressource, options)
    // les params minimaux
    if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.g) {
      throw new Error('Ressource incomplète')
    }
    if (!options.container || !options.errorsContainer) throw new Error('Paramètres manquants')

    // le domaine où prendre les js j3p
    if (options.isDev) {
      urlBaseJ3p = 'http://j3p.devsesamath.net'
    }

    var lastResultUrl = tools.getURLParameter('lastResultUrl')
    if (lastResultUrl) {
      log('on va chercher un lastResultat sur ' + lastResultUrl)
      xhr.get(lastResultUrl, {responseType: 'json'}, function (error, lastResultat) {
        if (error) {
          page.addError('Impossible de récupérer le dernier résultat')
          log.error(error)
        } else if (lastResultat) {
          if (lastResultat.success) {
            if (lastResultat.resultat) options.lastResultat = lastResultat.resultat
          } else {
            log.error("l'appel de lastResultat a échoué", lastResultat)
          }
        }
        load()
      })
    } else {
      load()
    }
  } catch (error) {
    page.addError(error)
  }
}
