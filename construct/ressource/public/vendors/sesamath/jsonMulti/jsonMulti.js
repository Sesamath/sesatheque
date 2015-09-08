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
// jsoneditor a une dépendance à jquery
define(["jQuery"], function ($) {
  'use strict';
  /*global alert*/

  /**
   * Ajoute les liens pour changer d'éditeur
   * @private
   */
  function addLinks(config) {
    /**
     * Ajoute un lien ou un bouton radio suivant config.optionsName
     * @internal
     * @param container
     * @param editorName
     * @returns {Element}
     */
    function addLink(container, editorName) {
      var elt;
      var args = {onclick:function () {setCurrent(editorName);}};
      if (config.optionsName) {
        var id = editorName +"Option";
        args.id = id;
        args.name = config.optionsName;
        args.type = "radio";
        args.editorName = editorName;
        args.style = {"line-height":"1.3em","vertical-align":"middle"};
        if (config.editor === editorName) args.checked = "checked";
        elt = S.addElement(container, 'input', args);
        S.addElement(container, 'label', {htmlFor:id, style:{"line-height":"1.3em","vertical-align":"middle", margin:"0 1em 0 0.2em"}}, editors[editorName].label);
      } else {
        args.style = {padding:"0.3em"};
        elt = S.addElement(container, 'a', args, editors[editorName].label);
        // on ajoute un objet jqLink qui sert pour savoir s'il faut modifier des css au changement ou pas
        editors[editorName].jqLink = $(elt);
      }

      return elt;
    }

    var divChoices = S.getElement('div');
    S.addText(divChoices, "Utiliser l'éditeur : ");
    var first = true;
    for (var editorName in editors) {
      if (editors.hasOwnProperty(editorName)) {
        addLink(divChoices, editorName);
        if (first) first = false;
        else S.addText(divChoices, " - ");
      }
    }
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
   * Charge et initialise jsoneditor si cela n'avait pas été fait (rien sinon)
   * @private
   * @param {errorCallback} next
   */
  function initJsonEditor(next) {
    try {
      if (typeof isJseLoaded === "undefined") {
        isJseLoaded = false; // en cours
        require(["jsoneditor"], function (JSONEditor) {
          if (!JSONEditor) throw new Error('Problème de chargement de jsoneditor');
          jsonEditor = new JSONEditor(jsonEditorId);
          isJseLoaded = true;
          next();
        }, function () {
          throw new Error('Problème de chargement de jsoneditor');
        });
      } else if (isJseLoaded === false) {
        alert("Le chargement de jsoneditor est en cours")
      } else {
        // init déjà fait
        next();
      }
    } catch (error) {
      next(error);
    }
  } // initJsonEditor

  /**
   * Change l'éditeur courant (affecte la variable current, modifie le highligth des liens
   * et appelle la callback éventuelle de modif de l'éditeur)
   * @private
   * @param editorName
   */
  function setCurrent(editorName) {
    // réalise la bascule visuelle
    function toggle() {
      if (editors[editorName].jqLink) {
        // css sur les liens
        editors[current].jqLink.css("background-color", "");
        editors[editorName].jqLink.css("background-color", "");
      } // sinon on a pas initialisé les liens donc rien à faire
      editors[current].jq.hide();
      editors[editorName].jq.show();
      if (changeCallback) changeCallback(editorName);
      current = editorName;
      S.log("On est passé à l'éditeur " + current);
    }

    try {
      if (editorName !== current) {
        if (current === "simple") {
          var json = $textarea.val();
          if (isJsonValide(json)) {
            editors[editorName].setJson(json);
            toggle();
          } else {
            throw new Error("Le json est invalide");
          }
        } else {
          setSimple(function (error, json) {
            if (error) throw error;
            else {
              editors[editorName].setJson(json);
              toggle();
            }
          });
        }
      } else if (console && console.error) {
        console.error(new Error("On était déjà sur l'éditeur " +editorName));
      }
    } catch (error) {
      ST.addError(error.toString(), 5);
    }
  }
  
  function isJsonValide(json) {
    var retour = false;
    try {
      JSON.parse(json);
      retour = true;
    } catch (error) {
      S.log("json invalide", json);
    }
    
    return retour;
  }

  /**
   * Récupère le json de l'éditeur courant, s'il est valide l'affecte dans le textarea et appelle next avec l'objet,
   * sinon affiche une erreur
   * @private
   * @param next
   */
  function setSimple(next) {
    if (current !== "simple") {
      editors[current].getJson(function (jsonString) {
        // on teste que c'est du json valide en récupérant l'objet au passage
        try {
          var obj = JSON.parse(jsonString);
          // et on l'affecte indenté
          $textarea.val(JSON.stringify(obj, null, 2));
          next(obj);
        } catch (error) {
          ST.addError("Le json est invalide", 3000);
        }
      });
    }
  }

  /**
   * Charge jsonEditor si ça n'a jamais été fait et l'initialise avec l'objet de l'éditeur courant
   * (ou affiche une erreur)
   */
  function setJsonEditor() {
    setSimple(function (obj) {
      initJsonEditor(function (error) {
        if (error) ST.addError(error.toString(), 5);
        else jsonEditor.set(obj);
      });
    });
  }

  try {
    var w = window;
    //var wd = w.document;
    // raccourcis, si ça plante le catch gère
    var S = w.sesamath;
    var ST = S.sesatheque;
    
    var isInitDone = false;
    var isJseLoaded = false;
    var jsonEditorId = "jsonEditor";

    /**
     * Service pour insérer jsoneditor et basculer avec un textarea classique
     * @service jsonMulti
     */
    var jsonMulti = {};

    // objets globaux à ce module
    var basePath, changeCallback, current, jsonEditor, $textarea;

    var editors = {
      simple : {
        label : "simple",
        getJson:function (next) { next($textarea.val()); },
        go: function () {setCurrent("simple");}
      },
      jsoneditor : {
        label : "avancé",
        getJson:function (next) {
          if (jsonEditor) {
            next(jsonEditor.get());
          } else {
            ST.addError("jsonEditor n'est pas encore initialisé", 5);
          }
        },
        setJson: setJsonEditor
      }
    };

    /**
     * Initialise MathQuill en créant un div juste avant textarea qu'il cache
     * @memberOf jsonMulti
     * @param {Element}        textarea  Un textarea vers lequel mettre le code LaTeX à la fermeture (on le cachera)
     * @param {object}         config    Objet avec les propriétés (facultatives entre crochets
     *                                   - changeCallback : sera appelé avec le nom du nouvel éditeur à chaque changement
     *                                   - editorsSup : un tableau d'objets {
     *                                       container : le div qui sera masqué / affiché lors des changements
     *                                       get:fonction appelée avec une callback à laquelle il faudra fournir le contenu à mettre dans le textarea
     *                                       label:texte affiché pour le lien de bascule,
     *                                       set:callback pour lancer l'éditeur, appelée avec la string json (valide)
     *                                     }
     *                                   - optionsName : un nom pour mettre des boutons radio à la place des liens simples (pour insérer le choix dans le form)
     * @param {displayOptions} [options] Options (pas utilisé pour le moment, pour rester homogène avec multiEditor)
     * @param {errorCallback}  [next]
     */
    jsonMulti.init = function (textarea, config, options, next) {
      try {
        $(function () {
          if (!textarea) throw new Error("Il faut fournir un textarea pour jsonMulti");
          basePath = (options && options.sesathequeBase) || "/";
          basePath += "vendors/sesamath/jsonMulti/";
          if (textarea.nodeName !== "TEXTAREA") throw new Error("Il faut fournir un textarea pour jsonMulti");
          $textarea = $(textarea);
          editors.simple.jq = $textarea;
          // on ajoute les boutons
          addLinks(config);
          // on affecte ça si ça existe
          if (config.changeCallback) changeCallback = options.changeCallback;
          // on crée un div pour jsonEditor
          var jsonDiv = S.getElement("div", {id:jsonEditorId});
          $textarea.before(jsonDiv);
          if (options && options.optionsName === "jsoneditor") {
            initJsonEditor(function () {
              setCurrent('jsoneditor');
              isInitDone = true;
            });
          } else {
            isInitDone = true;
          }

          if (next) next();
        });
      } catch (error) {
        if (next) next(error);
        else throw error;
      }
    };

    return jsonMulti;

  } catch (error) {
    if (typeof ST !== "undefined" && ST.addError) ST.addError(error);
    else if (typeof console !== 'undefined' && console.error) {
      console.error("Il fallait probablement appeler init avant ce module");
      console.error(error);
    }
  }

});
