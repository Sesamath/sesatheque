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
 * @file Affiche un arbre avec jstree
 */
try {
  define(['../../vendors/sesamath/tools/jstreeConverter.js', 'jquery1', 'jstree'], function (jstreeConverter) {
    "use strict";
    if (typeof $ === 'undefined') throw new Error('Problème de chargement jQuery');
    /* jshint jquery:true */

    /** Notre module */
    var arbre = {};
    var w = window;

    /**
     * Affiche l'arbre
     * @param {Object}   ressource  L'arbre dans son format "ressource"
     * @param {Object}   options    Les options (baseUrl, vendorsBaseUrl, container, errorsContainer,
     *                              et éventuellement resultCallback)
     * @param {Function} next       La fct à appeler quand la ressource sera chargée (sans argument ou avec une erreur)
     */
    arbre.display = function (ressource, options, next) {
      var error;
      try {
        log('arbre.display avec', ressource);
        var container = options.container;
        if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");
        var errorsContainer = options.errorsContainer;
        if (!errorsContainer) throw new Error("Il faut passer dans les options un conteneur html pour les erreurs");
        // Ajout css, si on a pas tant pis pour le css mais ça va être moche
        if (options.vendorsBaseUrl) w.addCss(options.vendorsBaseUrl + '/jstree/dist/themes/default/style.min.css');

        // le message en attendant le chargement
        var searchContainer = w.getElement("div", {class: 'search'});
        var searchId = w.getNewId();
        searchContainer.appendChild(w.getElement('span', null, 'Mettre en valeur les titres contenant '));
        searchContainer.appendChild(w.getElement('input', {id: searchId}));
        container.appendChild(searchContainer);
        var treeId = w.getNewId();
        w.addElement(container, "div", {id: treeId});
        // l'élément root, pas encore un array
        var rootElt = jstreeConverter.toJstree(ressource);
        rootElt.state = {opened: true};
        rootElt.animation = 1;

        var jstData = {
          'core': {
            'data': function (node, next) {
               //log('fct data', node);
               if(node.id == '#') {
                 next(rootElt);
               } else {
                 // faut faire l'appel ajax nous même car jstree peut pas mixer json initial + ajax ensuite
                 // @see http://git.net/jstree/msg12107.html
                 $.ajax({
                   url : node.data.url,
                   timeout : options.timeout || 10000,
                   dataType : 'json',
                   xhrFields: {
                     withCredentials: true
                   }
                 }).success(next).error(function (jqXHR, textStatus, error) {
                   next(["Erreur lors de l'appel ajax pour récupérer les éléments"]);
                   log(error);
                 });
               }
            }
          },
          plugins : ["search"]
        };

        var jqTree = $('#' + treeId);
        jqTree.jstree(jstData);

        // pour la recherche, on écoute la modif de l'input
        var timer;
        var jqSearch = $("#" + searchId);
        jqSearch.keyup(function () {
          // on est appelé à chaque fois qu'une touche est relachée dans cette zone de saisie
          // on lancera la recherche dans 1/4s si y'a pas eu d'autre touche
          if (timer) { clearTimeout(timer); }
          timer = setTimeout(function () {
            var v = jqSearch.val();
            jqTree.jstree(true).search(v);
          }, 250);
        });

        /**
         * Ajout de liens vers un autre onglet
         */

      } catch(e) {
        error = e;
      }

      next(error);
    };

    return arbre;
  });
} catch (error) {
  if (typeof window.setError !== 'undefined') window.setError(error.toString());
  if (typeof console !== 'undefined' && console.error) console.error(error);
}

