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

try {
  define(['tools/jstreeConverter', 'jquery', 'jstree'], function (jstreeConverter) {
    "use strict";
    if (typeof $ === 'undefined') throw new Error('Problème de chargement jQuery');
    /* jshint jquery:true */

    /**
     * Module pour afficher un arbre
     * @plugin arbre
     */
    var arbre = {};

    // raccourcis, si ça plante le catch gère
    var S = window.sesamath;
    var ST = S.sesatheque;

    /**
     * Affiche l'arbre, avec les boutons pour déplier les branches et afficher l'aperçu des feuilles
     * @memberOf arbre
     * @param {Ressource}      ressource  L'objet ressource
     * @param {displayOptions} options    Les options après init
     * @param {errorCallback}  next       La fct à appeler quand l'arbre sera chargé (sans argument ou avec une erreur)
     */
    arbre.display = function (ressource, options, next) {
      var error;
      try {
        S.log('arbre.display avec', ressource);
        var container = options.container;
        if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");
        var errorsContainer = options.errorsContainer;
        if (!errorsContainer) throw new Error("Il faut passer dans les options un conteneur html pour les erreurs");

        S.addCss(options.sesathequeBase + 'vendors/jstree/dist/themes/default/style.min.css');
        var baseUrl = options.sesathequeBase + 'plugins/arbre';

        // un div d'aperçu
        //var apercuElt = S.getElement('iframe', {id: S.getNewId(), width:'50%',height:'400px', style : 'float:right;resize:both;overflow:scroll;'});
        //var apercuElt = S.getElement('div', {id: S.getNewId(), style : 'float:right;width:50%;height:400px;resize:both;border:none;'});
        //S.addElement(apercuElt, 'iframe', {style : 'width:100%;height:100%;border:none;'});
        var apercuContainer = S.addElement(container, 'div', {
          style: {
            position: 'absolute',
            "background-color": "#fff"
          }
        });
        // en global car on s'en sert souvent, pas la peine de le recalculer dans chaque fct
        var $apercuContainer = $(apercuContainer);
        // un flag pour savoir si on est en mode aperçu (true, false ou null)
        var isApercu = null;
        // l'iframe sera créée au chargement
        var iframeApercu;
        // quand on charge des swf, on a des erreurs
        // Error: Permission denied to access property "toString"
        // que l'on peut ignorer (cf http://stackoverflow.com/a/13101119)

        /**
         * Ajoute les boutons
         * @private
         */
        var initApercu = function () {
          S.log('init aperçu');
          if (isApercu === null) {
            S.empty(apercuContainer);
            // en relative
            var boutons = S.addElement(apercuContainer, 'div', {
              style: {
                position: 'absolute',
                "z-index": 2,
                float: "right",
                "right": 0
              }
            });
            var apercuFermer = S.addElement(boutons, 'img', {
              src: baseUrl + '/images/fermer.png',
              alt: "fermer l'aperçu",
              style: {float: 'right'}
            });
            var apercuAgrandir = S.addElement(boutons, 'img', {
              src: baseUrl + '/images/agrandir.png',
              alt: "agrandir l'aperçu",
              style: {float: 'right'}
            });
            var apercuReduire = S.addElement(boutons, 'img', {
              src: baseUrl + '/images/reduire.png',
              alt: "réduire l'aperçu",
              style: {float: 'right'}
            });
            $(apercuFermer).click(fermer);
            $(apercuAgrandir).click(agrandir);
            $(apercuReduire).click(reduire);
            // on veut pas de transparent
            $apercuContainer.css('background-color', '#fff');
            $apercuContainer.show();
            // on ajoute l'iframe dedans
            iframeApercu = S.addElement(apercuContainer, 'iframe', {
              style: {
                position: 'absolute',
                "z-index": 1,
                width: '100%',
                height: '100%'
              }
            });
            isApercu = false;
          } else {
            S.log.error('div apercu déjà initialisé');
          }
        };

        var fermer = function fermer() {
          S.log("on ferme");
          // on vide
          $apercuContainer.empty();
          iframeApercu = null;
          // on cache
          $apercuContainer.hide();
          isApercu = null;
        };

        var agrandir = function () {
          S.log("grand");
          if (isApercu === false) {
            $apercuContainer.css('top', '5%');
            $apercuContainer.css('left', '5%');
            $apercuContainer.height('90%');
            $apercuContainer.width('90%');
            isApercu = true;
          }
        };

        var reduire = function () {
          S.log("petit");
          if (isApercu) {
            $apercuContainer.height('30%');
            $apercuContainer.width('30%');
            $apercuContainer.css('top', '70%');
            $apercuContainer.css('left', '70%');
            isApercu = false;
          }
        };

        // on crée un div pour le tree et ses compagnons
        var caseTree = S.addElement(container, 'div');
        // la recherche
        var searchContainer = S.addElement(caseTree, "div", {class: 'search'});
        S.addElement(searchContainer, 'span', null, 'Mettre en valeur les titres contenant ');
        var searchInput = S.addElement(searchContainer, 'input', {type: 'text'});


        // l'arbre
        var treeId = S.getNewId();
        S.addElement(caseTree, "div", {id: treeId});
        // l'élément root, pas encore un array
        var rootElt = jstreeConverter.toJstree(ressource);
        rootElt.state = {opened: true};

        var jstData = {
          'core': {
            'data': function (node, next) {
              //S.log('fct data', node);
              if (node.id == '#') {
                next(rootElt);
              } else {
                // faut faire l'appel ajax nous même car jstree peut pas mixer json initial + ajax ensuite
                // @see http://git.net/jstree/msg12107.html
                $.ajax({
                  url: node.data.url,
                  timeout: options.timeout || 10000,
                  dataType: 'json',
                  xhrFields: {
                    withCredentials: true
                  }
                }).success(next).error(function (jqXHR, textStatus, error) {
                  next(["Erreur lors de l'appel ajax pour récupérer les éléments"]);
                  ST.addError(error);
                });
              }
            }
          },
          plugins: ["search"]
        };

        var $tree = $('#' + treeId);
        S.log('$tree', $tree);
        $tree.jstree(jstData);

        /* Pour récupérer un élément sous sa forme jstree, c'est (id est l'id jstree, sans #)
         * var jstNode = $.jstree.reference($tree).get_node(id);
         * et les data que l'on a mise sont dans
         * jstNode.original, par ex jstNode.original.a_attr['data-typeTechnique'];
         */

        // pour la recherche, on écoute la modif de l'input
        var timer;
        var $searchInput = $(searchInput);
        $searchInput.keyup(function () {
          // on est appelé à chaque fois qu'une touche est relachée dans cette zone de saisie
          // on lancera la recherche dans 1/4s si y'a pas eu d'autre touche
          if (timer) {
            clearTimeout(timer);
          }
          timer = setTimeout(function () {
            var v = $searchInput.val();
            $tree.jstree(true).search(v);
          }, 250);
        });

        // pour l'aperçu, on peut pas écouter les clic sur a.jstree-anchor ni li.jstree-node car jstree les intercepte
        // on écoute donc l'événement select sur le jstree
        $tree.on('select_node.jstree', function (e, data) {
          var jstNode = data.node.original;
          S.log("on veut l'aperçu du node", jstNode);
          if (jstNode && jstNode.a_attr) {
            if (jstNode.a_attr['data-typeTechnique'] === 'arbre') {
              // on fait du toggle
              if ($tree.jstree('is_open', data.node)) $tree.jstree('close_node', data.node);
              else $tree.jstree('open_node', data.node);
            } else {
              if (isApercu === null) initApercu();
              // on resize avant chargement
              agrandir();
              // et on lui file une url à charger
              S.log("on va charger " + jstNode.a_attr.href);
              iframeApercu.src = jstNode.a_attr.href;
            }
          }
          /*
           var href = data.rslt.obj.children("a").attr("href");
           // this will load content into a div:
           $("#contents").load(href);
           // this will follow the link:
           document.location.href = href; */
        });

      } catch (e) {
        error = e;
      }

      next(error);
    };

    return arbre;
  });
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module");
    console.error(error);
  }
}
