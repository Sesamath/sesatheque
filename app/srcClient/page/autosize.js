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

// const log = require('sesajstools/utils/log')

module.exports = function autosize (targetId, hBlocIds, wBlocIds, options) {
  require.ensure(['jquery'], function (require) {
    function getTotalHeight ($blocs) {
      return $blocs.reduce((height, $bloc) => {
        const h = $bloc.outerHeight(true)
        if (h > 0) return height + h
        return height
      }, 0)
    }

    function getTotalWidth ($blocs) {
      return $blocs.reduce((width, $bloc) => {
        const w = Number($bloc.outerWidth(true))
        if (w > 0) width += w
        return width
      }, 0)
    }

    /**
     * Modifie la taille de l'élément pour lui donner tout l'espace restant de container
     * @private
     * @param {function} cb Callback éventuelle
     */
    function resize () {
      var occupe = offsetHeight
      // log(`innerHeight : ${window.innerHeight} et occupé ${occupe}`)
      var tailleDispo
      // hauteur
      if ($blocsH) {
        occupe += getTotalHeight($blocsH)
      }
      tailleDispo = Math.max(Math.floor(window.innerHeight - occupe), minHeight)
      if ($bigHeightBlocs && tailleDispo > 2 * minHeight) {
        // on retire aussi les blocs de bigHeightBlocs
        occupe = getTotalHeight($bigHeightBlocs)
        // log(`on a une grande hauteur ${tailleDispo} > 2 × ${minHeight}, on retire aussi ${options.bigHeightBlocs.join(', ')} => ${occupe}`)
        if (occupe < minHeight) tailleDispo -= occupe
      }
      // log(`resize height de ${targetId} à ${tailleDispo}`)
      $target.height(tailleDispo)

      // largeur
      occupe = offsetWidth
      if ($blocsW) {
        occupe += getTotalWidth($blocsW)
      }
      tailleDispo = Math.max(Math.floor(window.innerWidth - occupe), minWidth)
      if ($bigWidthBlocs && tailleDispo > 2 * minWidth) {
        occupe = getTotalWidth($bigWidthBlocs)
        if (occupe < minWidth) tailleDispo -= occupe
      }
      // log(`resize width de ${targetId} à ${tailleDispo}`)
      $target.width(tailleDispo)
      if (options.callback) options.callback()
    }

    function jquerize (ids) {
      const $blocs = []
      ids.forEach(id => {
        const $bloc = $('#' + id)
        if ($bloc && $bloc.length) $blocs.push($bloc)
      })
      return $blocs
    }

    const $ = require('jquery')
    if (!options) options = {}
    var $blocsH
    var $bigHeightBlocs
    var $blocsW
    var $bigWidthBlocs
    var $target
    var offsetHeight = options.offsetHeight || 50
    var offsetWidth = options.offsetWidth || 50
    var minHeight = options.minHeight || 400
    var minWidth = options.minWidth || 400

    $target = $('#' + targetId)
    if (hBlocIds && hBlocIds.length) {
      $blocsH = jquerize(hBlocIds)
      // log(`pour ${targetId} on a reçu les ids de block ${hBlocIds.join(', ')}`)
    }
    if (options.bigHeightBlocs) {
      $bigHeightBlocs = jquerize(options.bigHeightBlocs)
    }
    if (wBlocIds && wBlocIds.length) {
      $blocsW = jquerize(wBlocIds)
    }
    if (options.bigWidthBlocs) {
      $bigWidthBlocs = jquerize(options.bigWidthBlocs)
    }
    resize()
    // et à chaque changement de la taille de la fenêtre
    $(window).resize(resize)
  })
}
