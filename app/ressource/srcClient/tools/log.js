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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

/**
 * Un console.log qui plante pas sur les anciens IE (ou d'autres navigateurs qui n'auraient pas de console.log)
 * Sera mis en global par init si on est en dev (sinon la fonction existera mais ne fera rien)
 *
 * Déclaré par init (dès son chargement) avec une fonction vide
 * puis remplacé par celle qui bosse si init() est appelé avec options.verbose
 * @param {...*} arguments Nombre variable d'arguments, chacun sera passé à console.log ou console.error si c'est une erreur
 */
function log () {
  if (isLogEnable) {
    var arg
    try {
      for (var i = 0; i < arguments.length; i++) {
        arg = arguments[i]
        if (arg instanceof Error) console.error(arg)
        else console.log(arg)
      }
    } catch (e) {
      // rien, fallait un navigateur décent...
    }
  }
}

/**
 * Flag pour savoir si log() est bavard ou muet
 * @type {boolean}
 */
var isLogEnable = false

/**
 * Rend S.log() muet
 */
log.disable = function () {
  isLogEnable = false
}

/**
 * Rend S.log() bavard
 */
log.enable = function () {
  isLogEnable = true
}

/**
 * log une erreur avec console.error si ça existe, en prod comme en dev (utiliser log(error) pour afficher en dev seulement)
 * @param {...Error} arguments autant qu'on veut (console.error appelée une fois par argument)
 */
log.error = function () {
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    for (var i = 0; i < arguments.length; i++) {
      console.error(arguments[i])
    }
  }
}

module.exports = log
