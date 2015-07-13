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
 * @file Édite une ressource url
 */
try {
  define(['jquery1'], function () {
    /* jshint jquery:true */
    "use strict";

    // nos fcts internes

    /**
     * Charge l'arbre source, initialise le dom et les comportements 
     * @param options
     */
    function initDom(options) {
      // Ajout css, si on a pas tant pis pour le css mais ça va être moche
      if (options.vendorsBaseUrl) w.addCss(options.vendorsBaseUrl + '/editUrl.css');
      // nos éléments html
      var blocTexte = window.document.getElementById('groupEnfants'); // le textarea et son titre
      container = window.document.getElementById('display');
      $container = $(container);

      // ancre
      w.addElement(blocTexte, 'a', {name:"enfants"});
      // lien et comportement pour repasser en graphique
      var linkShowGraphic = w.addElement(blocTexte, 'a', {href:'#enfants'}, 'passer en mode graphique');
      $linkShowGraphic = $(linkShowGraphic);
      $linkShowGraphic.click(showGraphic);

      // lien et comportement pour passer en mode texte
      var linkShowTxt = w.addElement(blocTexte, 'a', {href:'#enfants'}, "passer en mode texte");
      $linkShowTxt = $(linkShowTxt);
      $linkShowTxt.click(showTxt);

      addLoadSrc();

      // la recherche
      var searchContainer = w.addElement(container, "div", {class: 'search'});
      w.addElement(searchContainer, 'span', null, 'Mettre en valeur les titres contenant ');
      searchInput = w.addElement(searchContainer, 'input', {type: 'text'});

      srcGroup = w.addElement(container, 'div', {id:"srcGroup"});
      w.addElement(srcGroup, 'span', null, "arbre source");
      srcTree = w.addElement(srcGroup, 'div');

      var dstGroup = w.addElement(container, 'div', {id:"dstGroup"});
      w.addElement(dstGroup, 'strong', null, "arbre à modifier");
      w.addElement(dstGroup, 'em', {style:{"font-size":"0.8em"}}, " (clic droit pour enlever des éléments ou ajouter des dossiers)");
      dstTree = w.addElement(dstGroup, 'div');

      w.addElement(container, 'p', {style:"clear:both;"}, "Aperçu d'un élément");
      iframeApercu = w.addElement(container, 'iframe', {id:"apercu"});

      showGraphic();
    }

    /**
     * Charge l'arbre destination
     * @param arbre
     */
    function loadDst(arbre) {
      var rootElt = jstreeConverter.toJstree(arbre);
      rootElt.state = {opened: true};
      modifIco(rootElt);
      var jstData = {
        core : {
          check_callback : true,
          data: rootElt
        },
        plugins: ["dnd", "contextmenu"],
        contextmenu : {
          // cf $.jstree.defaults.contextmenu sur
          // https://github.com/vakata/jstree/blob/master/src/jstree.contextmenu.js#L58
          /**
           *
           * @param node Le node, avec les propriétés {a_attr, icon, text}
           * @param cb à rappeler avec les items du menu contextuel pour ce node
           */
          items : function (node, cb) {
            // cf http://www.jstree.com/api/#/?q=$.jstree.defaults&f=$.jstree.defaults.contextmenu.items
            // on met une fct car le résultat dépend de l'item sur lequel on fait un clic droit
            var items = {};
            var isRacine = (node.parent === '#');
            var isArbreSansRef = node.a_attr["data-typeTechnique"] === "arbre" && !node.a_attr["data-ref"];
            // on peut supprimer n'importe quel item sauf la racine
            if (!isRacine) {
              items.remove = {
                label         : "Supprimer",
                action        : function (data) {
                  var inst = $.jstree.reference(data.reference);
                  var node = inst.get_node(data.reference);
                  if (inst.is_selected(node)) inst.delete_node(inst.get_selected());
                  else inst.delete_node(node);
                },
                shortcut      : 46, // suppr, cf http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
                shortcut_label: 'suppr'
              };
            }
            // On peut créer dans la racine ou les éléments arbre qui n'en sont pas eux-même
            if (isRacine || isArbreSansRef) {
              items.create = {
                label : "Ajouter un dossier",
                action: function (data) {
                  //var name = w.prompt("Nom du dossier");
                  //if (name) {
                  var inst = $.jstree.reference(data.reference);
                  var node = inst.get_node(data.reference);
                  inst.create_node(node, {icon:"arbreJstNode", a_attr:{"data-typeTechnique":"arbre"}}, "last", function (new_node) {
                    // pourquoi faut le sortir de la pile ?
                    setTimeout(function () {
                      inst.edit(new_node);
                    }, 0);
                  });
                  //}
                }
              };
            }
            // on peut renommer les arbres sans ref
            if (isArbreSansRef) {
              items.rename = {
                label : "Renommer",
                action : function (data) {
                  var inst = $.jstree.reference(data.reference);
                  var node = inst.get_node(data.reference);
                  inst.edit(node);
                }
              };
            }
            addApercu(items, node);
            log("clic droit sur", node);
            cb(items);
          }
        }
      };


      $dstTree.jstree(jstData);
      //var jstree = $.jstree.reference($dstTree);
      //log('fct qui renvoie les items par défaut', jstree.settings.contextmenu.items.toString())

      // pour ouvrir / fermer, on peut pas écouter les clic sur a.jstree-anchor ni li.jstree-node car jstree les intercepte
      // on écoute donc l'événement select sur le jstree
      $dstTree.on('select_node.jstree', function (e, data) {
        var jstNode = data.node.original;
        log("clic sur", jstNode);
        if (jstNode && jstNode.a_attr && jstNode.a_attr['data-typeTechnique'] === 'arbre') {
          // on fait du toggle
          if ($dstTree.jstree('is_open', data.node)) $dstTree.jstree('close_node', data.node);
          else $dstTree.jstree('open_node', data.node);
        }
      });
    }

    /**
     * Charge l'arbre source
     * @return {boolean}
     */
    function loadSrc() {
      var ref = $inputRef.val();
      log("On va charger en source " +ref);
      if (ref) {
        apiClient.getRessource(ref, function (error, ressource) {
          if (error) {
            w.setError("Erreur au chargement de " + ref + " : " + error.toString(), 5);
          } else if (ressource && ressource.typeTechnique === 'arbre') {
            arbreInitial = ressource;
            // on charge
            var rootElt = jstreeConverter.toJstree(ressource);
            rootElt.state = {opened: true};
            modifIco(rootElt);
            log("On a récupéré un arbre, devenu", rootElt);
            var jstData = {
              core : {
                check_callback : false,
                data: rootElt
              },
              plugins: ["contextmenu", "dnd", "search"],
              contextmenu : {
                items : function (node, cb) {
                  // cf http://www.jstree.com/api/#/?q=$.jstree.defaults&f=$.jstree.defaults.contextmenu.items
                  var items = {};
                  addApercu(items, node);
                  // ajout du "charger ici"
                  var ref = node.a_attr && node.a_attr["data-ref"];
                  if (ref && node.a_attr["data-typeTechnique"] === "arbre") {
                    items.replace = {
                      label : "Charger ici",
                      action : function () {
                        log("Charger en source " +ref);
                        $inputRef.val(ref);
                        loadSrc();
                      }
                    };
                  }
                  log("clic droit dans la source sur", node);
                  cb(items);
                }
              },
              dnd : {always_copy:true}
            };
            // si on ne détruit pas un éventuel jstree existant il refuse d'en charger un autre
            var srcTreeRef = $.jstree.reference($srcTree);
            if (srcTreeRef) srcTreeRef.destroy();
            $srcTree.jstree(jstData);
            //log("après chargement de l'arbre source on a", $.jstree.reference($srcTree));

            // pour ouvrir / fermer, on peut pas écouter les clic sur a.jstree-anchor ni li.jstree-node car jstree les intercepte
            // on écoute donc l'événement select sur le jstree
            $srcTree.on('select_node.jstree', function (e, data) {
              var jstNode = data.node.original;
              log("clic sur", jstNode);
              if (jstNode && jstNode.a_attr && jstNode.a_attr['data-typeTechnique'] === 'arbre') {
                // on fait du toggle
                if ($srcTree.jstree('is_open', data.node)) $srcTree.jstree('close_node', data.node);
                else $srcTree.jstree('open_node', data.node);
              }
            });

            // pour la recherche, on remet le comportement de la modif de l'input sur l'arbre
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
            $loadError.text("La ressource " +ref +" n'existe pas ou n'est pas un arbre");
            setTimeout(function () {
                $loadError.empty();
              },
              5000
            );
            log("Ressource chargée qui n'est pas un arbre", ressource);
          }
        });
      } else {
        log("appel de load sans ref");
      }
      return false; // sinon il submit le form !
    } // loadSrc

    /**
     * Remplace les icones classique des dossiers par une icone "ref" quand c'est une ref (qui ne montre pas ses enfants)
     * @param jstNode
     */
    function modifIco(jstNode) {
      //log("modifIco", jstree);
      if (jstNode.children && jstNode.children.forEach) {
        jstNode.children.forEach(function (child) {
          if (child.children && child.children.length) {
            child.children.forEach(modifIco);
          } else if (child.a_attr && child.a_attr['data-typeTechnique'] === 'arbre' && child.a_attr['data-ref']) {
            // on change l'icone
            child.icon = 'arbreJstNodeRef';
            // on vire ça pour pas avoir le triangle qui laisse supposer que ça se déplie
            child.children = false;
          }
        });
      }
    }

    /**
     * Récupère l'arbre jstree et complète le champ enfants avec
     */
    function saveDst() {
      if (!isTextMode) {
        dstTreeToTextarea();
      }

      return true;
    }

    /**
     * Passe en mode texte
     */
    function showTxt() {
      $linkShowTxt.hide();
      $container.hide();
      dstTreeToTextarea();
      $textarea.show();
      $linkShowGraphic.show();
      isTextMode = true;
    }

    /**
     * passe en mode graphique
     */
    function showGraphic() {
      $linkShowGraphic.hide();
      $textarea.hide();
      if (arbreInitial) {
        arbreInitial.enfants = $textarea.val();
        loadDst(arbreInitial);
      }
      $container.show();
      $linkShowTxt.show();
      isTextMode = false;
    }

    /**
     * MAIN
     */
    if (typeof $ === 'undefined') throw new Error('Problème de chargement jQuery');
    if (typeof jstreeConverter === 'undefined') throw new Error('Problème de chargement des dépendances');
    if (typeof display === 'undefined') throw new Error('Problème de chargement des dépendances');

    var w = window;
    // les containers (variables locales au module), qui seront affectés par initDom()
    var iframeApercu, container, srcGroup, inputRef, loadLink, searchInput, srcTree, dstTree;
    // quasi les mêmes jquerifiée
    var $container, $inputRef, $loadError, $srcTree, $dstTree, $saveButton, $textarea, $linkShowTxt, $linkShowGraphic;
    var timeout;
    var isTextMode = true;
    var arbreInitial;
    // le textarea enfants
    $textarea = $('#enfants');

    return {
      init: function (arbre, options) {
        timeout = options.timeout;
        initDom(options);
        // on ajoute simplement un lien pour passer à la version graphique
        jstreeConverter.setBaseUrl(options.sesathequeBase);
        log("edit de l'arbre", arbre);
        // nos arbres jstree
        $srcTree = $(srcTree);
        $dstTree = $(dstTree);
        $saveButton = $('#saveButton');
        if (!$saveButton) throw new Error("Bouton de sauvegarde non trouvé dans la page");
        $textarea = $('#enfants');
        if (!$textarea) throw new Error("Champ de sauvegarde des enfants non trouvé dans le formulaire");
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

