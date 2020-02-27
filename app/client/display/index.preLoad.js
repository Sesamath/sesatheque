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

/* Charge le display en version es5 ou module suivant le navigateur
 * ATTENTION, ce fichier doit rester en es5, car il ne passe pas par babel ni webpack
 * (même s'il est minifié par terser et copié par webpack.preRun.js à chaque compil webpack)
 */
/* eslint-env browser */

/**
 * Un "preLoader" qui chargera display en version es5 ou module es6 suivant les capacités du navigateur,
 * puis l'appellera quand il sera chargé
 * @param {Ressource}     ressource La ressource à afficher
 * @param {initOptions}   [options] Les options éventuelles (passer base si ce js est chargé sur un autre domaine)
 * @param {errorCallback} [next]    Fct appelée à la fin du chargement avec une erreur ou undefined
 */
window.stdisplay = function displayPreLoad (ressource, options, next) {
  'use strict'
  // on ne veut pas faire de require / import pour récupérer la version, qui par ailleurs n'est pas forcément incrémentée à chaque build
  // (idiot d'ajouter tout le bootstrap wepack pour ça alors que ce fichier ne fait que qq octets)
  // c'est un bout de code dans webpack.preRun.js qui viendra modifier cette ligne
  var timestamp = '' // ne pas modifier cette ligne, le timestamp sera mis à la copie dans build/, cf webpack.preRun.js
  var baseUrl = '' // ne pas modifier cette ligne
  var script = document.createElement('script')
  script.crossOrigin = 'anonymous'
  var src = baseUrl + 'display.'
  if ('noModule' in document.createElement('script')) {
    // le navigateur gère les modules es6, pas sûr qu'il gère les imports dynamiques mais on en a pas
    // cf https://gist.github.com/ebidel/3201b36f59f26525eb606663f7b487d0
    // et https://stackoverflow.com/questions/60317251/how-to-feature-detect-whether-a-browser-supports-dynamic-es6-module-loading
    script.type = 'module'
    src += 'module'
  } else {
    script.type = 'application/javascript'
    src += 'es5'
  }
  src += '.js?' + timestamp

  // apparemment c'est mieux de faire dans cet ordre pour une meilleure compatibilité avec tous les navigateurs
  document.body.appendChild(script)
  script.addEventListener('load', function onLoadIepLoadReal () {
    // la fct globale stdisplay est maintenant le vrai loader, mais on vérifie quand même
    if (window.stdisplay.preloader) return next(Error('Le chargement tourne en boucle, impossible de continuer'))
    window.stdisplay(ressource, options, next)
  })
  script.src = src
}
// pour marquer notre préloader et vérifier qu'il a bien été écrasé par le display original
window.stdisplay.preloader = true
