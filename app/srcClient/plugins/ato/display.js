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

var page = require('../../page/index')
var log = require('../../tools/log')

var isLoaded

/**
 * Affiche une ressource ato
 * @service plugins/ato/display
 * @param {Ressource}      ressource  L'objet ressource
 * @param {displayOptions} options    Les options après init
 * @param {errorCallback}  next       La fct à appeler quand l'atome sera chargé (sans argument ou avec une erreur)
 */
module.exports = function display (ressource, options, next) {
  function loaded () {
    isLoaded = true
    if (next) next()
  }

  try {
    var container = options.container
    if (!container) throw new Error('Il faut passer dans les options un conteneur html pour afficher cette ressource')

    // on enverra un résultat seulement à la fermeture
    if (options.resultatCallback && container.addEventListener) {
      container.addEventListener('unload', function () {
        if (isLoaded) {
          options.resultatCallback({
            ressType: 'ato',
            ressOid: ressource.oid,
            score: 1
          })
        }
      })
    }

    log('start ato display avec la ressource', ressource)
    // les params minimaux
    if (!ressource.oid || !ressource.titre) {
      throw new Error('Paramètres manquants')
    }

    // On réinitialise le conteneur
    dom.empty(container)

    var url = 'http://mep-outils.sesamath.net/manuel_numerique/diapo.php?env=ressource&atome=' + ressource.idOrigine
    var iframe = dom.addElement(container, 'iframe', {src: url, style: 'width:100%;height:100%'})
    if (iframe.addEventListener) iframe.addEventListener('load', loaded)
    else loaded()
  } catch (error) {
    if (next) next(error)
    else page.addError(error)
  }
}
