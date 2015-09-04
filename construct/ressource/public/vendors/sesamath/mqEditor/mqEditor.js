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
define(["mathquill"], function () {
  'use strict';
  /**
   * Ajoute un bouton (et son comportement)
   * @private
   * @param parent
   * @param button
   */
  function addButton(parent, button) {
    var argBtn = {class: "mqButton", type:"button"};
    if (mqTitle[button]) argBtn.title = mqTitle[button];
    var btn = S.addElement(parent, 'button', argBtn);
    S.addElement(btn, 'img', {src:basePath + "images/" + button + ".png", alt:mqLabel[button]});
    S.log("Ajout bouton " +button, btn);
    var value = mqExpr[button];
    if (typeof value === "string") {
      // une seule commande
      btn.addEventListener('click', function () {
        S.log("clic sur " +button);
        $mqDiv.mathquill('cmd', value).focus();
      });
    } else if (value && value.forEach) {
      // un array de commandes
      btn.addEventListener('click', function () {
        S.log("clic sur " +button);
        value.forEach(function (args) {
          $mqDiv.mathquill.apply($mqDiv, args);
        });
        $mqDiv.focus();
      });
    } else {
      // inconnu
      S.log.error(button +" n'est pas un bouton connu");
    }
  }

  try {
    var w = window;
    var $ = w.jQuery;
    var wd = w.document;
    // raccourcis, si ça plante le catch gère
    var S = window.sesamath;
    var ST = S.sesatheque;

    /** expressions mathquill, une string (cmd) ou un tableau de tableaux (chacun passé à mathquill.apply) */
    var mqExpr = {
      equivaut: '\\iff',
      exponentielle: [
        ['write', 'e'],
        ['cmd', '^']
      ],
      fraction: '\\frac',
      infEgal: '\\leq',
      infini: '\\infty',
      inter: '\\cap',
      pi: '\\pi',
      puissance: '^',
      racine: '\\sqrt',
      supEgal: '\\geq',
      text: '\\text',
      union: '\\cup',
      vide:'\\emptyset'
    };
    var mqLabel = {
      equivaut: 'équivaut',
      exponentielle: 'exponentielle',
      fraction: 'fraction',
      infEgal: 'inférieur ou égal',
      infini: 'infini',
      inter: 'intersection',
      pi: 'Pi',
      puissance: 'puissance',
      racine: 'racine carrée',
      supEgal: 'supérieur ou égal',
      text: 'texte',
      union: 'union',
      vide:'ensemble vide'
    };
    var mqTitle = {
      equivaut: 'équivaut',
      exponentielle: 'exponentielle',
      fraction: 'fraction',
      infEgal: 'inférieur ou égal',
      infini: 'infini',
      inter: 'intersection',
      pi: 'Pi',
      puissance: 'puissance',
      racine: 'racine carrée',
      supEgal: 'supérieur ou égal',
      text : "ajoute un texte (avec espaces possibles)",
      union: 'union',
      vide:'ensemble vide'
    };
    
    var isInitDone = false;

    /**
     * Service pour insérer du mathquill
     * @service mqEditor
     */
    var mqEditor = {};

    // objets initialisé par init, globaux à ce module
    var basePath, $mqDiv, $mqButtons, $textarea;

    /**
     * Ferme la zone d'édition mathquill en mettant le contenu dans le textarea (ou à défaut le container) passé à l'init
     */
    mqEditor.close = function () {
      if (isInitDone) {
        var contenu = $mqDiv.mathquill('latex');
        if ($textarea) {
          $textarea.val(contenu);
          $textarea.show();
          $mqDiv.remove();
        } else {
          // on laisse le contenu dans son div
          $mqDiv.removeClass().html(contenu);
        }
        $mqButtons.remove();
      }
    };

    /**
     * Initialise MathQuill en créant un div juste avant textarea qu'il cache
     * @memberOf mqEditor
     * @param {Element}        textarea  Un textarea vers lequel mettre le code LaTeX à la fermeture (on le cachera)
     * @param {object}         [config]  Éventuelle config pour mathquill (liste de noms de boutons valant true,
     *                                     parmi equivaut, exponentielle, fraction, infEgal, infini, inter, pi, puissance,
     *                                     racine, supEgal, union, vide), sinon ce sera la conf par défaut
     *                                     (fraction, infEgal, pi, puissance, racine, supEgal)
     * @param {displayOptions} [options] Options (on ne regarde que sesathequeBase s'il existe pour charger les images des boutons)
     * @param {errorCallback}  [next]
     */
    mqEditor.init = function (textarea, config, options, next) {
      try {
        $(function () {
          if (!textarea) throw new Error("Il faut fournir un div ou un textarea pour mathquill");
          basePath = (options && options.sesathequeBase) || "/";
          basePath += "vendors/sesamath/mqEditor/";
          if (textarea.nodeName === "TEXTAREA") {
            $textarea = $(textarea);
            $textarea.hide();
            // on crée un div
            var mqDiv = S.getElement("div");
            $textarea.before(mqDiv);
            $mqDiv = $(mqDiv);
            $mqDiv.html($textarea.val());
          } else {
            // on suppose que c'est un élément mathquillifiable sans vérifier une liste de tags
            S.log("init mathquill avec un contenu dans un tag " + textarea.nodeName);
            $mqDiv = $(textarea);
          }
          // on regarde si on trouve des éléments 
          $mqDiv.attr("contenteditable", true);
          $mqDiv.mathquill('editable').focus();

          // les boutons mathquill
          var mqButtons = wd.getElementById("mqButtons");
          if (!mqButtons) {
            mqButtons = S.getElement('div', {id: "mqButtons"});
            $mqDiv.before(mqButtons);
            $mqButtons = $(mqButtons);
          }
          var defaultConfig = {
            fraction: true,
            infEgal: true,
            pi: true,
            puissance: true,
            racine: true,
            supEgal: true
          };
          var fullConfig = {
            equivaut: true,
            exponentielle: true,
            fraction: true,
            infEgal: true,
            infini: true,
            inter: true,
            pi: true,
            puissance: true,
            racine: true,
            supEgal: true,
            text: true,
            union: true,
            vide: true
          };
          if (!config) config = defaultConfig;
          else if (config === "default") config = defaultConfig;
          else if (config === "full") config = fullConfig;
          // on ajoute ces boutons
          for (var btn in config) {
            if (config.hasOwnProperty(btn) && config[btn]) {
              addButton(mqButtons, btn);
            }
          }
          S.addElement(mqButtons, "hr", {style: {visibility: "hidden", clear: "left"}});
          //$mqDiv.mathquill().focus();
          isInitDone = true;
          if (next) next();
        });
      } catch (error) {
        if (next) next(error);
        else throw error;
      }
    };

    /**
     * Cache les boutons mathquill
     * @memberOf mqEditor
     */
    mqEditor.hideButtons = function () {
      if (isInitDone) $mqButtons.hide();
    };

    /**
     * Affiche les boutons mathquill
     * @memberOf mqEditor
     */
    mqEditor.showButtons = function () {
      if (isInitDone) $mqButtons.show();
    };

    /**
     * Cache ou affiche les boutons mathquill
     * @memberOf mqEditor
     */
    mqEditor.toggleButtons = function () {
      if (isInitDone) $mqButtons.toggle();
    };

    return mqEditor;

  } catch (error) {
    if (typeof ST !== "undefined" && ST.addError) ST.addError(error);
    else if (typeof console !== 'undefined' && console.error) {
      console.error("Il fallait probablement appeler init avant ce module");
      console.error(error);
    }
  }

});
