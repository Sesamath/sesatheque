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
 * @file Édite un arbre (avec jstree, src et dst), appelé depuis la vue editArbre depuis l'url /ressource/modifier/xxx
 */
try {
  define(['jstreeConverter', '/apiClient.js', 'jquery1', 'jstree'], function (jstreeConverter, apiClient) {
    /* jshint jquery:true */
    "use strict";

    // nos fcts internes
    function initDom(options) {
      function showTxt() {
        $linkShowTxt.hide();
        $container.hide();
        $textarea.show();
        $linkShowGraphic.show();
      }

      function showGraphic() {
        $linkShowGraphic.hide();
        $textarea.hide();
        $container.show();
        $linkShowTxt.show();
      }

      // Ajout css, si on a pas tant pis pour le css mais ça va être moche
      if (options.vendorsBaseUrl) w.addCss(options.vendorsBaseUrl + '/jstree/dist/themes/default/style.min.css');
      // nos éléments html
      var blocTexte = window.document.getElementById('groupEnfants'); // le textarea et son titre
      var $textarea = $('#enfants');
      container = window.document.getElementById('display');
      $container = $(container);

      // ancre
      w.addElement(blocTexte, 'a', {name:"enfants"});
      // lien et comportement pour repasser en graphique
      var linkShowGraphic = w.addElement(blocTexte, 'a', {href:'#enfants'}, 'passer en mode graphique');
      var $linkShowGraphic = $(linkShowGraphic);
      $linkShowGraphic.click(showGraphic);

      // lien et comportement pour passer en mode texte
      var linkShowTxt = w.addElement(blocTexte, 'a', {href:'#enfants'}, "passer en mode texte");
      var $linkShowTxt = $(linkShowTxt);
      $linkShowTxt.click(showTxt);

      w.addElement(container, 'span', null, "arbre source à charger ");
      inputRef = w.addElement(container, 'input', {id:"loadRef", type:'text'});
      $inputRef = $(inputRef);
      // enter doit pas valider le form mais charger la ref
      $inputRef.keypress(function (event) {
        if (event.keyCode === 13) {
          loadSrc();
          return false; // pour empêcher le submit
        }
      });
      // lien de chargement
      loadLink = w.addElement(container, 'a', {href:'#'}, ' afficher');
      $loadLink = $(loadLink);
      // la recherche
      var searchContainer = w.addElement(container, "div", {class: 'search'});
      w.addElement(searchContainer, 'span', null, 'Mettre en valeur les titres contenant ');
      searchInput = w.addElement(searchContainer, 'input', {type: 'text'});

      srcGroup = w.addElement(container, 'div', {id:"srcGroup"});
      w.addElement(srcGroup, 'span', null, "arbre source");
      srcTree = w.addElement(srcGroup, 'div');

      var dstGroup = w.addElement(container, 'div', {id:"dstGroup"});
      w.addElement(dstGroup, 'strong', null, "arbre à modifier");
      w.addElement(dstGroup, 'em', {style:{"font-size":"0.8em"}}, " (pour enlever des éléments les glisser n'importe où dans l'arbre de gauche)");
      dstTree = w.addElement(dstGroup, 'div');

      showGraphic();
    }

    function loadSrc() {
      var ref = $inputRef.val();
      if (ref) {
        apiClient.getRessource(ref, function (error, ressource) {
          if (error) {
            w.setError("Erreur au chargement de " + ref + " : " + error.toString(), 5);
          } else if (ressource && ressource.typeTechnique === 'arbre') {

            // on charge
            load($srcTree, ressource, true);

            // pour la recherche, on remet le comportement sur la modif de l'input
            var timer;
            var $searchInput = $(searchInput);
            $searchInput.keyup(function () {
              // on est appelé à chaque fois qu'une touche est relachée dans cette zone de saisie
              // on lancera la recherche dans 1/4s si y'a pas eu d'autre touche
              if (timer) { clearTimeout(timer); }
              timer = setTimeout(function () {
                var v = $searchInput.val();
                $srcTree.jstree(true).search(v);
              }, 250);
            });
          } else {
            w.setError("La ressource " +ref +" n'existe pas ou n'est pas un arbre", 5);
            log("Ressource chargée qui n'est pas un arbre", ressource);
          }
        });
      } else {
        log("appel de load sans ref");
      }
      return false; // sinon il submit le form !
    } // loadSrc

    function load($tree, arbre, isSrc) {
      var rootElt = jstreeConverter.toJstree(arbre);
      rootElt.state = {opened: true};

      var jstData = {
        'core' : {
          check_callback : true,
          'data': function (node, next) {
            //log('fct data', node);
            if (node.id == '#') {
              next(rootElt);
            } else {
              // faut faire l'appel ajax nous même car jstree peut pas mixer json initial + ajax ensuite
              // @see http://git.net/jstree/msg12107.html
              $.ajax({
                url      : node.data.url,
                timeout  : timeout || 10000,
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
        plugins: ["dnd"]
      };
      if (isSrc) {
        jstData.plugins.push('search');
        jstData.dnd = {always_copy:true};
      }

      $tree.jstree(jstData);

      // pour ouvrir / fermer, on peut pas écouter les clic sur a.jstree-anchor ni li.jstree-node car jstree les intercepte
      // on écoute donc l'événement select sur le jstree
      $tree.on('select_node.jstree', function (e, data) {
        var jstNode = data.node.original;
        log("clic sur", jstNode);
        if (jstNode && jstNode.a_attr && jstNode.a_attr['data-typeTechnique'] === 'arbre') {
          // on fait du toggle
          if ($tree.jstree('is_open', data.node)) $tree.jstree('close_node', data.node);
          else $tree.jstree('open_node', data.node);
        }
      });
    } // load

    function loadDst(arbre) {
      load($dstTree, arbre);
    }

    /**
     * Récupère l'arbre jstree et complète le champ enfants avec
     */
    function saveDst() {
      var jstree = $.jstree.reference($dstTree);
      var enfants;
      var retour = false; // passer true pour valider le form
      log("saveDst avec", jstree);
      try {
        // on veut pas les enfants de # (un seul, l'arbre complet), mais ceux de notre arbre, 1er (et seul) enfant de root
        var nodeId = jstree._model.data['#'].children[0];
        enfants = jstreeConverter.getEnfants(nodeId, jstree);
      } catch(error) {
        log.error(error);
      }
      log("On récupère les enfants", enfants);
      var $enfants = $('#enfants');
      var enfantsStr = '';
      try {
        enfantsStr = JSON.stringify(enfants, null, 2);
      } catch(error) {
        log.error("Le parsing json a planté", error, enfants);
      }
      if ($enfants) {
        $enfants.val(enfantsStr);
        retour = true;
      }

      return retour;
    }

    if (typeof $ === 'undefined') throw new Error('Problème de chargement jQuery');
    if (typeof jstreeConverter === 'undefined') throw new Error('Problème de chargement des dépendances');
    if (typeof display === 'undefined') throw new Error('Problème de chargement des dépendances');

    var w = window;
    // les containers (variables locales au module), qui seront affectés par initDom()
    var container, srcGroup, inputRef, loadLink, searchInput, srcTree, dstTree;
    // quasi les mêmes jquerifiée
    var $container, $inputRef, $loadLink, $srcTree, $dstTree, $saveButton, $enfants;
    var timeout;

    return {
      init: function (arbre, options) {
        timeout = options.timeout;
        initDom(options);
        // on ajoute simplement un lien pour passer à la version graphique
        jstreeConverter.setBaseUrl(options.sesathequeBase);
        log("edit de l'arbre", arbre);
        $loadLink.click(loadSrc);
        // nos arbres jstree
        $srcTree = $(srcTree);
        $dstTree = $(dstTree);
        $saveButton = $('#saveButton');
        if (!$saveButton) throw new Error("Bouton de sauvegarde non trouvé dans la page");
        $enfants = $('#enfants');
        if (!$enfants) throw new Error("Champ de sauvegarde des enfants non trouvé dans le formulaire");
        $saveButton.click(saveDst);

        // on charge l'arbre à éditer
        loadDst(arbre);

      }
    };
  });
} catch (error) {
  if (typeof window.setError !== 'undefined') window.setError(error);
  if (typeof console !== 'undefined' && console.error) console.error(error);
}

