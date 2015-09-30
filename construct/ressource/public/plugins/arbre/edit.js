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
  define(['tools/jstreeConverter', 'apiClient', 'jquery', 'jstree'], function (jstreeConverter, apiClient) {
    /* jshint jquery:true */
    "use strict";

    // nos fcts internes

    function addApercu(items, node) {
      var ref = node.a_attr && node.a_attr["data-ref"];
      // Apercu sur tous les éléments dont on a une ref
      if (ref) {
        var url = node.a_attr["data-displayUri"];
        if (!url) url = '/ressource/voir/' + ref;
        items.apercu = {
          label : "Aperçu",
          action: function () {
            iframeApercu.src = url;
          }
        };
      }
    }

    function addError(errorMessage) {
      $loadError.text(errorMessage);
      if (!$loadError.hasClass("error")) $loadError.addClass("error");
      setTimeout(function () {
            $loadError.empty();
          },
          5000
      );
    }

    function addLoadSrc() {
      S.addElement(container, 'span', null, "arbre source à charger ");
      inputRef = S.addElement(container, 'input', {id:"loadRef", type:'text'});
      $inputRef = $(inputRef);
      // enter doit pas valider le form mais charger la ref
      $inputRef.keypress(function (event) {
        if (event.keyCode === 13) {
          loadSrc();
          return false; // pour empêcher le submit
        }
      });
      // lien de chargement
      loadLink = S.addElement(container, 'a', {href:'#'}, ' afficher');
      $(loadLink).click(loadSrc);
      // un div pour les erreurs
      var loadError = S.addElement(container, 'p');
      $loadError = $(loadError);
    }

    /**
     * Crée un json de la liste des enfants de l'arbre destination et le met dans le textarea
     * @private
     */
    function dstTreeToTextarea() {
      var jstree = $jstree.reference($dstTree);
      var enfants;
      S.log("dstTreeToTextarea avec", jstree);
      try {
        // on veut pas les enfants de # (un seul, l'arbre complet), mais ceux de notre arbre, 1er (et seul) enfant de root
        var nodeId = jstree._model.data['#'].children[0];
        enfants = jstreeConverter.getEnfants(nodeId, jstree);
      } catch (error) {
        S.log.error(error);
      }
      S.log("On récupère les enfants", enfants);
      var enfantsStr = '';
      try {
        enfantsStr = JSON.stringify(enfants, null, 2);
      } catch (error) {
        S.log.error("Le parsing json a planté", error, enfants);
      }
      if ($textarea) {
        $textarea.val(enfantsStr);
      } else {
        ST.addError("zone de texte enfants non trouvée");
      }
    }

    /**
     * Charge l'arbre source, initialise le dom et les comportements
     * @private
     * @param options
     */
    function initDom(options) {
      // Ajout css, si on a pas tant pis pour le css mais ça va être moche
      var vendorsBaseUrl = options.vendorsBaseUrl || '/vendors';
      var base = options.sesathequeBase || '/';
      S.addCss(vendorsBaseUrl + '/jstree/dist/themes/default/style.min.css');
      S.addCss(base + 'styles/ressources.css');
      // nos éléments html
      var blocTexte = window.document.getElementById('groupEnfants'); // le textarea et son titre
      container = window.document.getElementById('display');
      $container = $(container);

      // ancre
      S.addElement(blocTexte, 'a', {name:"enfants"});
      // lien et comportement pour repasser en graphique
      var linkShowGraphic = S.addElement(blocTexte, 'a', {href:'#enfants'}, 'passer en mode graphique');
      $linkShowGraphic = $(linkShowGraphic);
      $linkShowGraphic.click(showGraphic);

      // lien et comportement pour passer en mode texte
      var linkShowTxt = S.addElement(blocTexte, 'a', {href:'#enfants'}, "passer en mode texte");
      $linkShowTxt = $(linkShowTxt);
      $linkShowTxt.click(showTxt);

      addLoadSrc();

      // la recherche
      var searchContainer = S.addElement(container, "div", {class: 'search'});
      S.addElement(searchContainer, 'span', null, 'Mettre en valeur les titres contenant ');
      searchInput = S.addElement(searchContainer, 'input', {type: 'text'});

      srcGroup = S.addElement(container, 'div', {id:"srcGroup"});
      S.addElement(srcGroup, 'span', null, "arbre source");
      divSrcTree = S.addElement(srcGroup, 'div');
      $srcTree = $(divSrcTree);

      var dstGroup = S.addElement(container, 'div', {id:"dstGroup"});
      S.addElement(dstGroup, 'strong', null, "arbre à modifier");
      S.addElement(dstGroup, 'em', {style:{"font-size":"0.8em"}}, " (clic droit pour enlever des éléments ou ajouter des dossiers)");
      divDstTree = S.addElement(dstGroup, 'div');
      $dstTree = $(divDstTree);

      S.addElement(container, 'p', {style:"clear:both;"}, "Aperçu d'un élément");
      iframeApercu = S.addElement(container, 'iframe', {id:"apercu"});
    }

    /**
     * Charge l'arbre destination
     * @private
     * @param arbre
     */
    function loadDst(arbre) {
      var rootElt = jstreeConverter.toJstree(arbre);
      S.log("après conversion on va charger", rootElt);
      rootElt.state = {opened: true};
      modifIco(rootElt);
      var jstData = {
        core : {
          check_callback : function (action, node, parent) {
            S.log("check_callback avec", arguments);
            // on accepte le drop seulement dans des arbres (dossiers)
            return (parent.id !== "#" && parent.a_attr && parent.a_attr["data-typeTechnique"] === "arbre");
          },
          data: rootElt
        },
        plugins: ["dnd", "contextmenu"],
        contextmenu : {
          select_node:false,
          // cf $jstree.defaults.contextmenu sur
          // https://github.com/vakata/jstree/blob/master/src/jstree.contextmenu.js#L58
          /**
           * La liste de nos éléments de menu
           * @see http://www.jstree.com/api/#/?q=$jstree.defaults&f=$jstree.defaults.contextmenu.items
           * @private
           * @param node Le node, avec les propriétés a_attr, icon, text
           * @param cb à rappeler avec les items du menu contextuel pour ce node
           */
          items : function (node, cb) {
            // on met une fct car le résultat dépend de l'item sur lequel on fait un clic droit
            var items = {};
            var isRacine = (node.parent === '#');
            var isArbreSansRef = node.a_attr["data-typeTechnique"] === "arbre" && !node.a_attr["data-ref"];
            var isArbreRef = node.a_attr["data-typeTechnique"] === "arbre" && node.a_attr["data-ref"];
            // on peut supprimer n'importe quel item sauf la racine
            if (!isRacine) {
              items.remove = {
                label         : "Supprimer",
                action        : function (data) {
                  var inst = $jstree.reference(data.reference);
                  var node = inst.get_node(data.reference);
                  if (inst.is_selected(node)) inst.delete_node(inst.get_selected());
                  else inst.delete_node(node);
                  isDstModified = true;
                },
                shortcut      : 46, // suppr, cf http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
                shortcut_label: 'suppr'
              };
            }
            // On peut créer dans la racine ou les éléments arbre qui ne sont pas une ref vers un autre arbre (sinon faut aller éditer l'original)
            if (isRacine || isArbreSansRef) {
              items.create = {
                label : "Ajouter un dossier",
                action: function (data) {
                  //var name = w.prompt("Nom du dossier");
                  //if (name) {
                  var inst = $jstree.reference(data.reference);
                      S.log("avant modif on a " +inst._cnt +" childs");
                  var node = inst.get_node(data.reference);
                  inst.create_node(node, {icon:"arbreJstNode", a_attr:{"data-typeTechnique":"arbre"}}, "last", function (new_node) {
                    inst.edit(new_node, "titre", function (new_node, status) {
                      if (status) isDstModified = true;
                      S.log("après modif", inst);
                    });
                    /* pourquoi faut le sortir de la pile ?
                    setTimeout(function () {
                      inst.edit(new_node);
                      isDstModified = true;
                    }, 0); */
                  });
                  //}
                }
              };
              // idem pour les ressources
              items.add = {
                label: "Ajouter une ressource",
                action: function (data) {
                  var id = w.prompt("Id de la ressource (oid ou origine/idOrigine");
                  var inst = $jstree.reference(data.reference);
                  var node = inst.get_node(data.reference);
                  apiClient.getRessource(id, function (error, ressource) {
                    if (error) addError(error);
                    else {
                      S.log("ressource récupérée", ressource);
                      console.dir(ressource);
                      var tt = ressource.typeTechnique;
                      var attr = {
                        "data-typeTechnique": tt,
                        "data-ref" : ressource.oid
                      };
                      if (ressource.dataUri) attr["data-dataUri"] = ressource.dataUri;
                      if (ressource.displayUri) attr["data-displayUri"] = ressource.displayUri;
                      inst.create_node(node, {
                        text:ressource.titre,
                        icon: tt + "JstNode",
                        a_attr: attr
                      }, "last", function (new_node) {
                        S.log("node créé", new_node);
                      });
                    }
                  });
                }
              };
            }
            // on peut renommer les arbres sans ref
            if (isArbreSansRef) {
              items.rename = {
                label : "Renommer",
                action : function (data) {
                  var inst = $jstree.reference(data.reference);
                  var node = inst.get_node(data.reference);
                  inst.edit(node);
                  isDstModified = true;
                }
              };
            }
            // un raccourci pour aller éditer une ref
            if (isArbreRef) {
              items.editRef = {
                label : "Éditer",
                action : function () {
                  if (isDstModified) ST.addError("Enfants de l'arbre modifiés mais non sauvegardé (recharger la page pour annuler les modifications avant d'éditer un arbre enfant)");
                  else window.location = "/ressource/modifier/" +node.a_attr["data-ref"];
                }
              };
            }
            addApercu(items, node);
            S.log("clic droit sur", node);
            cb(items);
          }
        }, // contextmenu
        dnd : {
          inside_pos:"last"
        }
      };


      $dstTree.jstree("destroy");
      $dstTree.jstree(jstData);
      //var jstree = $jstree.reference($dstTree);
      //S.log('fct qui renvoie les items par défaut', jstree.settings.contextmenu.items.toString())

      // pour ouvrir / fermer, on peut pas écouter les clic sur a.jstree-anchor ni li.jstree-node car jstree les intercepte
      // on écoute donc l'événement select sur le jstree
      $dstTree.on('select_node.jstree', function (e, data) {
        var jstNode = data.node.original;
        S.log("clic sur", jstNode);
        if (jstNode && jstNode.a_attr && jstNode.a_attr['data-typeTechnique'] === 'arbre') {
          // on fait du toggle
          if ($dstTree.jstree('is_open', data.node)) $dstTree.jstree('close_node', data.node);
          else $dstTree.jstree('open_node', data.node);
        }
      });
    } // loadDst

    /**
     * Charge l'arbre source
     * @private
     * @return {boolean}
     */
    function loadSrc() {
      var ref = $inputRef.val();
      S.log("On va charger en source " +ref);
      if (ref) {
        apiClient.getRessource(ref, function (error, ressource) {
          if (error) {
            ST.addError("Erreur au chargement de " + ref + " : " + error.toString(), 5);
          } else if (ressource && ressource.typeTechnique === 'arbre') {
            arbreInitial = ressource;
            // on charge
            var rootElt = jstreeConverter.toJstree(ressource);
            rootElt.state = {opened: true};
            modifIco(rootElt);
            S.log("On a récupéré un arbre, devenu", rootElt);
            var jstData = {
              core : {
                check_callback : false,
                data: rootElt
              },
              plugins: ["contextmenu", "dnd", "search"],
              contextmenu : {
                items : function (node, cb) {
                  // cf http://www.jstree.com/api/#/?q=$jstree.defaults&f=$jstree.defaults.contextmenu.items
                  var items = {};
                  addApercu(items, node);
                  // ajout du "charger ici"
                  var ref = node.a_attr && node.a_attr["data-ref"];
                  if (ref && node.a_attr["data-typeTechnique"] === "arbre") {
                    items.replace = {
                      label : "Charger ici",
                      action : function () {
                        S.log("Charger en source " +ref);
                        $inputRef.val(ref);
                        loadSrc();
                      }
                    };
                  }
                  S.log("clic droit dans la source sur", node);
                  cb(items);
                }
              },
              dnd : {always_copy:true}
            };
            // si on ne détruit pas un éventuel jstree existant il refuse d'en charger un autre
            var srcTreeRef = $jstree.reference($srcTree);
            if (srcTreeRef) srcTreeRef.destroy();
            $srcTree.jstree(jstData);
            //S.log("après chargement de l'arbre source on a", $jstree.reference($srcTree));

            // pour ouvrir / fermer, on peut pas écouter les clic sur a.jstree-anchor ni li.jstree-node car jstree les intercepte
            // on écoute donc l'événement select sur le jstree
            $srcTree.on('select_node.jstree', function (e, data) {
              var jstNode = data.node.original;
              S.log("clic sur", jstNode);
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
            addError("La ressource " +ref +" n'existe pas ou n'est pas un arbre");
            S.log("Ressource chargée qui n'est pas un arbre", ressource);
          }
        });
      } else {
        S.log("appel de load sans ref");
      }
      return false; // sinon il submit le form !
    } // loadSrc

    /**
     * Remplace les icones classique des dossiers par une icone "ref" quand c'est une ref (qui ne montre pas ses enfants)
     * @private
     * @param jstNode
     */
    function modifIco(jstNode) {
      //S.log("modifIco", jstree);
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
     * @private
     */
    function saveDst() {
      if (!isTextMode) {
        dstTreeToTextarea();
      }

      return true;
    }

    /**
     * Passe en mode texte
     * @private
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
     * @private
     */
    function showGraphic() {
      try {
        dstTree.enfants = JSON.parse($textarea.val());
      } catch (error) {
        ST.addError("json enfants invalide");
        S.log.error(error);
      }
      $linkShowGraphic.hide();
      $textarea.hide();
      S.log("On va charger en dst", dstTree);
      loadDst(dstTree);
      $container.show();
      $linkShowTxt.show();
      isTextMode = false;
    }

    /*********
     * MAIN
     */
    if (typeof $ === 'undefined') throw new Error('Problème de chargement jQuery');
    if (typeof jstreeConverter === 'undefined') throw new Error('Problème de chargement des dépendances');
    if (typeof display === 'undefined') throw new Error('Problème de chargement des dépendances');

    // raccourcis
    var w = window;
    if (typeof w.sesamath === "undefined") w.sesamath = {};
    var S = window.sesamath;
    if (!S.sesatheque) S.sesatheque = {};
    var ST = S.sesatheque;

    // les containers (variables locales au module), qui seront affectés par initDom()
    var iframeApercu, container, srcGroup, inputRef, loadLink, searchInput, divSrcTree, divDstTree, dstTree;
    // quasi les mêmes jquerifiée
    var $container, $inputRef, $loadError, $srcTree, $dstTree, $saveButton, $textarea, $linkShowTxt, $linkShowGraphic;
    var timeout;
    var isTextMode = true;
    var arbreInitial;
    var isDstModified = false;
    // le textarea enfants
    $textarea = $('#enfants');
    var $jstree = $.jstree; // globale pour $.jstree que l'on perd dans les callbacks

    return {
      init: function (arbre, options) {
        dstTree = arbre;
        timeout = options.timeout;
        initDom(options);
        // on ajoute un lien pour passer à la version graphique
        jstreeConverter.setBaseUrl(options.sesathequeBase);
        S.log("edit de l'arbre", arbre);
        S.log("$dstTree", $dstTree);
        $saveButton = $('#saveButton');
        if (!$saveButton) throw new Error("Bouton de sauvegarde non trouvé dans la page");
        if (!$textarea) throw new Error("Champ de sauvegarde des enfants non trouvé dans le formulaire");
        $saveButton.click(saveDst);

        // on charge l'arbre à éditer
        loadDst(arbre);
        showGraphic();
      }
    };
  });
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module");
    console.error(error);
  }
}

