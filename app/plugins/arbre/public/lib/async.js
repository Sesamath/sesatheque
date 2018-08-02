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
 * Ce fichier fait partie de lapplication Sésathèque, créée par lassociation Sésamath.
 *
 * Sésathèque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sésathèque est distribué dans lespoir quil sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou dADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */
'use strict'
/**
 * Pour utiliser le chargement de jquery & jstree à la demande avec du jsonP,
 * compiler ce fichier par webpack depuis une appli quelconque (qui mettra son publicPath)
 * Cf README
 */

// on importe
const jstree = require('./jstree')
// on remplace build par sa version async
const build = jstree.build
jstree.build = function asyncBuild (elt, arbre, options) {
  require.ensure([], function (require) {
    // on laisse l'appli appelante charger son jquery si elle a une version de prédilection
    if (typeof window.jQuery === 'undefined') require('jquery')
    // et son jstree (qui devra être compatible avec notre code…)
    if (!window.jQuery.jstree) require('jstree')
    // juste pour déclencher la compilation de nos css, qui seront mergées avec celles de l'appli
    require('./jstree.css')
    require('jstree/dist/themes/default/style.css')
    build(elt, arbre, options)
  })
}

// en exporte la version modifiée
module.exports = jstree
