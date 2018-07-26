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

var log = require('sesajstools/utils/log')
var sjtUrl = require('sesajstools/http/url')

var page = require('../../../client/page/index')
var xhr = require('sesajstools/http/xhr')

var urlBaseJ3p = '//j3p.sesamath.net'

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
          // faut un wrapper pour compiler un score pour le graphe
          // ce serait mieux dans j3p…
          j3pOptions.resultatCallback = function (resultat) {
            if (resultat.fin && resultat.score === undefined) {
              // faudrait un score (en cas de condition sur le minimum de réussite),
              // on regarde si on peut le calculer
              if (resultat.contenu && resultat.contenu.scores && resultat.contenu.scores.length) {
                const nb = resultat.contenu.scores.length
                const reducer = (total, score) => {
                  const localScore = Number(score)
                  if (localScore > 1) page.addError('Un score d’un nœud est invalide (> 1)')
                  else if (localScore > 0) total += localScore
                  else if (localScore !== 0) page.addError('Un score d’un nœud est invalide (pas un nombre)')
                  return total
                }
                const total = resultat.contenu.scores.reduce(reducer, 0)
                resultat.score = total / nb
              } else {
                console.error('j3p renvoie un résultat avec fin mais sans score', resultat)
              }
            }
            options.resultatCallback(resultat)
          }
        }
        if (options.lastResultat) {
          j3pOptions.lastResultat = options.lastResultat
        }
        log('loader j3p avec le graphe', ressource.parametres.g)
        if (Array.isArray(ressource.parametres.g)) {
          j3pOptions.loadCallback = next
          loader.charge(options.container, ressource, j3pOptions)
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
      urlBaseJ3p = '//j3p.devsesamath.net'
    }

    var lastResultUrl = sjtUrl.getParameter('lastResultUrl')
    if (lastResultUrl) {
      // log('on va chercher un lastResultat sur ' + lastResultUrl)
      xhr.get(lastResultUrl, {responseType: 'json'}, function (error, data) {
        if (error) {
          log.error(error)
          page.addError('Impossible de récupérer le dernier résultat')
        } else if (data) {
          if (data.success) {
            if (data.resultat) options.lastResultat = data.resultat
          } else {
            log.error("l'appel de lastResultat a échoué", data)
          }
        }
        // mais quoi qu'il arrive on charge
        load()
      })
    } else {
      load()
    }
  } catch (error) {
    page.addError(error)
  }
}
