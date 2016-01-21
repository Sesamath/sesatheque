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

"use strict"

//var dom = require('../../tools/dom')
var log = require('../../tools/log')
var $ = window.jQuery /* jshint jquery:true */

var $blocsH, $blocsW, $target
var offsetHeight = 0,
    offsetWidth = 0,
    minHeight = 400,
    minWidth = 400

/**
 * Modifie la taille de l'iframe pour lui donner tout l'espace restant de container
 */
function resize() {
  var occupe = offsetHeight, tailleDispo
  // hauteur
  if ($blocsH) $blocsH.forEach(function ($bloc) { occupe += $bloc.outerHeight(true) })
  tailleDispo = Math.floor(window.innerHeight - occupe)
  if (tailleDispo < minHeight) tailleDispo = minHeight
  log('resize height à ' + tailleDispo)
  $target.css("height", tailleDispo + 'px')

  // largeur
  occupe = offsetWidth
  if ($blocsW) $blocsW.forEach(function ($bloc) { occupe += $bloc.outerWidth(true) })
  tailleDispo = Math.floor(window.innerWidth - occupe)
  if (tailleDispo < minWidth) tailleDispo = minWidth
  log('resize width à ' + tailleDispo)
  $target.css("width", tailleDispo + 'px')
}

/**
 * Affecte un comportement de redimensionnement automatique à un élément
 * @service display/autosize
 * @param {string}   targetId L'id html du bloc que l'on veut maximiser automatiquement
 * @param {string[]} hBlocIds Liste des ids de bloc dont il faut déduire la hauteur
 * @param {string[]} wBlocIds Liste des ids de bloc dont il faut déduire la largeur
 */
module.exports = function autosize(targetId, hBlocIds, wBlocIds, options) {
  // on initialise dès que jQuery est prêt
  $(function () {
    $target = $("#" +targetId)
    if (hBlocIds && hBlocIds.length) {
      $blocsH = []
      hBlocIds.forEach(function (id) {
        var $bloc = $("#" +id)
        if ($bloc) $blocsH.push($bloc)
      })
    }
    if (wBlocIds && wBlocIds.length) {
      $blocsW = []
      wBlocIds.forEach(function (id) {
        var $bloc = $("#" +id)
        if ($bloc) $blocsW.push($bloc)
      })
    }
    if (options && options.minHeight) minHeight = options.minHeight
    if (options && options.minWidth) minWidth = options.minWidth
    if (options && options.offsetHeight) offsetHeight = options.offsetHeight
    if (options && options.offsetWidth) offsetWidth = options.offsetWidth
    resize()
    // et à chaque changement de la taille de la fenêtre
    $(window).resize(resize)
  })
}
