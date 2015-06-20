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

        // un div d'aperçu
        //var apercuElt = w.getElement('iframe', {id: w.getNewId(), width:'50%',height:'400px', style : 'float:right;resize:both;overflow:scroll;'});
        //var apercuElt = w.getElement('div', {id: w.getNewId(), style : 'float:right;width:50%;height:400px;resize:both;border:none;'});
        //w.addElement(apercuElt, 'iframe', {style : 'width:100%;height:100%;border:none;'});
        var apercuContainer = w.addElement(container, 'div', {style : {position:'absolute',"background-color":"#fff"}});
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
         */
        var initApercu = function () {
          log('init aperçu');
          if (isApercu === null) {
            apercuContainer.innerHTML = '';
            // en relative
            var boutons = w.addElement(apercuContainer, 'div', {style:{position:'absolute',"z-index":2,float:"right","right":0}});
            var apercuFermer = w.addElement(boutons, 'img', {src:options.baseUrl +'/images/fermer.png', alt:"fermer l'aperçu", style:{float:'right'}});
            var apercuAgrandir = w.addElement(boutons, 'img', {src:options.baseUrl +'/images/agrandir.png', alt:"agrandir l'aperçu", style:{float:'right'}});
            var apercuReduire = w.addElement(boutons, 'img', {src:options.baseUrl +'/images/reduire.png', alt:"réduire l'aperçu", style:{float:'right'}});
            $(apercuFermer).click(fermer);
            $(apercuAgrandir).click(agrandir);
            $(apercuReduire).click(reduire);
            // on veut pas de transparent
            $apercuContainer.css('background-color', '#fff');
            $apercuContainer.show();
            // on ajoute l'iframe dedans
            iframeApercu = w.addElement(apercuContainer, 'iframe', {style : {position:'absolute',"z-index":1,width:'100%',height:'100%'}});
            isApercu = false;
          } else {
            log.error('div apercu déjà initialisé');
          }
        };

        var fermer = function fermer() {
          log("on ferme");
          // on vide
          $apercuContainer.empty();
          iframeApercu = null;
          // on cache
          $apercuContainer.hide();
          isApercu = null;
        };

        var agrandir = function () {
          log("grand");
          if (isApercu === false) {
            $apercuContainer.css('top', '5%');
            $apercuContainer.css('left', '5%');
            $apercuContainer.height('90%');
            $apercuContainer.width('90%');
            isApercu = true;
          }
        };

        var reduire = function() {
          log("petit");
          if (isApercu) {
            $apercuContainer.height('30%');
            $apercuContainer.width('30%');
            $apercuContainer.css('top', '70%');
            $apercuContainer.css('left', '70%');
            isApercu = false;
          }
        };

        // on crée un div pour le tree et ses compagnons
        var caseTree = w.addElement(container, 'div');
        // la recherche
        var searchContainer = w.addElement(caseTree, "div", {class: 'search'});
        w.addElement(searchContainer, 'span', null, 'Mettre en valeur les titres contenant ');
        var searchInput = w.addElement(searchContainer, 'input', {type:'text'});


        // l'arbre
        var treeId = w.getNewId();
        w.addElement(caseTree, "div", {id: treeId});
        // l'élément root, pas encore un array
        var rootElt = jstreeConverter.toJstree(ressource);
        rootElt.state = {opened: true};

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

        var $tree = $('#' + treeId);
        $tree.jstree(jstData);

        /**
         * Pour récupérer un élément sous sa forme jstree, c'est (id est l'id jstree, sans #)
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
          if (timer) { clearTimeout(timer); }
          timer = setTimeout(function () {
            var v = $searchInput.val();
            $tree.jstree(true).search(v);
          }, 250);
        });

        // pour l'aperçu, on peut pas écouter les clic sur a.jstree-anchor ni li.jstree-node car jstree les intercepte
        // on écoute donc l'événement select sur le jstree
        $tree.on('select_node.jstree', function (e, data) {
          var jstNode = data.node.original;
          log("on veut l'aperçu du node", jstNode);
          if (jstNode && jstNode.a_attr && jstNode.a_attr['data-typeTechnique'] !== 'arbre') {
            if (isApercu === null) initApercu();
            // on resize avant chargement
            agrandir();
            // et on lui file une url à charger
            log("on va charger " +jstNode.a_attr.href);
            iframeApercu.src = jstNode.a_attr.href;
          }
          /*
          var href = data.rslt.obj.children("a").attr("href");
          // this will load content into a div:
          $("#contents").load(href);
          // this will follow the link:
          document.location.href = href; */
        });

      } catch(e) {
        error = e;
      }

      next(error);
    };

    return arbre;
  });
} catch (error) {
  if (typeof window.setError !== 'undefined') window.setError(error);
  if (typeof console !== 'undefined' && console.error) console.error(error);
}

