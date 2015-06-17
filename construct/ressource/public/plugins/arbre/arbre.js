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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

/**
 * @file Affiche un arbre
 */
/* global define, window, $ */

try {
  define(['jquery1', 'jstree', 'Arbre'], function (jq, jstree, Arbre) {
    "use strict";
    /** Notre module */
    var moduleArbre = {};
    var w = window;

    /**
     * Affiche l'arbre
     * @param {Object}   ressource  L'arbre dans son format "ressource"
     * @param {Object}   options    Les options (baseUrl, vendorsBaseUrl, container, errorsContainer,
     *                              et éventuellement resultCallback)
     * @param {Function} next       La fct à appeler quand la ressource sera chargée (sans argument ou avec une erreur)
     */
    moduleArbre.display = function (ressource, options, next) {
      var container = options.container;
      if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");
      var errorsContainer = options.errorsContainer;
      if (!errorsContainer) throw new Error("Il faut passer dans les options un conteneur html pour les erreurs");
      // Ajout css
      if (options.baseUrl) w.addCss(options.baseUrl + 'jstree/themes/default/style.min.css'); // si on a pas tant pis pour le css

      // le message en attendant le chargement
      w.addElement(container, "div", {id: 'jstree'}, "Chargement de l'arbre " + ressource.oid + " en cours.");

      var ressArbre = new Arbre(ressource)
      var jstData = ressArbre.toJstree()
      if (typeof $ === 'undefined') throw new Error('Problème de chargement jQuery');
      $('#jstree').jstree(jstData);

    };

    return moduleArbre;
  });
} catch (error) {
  if (typeof window.setError !== 'undefined') window.setError(error.toString())
  if (typeof console !== 'undefined' && console.error) console.error(error)
}

