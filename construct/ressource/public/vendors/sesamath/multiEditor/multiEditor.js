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
  function addLinks() {
    var divChoices = S.getElement('div');
    S.addText(divChoices, "Utiliser l'éditeur : ");
    var toSimpleLink = S.addElement(divChoices, 'a', {id:"toSimpleLink", style:{padding:"0.3em"}, onclick:multiEditor.toSimple}, "simple");
    S.addText(divChoices, " - ");
    var toMathquillLink = S.addElement(divChoices, 'a', {id:"toMathquillLink", style:{padding:"0.3em"}, onclick:multiEditor.toMathquill}, "équation");
    S.addText(divChoices, " - ");
    var toCkEditorLink = S.addElement(divChoices, 'a', {id:"toCkEditorLink", style:{padding:"0.3em"}, onclick:multiEditor.toCkEditor}, "texte riche");
    $textarea.before(divChoices);
    $toCkEditorLink = $(toCkEditorLink);
    $toMathquillLink = $(toMathquillLink);
    $toSimpleLink = $(toSimpleLink);
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
     * Initialise le choix de l'éditeur sur un textarea en créant un div dans container (qui sera créé dans options.container sinon)
     * @memberOf mqEditor
     * @param {Element}        [textarea]  Un textarea avec le contenu à éditer
     * @param {object}         [config]    config qui peut contenir les propriétés
     *                                       - editor : préciser simple|mathquill|ckeditor (simple par défaut)
     *                                       - choices : pour restreindre à certains éditeurs (['simple', 'mathquill', 'ckeditor'] par défaut),
     *                                         passer un array vide pour empêcher de changer d'éditeur
     *                                       - ckeditor : objet avec des propriétés qui seront passées à CKEDITOR.config
     *                                       - mathquill (liste de noms de boutons, cf mqEditor)
     *                                       - changeCallback : une fonction qui sera appelée avec le nom de l'éditeur à chaque changement
     * @param {errorCallback}  [next]
     */
    multiEditor.init = function (textarea, config, next) {
      $(function () {
        if (typeof next !== "function") next = errorCallbackDefault;
        if (!config) config = {};
        if (!config.editor) config.editor = "simple";
        if (!config.choices) config.choices = ['simple', 'mathquill', 'ckeditor'];
        if (!config.ckeditor) config.ckeditor = {};
        if (!config.mathquill) config.mathquill = null;
        if (!config.changeCallback) config.changeCallback = function () {};
        $textarea = $(textarea);
        if (config.choices.length > 1) {
          addLinks();
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

    /**
     * Cache les boutons mathquill
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
     * Affiche les boutons mathquill
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
      } catch (error) {
        next(error);
      }
    };

    /**
     * Cache ou affiche les boutons mathquill
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

    return multiEditor;

  } catch (error) {
    if (typeof ST !== "undefined" && ST.addError) ST.addError(error);
    else if (typeof console !== 'undefined' && console.error) {
      console.error("Il fallait probablement appeler init avant ce module");
      console.error(error);
    }
  }

});
