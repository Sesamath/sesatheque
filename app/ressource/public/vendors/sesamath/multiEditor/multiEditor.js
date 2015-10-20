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
// mathquill a une dépendance à jquery
define(["jquery"], function () {
  'use strict';

  /**
   * Ajoute les liens pour changer d'éditeur
   * @private
   */
  function addLinks(config) {
    /**
     * Ajoute un lien ou un bouton radio suivant config.optionsName
     * @internal
     * @param value
     * @returns {Element}
     */
    function addLink(value) {
      var elt;
      var args = {onclick:editors[value].go};
      if (config.optionsName) {
        var id = value +"Option";
        args.id = id;
        args.name = config.optionsName;
        args.type = "radio";
        args.value = value;
        args.style = {"line-height":"1.3em","vertical-align":"middle"};
        if (config.editor === value) args.checked = "checked";
        elt = S.addElement(divChoices, 'input', args);
        S.addElement(divChoices, 'label', {htmlFor:id, style:{"line-height":"1.3em","vertical-align":"middle", margin:"0 1em 0 0.2em"}}, editors[value].label);
      } else {
        args.style = {padding:"0.3em"};
        elt = S.addElement(divChoices, 'a', args, editors[value].label);
      }

      return elt;
    }

    var divChoices = S.getElement('div');
    S.addText(divChoices, "Utiliser l'éditeur : ");
    var link = addLink("simple");
    if (config.optionsName) $toCkEditorLink = $(link);
    else S.addText(divChoices, " - ");
    link = addLink("mathquill");
    if (config.optionsName) $toMathquillLink = $(link);
    else S.addText(divChoices, " - ");
    link = addLink("ckeditor");
    if (config.optionsName) $toCkEditorLink = $(link);
    $textarea.before(divChoices);
  }

  /**
   * Callback d'erreur par défaut (pour l'afficher sur la page si aucune callback n'a été fournie)
   * @private
   * @param error
   */
  function errorCallbackDefault(error) {
    if (error) ST.addError(error);
  }

  /**
   * Charge et initialise la conf de ckeditor si cela n'avait pas été fait (rien sinon)
   * @private
   * @param {errorCallback} next
   */
  function initCKEditor(next) {
    /*global  CKEDITOR*/
    if (typeof CKEDITOR === "undefined") {
      try {
        require(["ckeditor"], function () {
          require(["ckeditorJquery"], function () {
            if (typeof CKEDITOR === 'undefined') throw new Error('Problème de chargement CKEditor');
            if (CKEDITOR.env.ie && CKEDITOR.env.version < 9) CKEDITOR.tools.enableHtml5Elements(document);
            // The trick to keep the editor in the sample quite small unless user specified own height.
            CKEDITOR.config.height = 150;
            CKEDITOR.config.width = 'auto';
            // on reprend le config.js de base ici pour éviter de le charger
            CKEDITOR.config.toolbarGroups = [
              {name: 'clipboard', groups: ['clipboard', 'undo']},
              {name: 'editing', groups: ['find', 'selection', 'spellchecker']},
              {name: 'links'},
              {name: 'insert'},
              {name: 'forms'},
              {name: 'tools'},
              {name: 'document', groups: ['mode', 'document', 'doctools']},
              {name: 'others'},
              '/',
              {name: 'basicstyles', groups: ['basicstyles', 'cleanup']},
              {name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi']},
              {name: 'styles'},
              {name: 'colors'},
              {name: 'about'}
            ];
            CKEDITOR.config.removeButtons = 'Underline,Subscript,Superscript,Styles';
            CKEDITOR.config.format_tags = 'p;h1;h2;h3;pre';
            CKEDITOR.config.removeDialogTabs = 'image:advanced;link:advanced';
            // mathedit et eqneditor utilisent des appels à CodeCogs pour faire des images, on laisse tomber
            // @todo s'inspirer de mathedit pour faire un plugin mathquill only
            CKEDITOR.config.extraPlugins = 'mathjax';
            // @see http://ckeditor.com/comment/123266#comment-123266, sauf que ça marche pas, faut aller modifier config.js
            // ou TeX-AMS_HTML ou TeX-AMS-MML_SVG, cf http://docs.mathjax.org/en/latest/configuration.html#loading
            CKEDITOR.config.mathJaxLib = "/vendors/mathjax/2.5/MathJax.js?config=TeX-AMS-MML_HTMLorMML";
            //S.log('ckeditor', CKEDITOR);
            next();
          });
        });
      } catch (error) {
        next(error);
      }
    } else {
      // init déjà fait
      next();
    }
  } // initCKEditor

  /**
   * Affecte la variable current, modifie le highligth des liens et appelle la callback éventuelle de modif de l'éditeur
   * @private
   * @param editor
   */
  function setCurrent(editor) {
    if (initConfig.changeCallback) initConfig.changeCallback(editor);
    if ($toSimpleLink) {
      switch (current) {
        case "simple":
          $toSimpleLink.css("background-color", "");
          break;
        case "mathquill":
          $toMathquillLink.css("background-color", "");
          break;
        case "ckeditor":
          $toCkEditorLink.css("background-color", "");
          break;
      }
      switch (editor) {
        case "simple":
          $toSimpleLink.css("background-color", "#fe7");
          break;
        case "mathquill":
          $toMathquillLink.css("background-color", "#fe7");
          break;
        case "ckeditor":
          $toCkEditorLink.css("background-color", "#fe7");
          break;
      }
    } // sinon on a pas initialisé les liens donc rien à faire
    current = editor;
    S.log("On est passé en " +current);
  }

  try {
    var w = window;
    var $ = w.jQuery;
    //var wd = w.document;
    // raccourcis, si ça plante le catch gère
    var S = window.sesamath;
    var ST = S.sesatheque;

    /**
     * Service pour insérer du mathquill
     * @service multiEditor
     */
    var multiEditor = {};

    // objets initialisé par init, globaux à ce module
    var current, initConfig, mqEditor, $textarea, $toCkEditorLink, $toMathquillLink, $toSimpleLink;


    /**
     * Bascule vers CkEditor
     * @memberOf mqEditor
     */
    multiEditor.toCkEditor = function (next) {
      if (typeof next !== "function") next = errorCallbackDefault;
      if (initConfig) {
        // si on était en mathquill faut d'abord récupérer le contenu, on repasse par la case simple pour initialiser
        multiEditor.toSimple(function (error) {
          if (error) {
            next(error);
          } else {
            initCKEditor(function (error) {
              if (error) {
                next(error);
              } else {
                var id = $textarea.attr("id");
                if (!id) {
                  id = "ckeditorSrc";
                  $textarea.attr("id", id);
                }
                CKEDITOR.replace(id, {
                  customConfig: '' // on veut pas charger le config.js de ck
                });
                setCurrent("ckeditor");
                next();
              }
            });
          }
        });
      } else {
        next(new Error("Il faut initialiser le choix de l'éditeur avant"));
      }
    };

    /**
     * Bascule vers mathquill
     * @memberOf mqEditor
     */
    multiEditor.toMathquill = function (next) {
      function init() {
        mqEditor.init(initConfig.textarea, initConfig.mathquill, null, function (error) {
          if (error) {
            next(error);
          } else {
            setCurrent("mathquill");
            next();
          }
        });
      }

      if (typeof next !== "function") next = errorCallbackDefault;
      try {
        if (!initConfig) throw new Error("Il faut initialiser multiEditor avant d'appeler ses autres méthodes");
        multiEditor.toSimple(function (error) {
          if (error) {
            next(error);
          } else {
            // on regarde si y'a des espaces hors de balises \text{}
            var contenuSsTxt = $textarea.val().replace(/\\text{[^}]*}/g, "");
            //if (contenu.length && contenu.indexOf("$") === -1) {
            //  // on ajoute un $$ à la fin
            //  $textarea.val(contenu +" $$");
            //}
            if (contenuSsTxt.indexOf(" ") === -1 || confirm("Attention, l'éditeur d'équation supprime les espaces (hors commande \text{})," +
                    " annuler pour revenir à l'éditeur simple")) {
              if (mqEditor) {
                init();
              } else {
                require(["mqEditor"], function (module) {
                  mqEditor = module;
                  init();
                }, function () {
                  next(new Error("Le chargement de mathquill a échoué"));
                });
              }
            }
          }
        });
      } catch (error) {
        next(error);
      }
    };

    /**
     * Bascule vers textarea
     * @memberOf mqEditor
     */
    multiEditor.toSimple = function (next) {
      if (typeof next !== "function") next = errorCallbackDefault;
      try {
        if (!initConfig) throw new Error("Il faut initialiser le choix de l'éditeur avant");
        if (current === "simple") {
          S.log("On était déjà en simple, on fait rien");
        } else if (current === "mathquill") {
          mqEditor.close();
        } else if (current === "ckeditor") {
          CKEDITOR.instances[$textarea.attr("id")].destroy();
          // on vire le html
          //var contenu = $textarea.val().replace(/<[^<>]+>/ig, "");
          //S.log("avant de simplifier l'éditeur on récupère le texte " +contenu);
          //$textarea.empty();
          //$textarea.val(contenu);
        } else {
          throw new Error("État courant " +current +" non géré, impossible de revenir à l'état simple");
        }
        setCurrent("simple");
        next();
      } catch (error) {
        next(error);
      }
    };

    var editors = {
      simple : {
        go:multiEditor.toSimple,
        label : "simple"
      },
      ckeditor : {
        go:multiEditor.toCkEditor,
        label : "texte riche"
      },
      mathquill : {
        go:multiEditor.toMathquill,
        label:"équation"
      }
    };

    /**
     * Initialise le choix de l'éditeur sur un textarea en créant un div dans container (qui sera créé dans options.container sinon)
     * @memberOf mqEditor
     * @param {Element}        [textarea]  Un textarea avec le contenu à éditer
     * @param {object}         [config]    config qui peut contenir les propriétés
     *                                       - editor : préciser simple|mathquill|ckeditor (simple par défaut)
     *                                       - optionsName : un nom pour mettre les options d'éditeur sous forme de bouton radio plutôt que de liens
     *                                       - choices : pour restreindre à certains éditeurs (['simple', 'mathquill', 'ckeditor'] par défaut),
     *                                         passer un array vide pour empêcher de changer d'éditeur
     *                                       - ckeditor : objet avec des propriétés qui seront passées à CKEDITOR.config
     *                                       - mathquill (liste de noms de boutons, cf mqEditor)
     *                                       - changeCallback : une fonction qui sera appelée avec le nom de l'éditeur à chaque changement
     * @param {errorCallback}  [next]
     */
    multiEditor.init = function (textarea, config, next) {
      $(function () {
        S.log("multiEditor.init avec la config", config);
        if (typeof next !== "function") next = errorCallbackDefault;
        if (!config) config = {};
        if (!config.editor) config.editor = "simple";
        if (!config.choices) config.choices = ['simple', 'mathquill', 'ckeditor'];
        if (!config.ckeditor) config.ckeditor = {};
        if (!config.mathquill) config.mathquill = "full";
        if (!config.changeCallback) config.changeCallback = function () {};
        $textarea = $(textarea);
        if (config.choices.length > 1) {
          addLinks(config);
        }
        initConfig = config;
        initConfig.textarea = textarea;
        current = "simple";
        switch (config.editor) {
          case "simple":
            setCurrent("simple"); // pour le highlight du lien
            next();
            break;
          case "mathquill":
            multiEditor.toMathquill(next);
            break;
          case "ckeditor":
            multiEditor.toCkEditor(next);
            break;
          default :
            throw new Error("Éditeur " +config.editor +" non géré");
        }
      });
    };

    return multiEditor;

  } catch (error) {
    if (typeof ST !== "undefined" && ST.addError) ST.addError(error);
    else if (typeof console !== 'undefined' && console.error) {
      console.error("Il fallait probablement appeler init avant ce module");
      console.error(error);
    }
  }

});
