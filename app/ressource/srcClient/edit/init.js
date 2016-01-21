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

/**
 * Script pour le form d'édition de ressource
 * (page.init et ajouter des comportements de modif dynamique du form)
 */
"use strict"

var page = require('../page')

var $ = window.jQuery /* jshint jquery:true */

/**
 * Ajoute des comportement aux éléments du formulaire d'édition de ressource
 * (change parametres|enfants en fonction du type)
 * @service edit/init
 * @param options
 * @param next
 */
module.exports = function (options, next) {
  page.init(options)
  /**
   * Modifie le nom paramètres|enfants suivant le type (arbre ou pas)
   */
  function onTypeChange() {
    var $label = $groupParametres.filter('label')
    var $textarea = $groupParametres.filter('textarea')
    var type = $type.val()
    if (type === 'arbre') {
      $label.text('Enfants')
      $textarea.attr('placeholder', 'Enfants')
    } else {
      $label.text('Paramètres')
    }
  }

  // comportement sur le titre de parametres suivant le choix de type
  var $type = $('#type')
  var $groupParametres = $('#groupParametres')
  if ($type && $groupParametres) {
    $type.change(onTypeChange)
    onTypeChange()
  }

  next()
}
