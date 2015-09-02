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
    var btn = S.addElement(parent, 'button', {class: "mqButton", type:"button"});
    S.addElement(btn, 'img', {src:basePath + "images/" + button + ".png", alt:mqLabel[button]});
    S.log("Ajout bouton " +button, btn);
    var value = mqExpr[button];
    if (typeof value === "string") {
      // une seule commande
      btn.addEventListener('click', function () {
        S.log("clic sur " +button);
        $mqEditor.mathquill('cmd', value).focus();
      });
    } else if (value && value.forEach) {
      // un array de commandes
      btn.addEventListener('click', function () {
        S.log("clic sur " +button);
        value.forEach(function (args) {
          $mqEditor.mathquill.apply($mqEditor, args);
        });
        $mqEditor.focus();
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
    var basePath, mqButtons, $mqContainer, $mqEditor, $mqButtons, $textarea;

    /**
     * Ferme la zone d'édition mathquill en mettant le contenu dans le textarea (ou à défaut le container) passé à l'init
     */
    mqEditor.close = function () {
      if (isInitDone) {
        var contenu = $mqEditor.mathquill('latex');
        if ($textarea) {
          $textarea.val(contenu);
          $textarea.show();
        } else {
          // on met le contenu dans container
          $mqContainer.empty().removeClass().html(contenu);
        }
      }
    };

    /**
     * Initialise MathQuill en créant un div dans container (qui sera créé dans options.container sinon)
     * @memberOf mqEditor
     * @param {Element}        [container] Un conteneur (un div, pas un élément jquery), 
     *                                       si non fourni on crééra un div#mqEditor dans options.container
     * @param {Element}        [textarea]  Un textarea vers lequel mettre le code LaTeX à la fermeture (on le cachera)
     * @param {object}         [config]    Éventuelle config pour mathquill (liste de noms de boutons valant true,
     *                                       parmi equivaut, exponentielle, fraction, infEgal, infini, inter, pi, puissance,
     *                                       racine, supEgal, union, vide), sinon ce sera la conf par défaut
     *                                       (fraction, infEgal, pi, puissance, racine, supEgal)
     * @param {displayOptions} [options]   Options avec un container éventuel
     * @param {errorCallback}  [next]
     */
    mqEditor.init = function (container, textarea, config, options, next) {
      $(function () {
        // nos éléments html de base
        if (!container && options.container) container = options.container;
        if (!container) throw new Error("Il faut fournir un conteneur pour mathquill");

        basePath = options.sesathequeBase || "/";
        basePath += "vendors/sesamath/mqEditor/";
        mqButtons = wd.getElementById("mqButtons");
        var divEditor = S.addElement(container, 'div', {style:{"min-width":"300px;", "min-height":"200px"}});
        $mqEditor = $(divEditor);
        if (!mqButtons) mqButtons = S.addElement(container, 'div', {id: "mqButtons"});
        // init de nos objets jquery
        $mqContainer = $(container);
        $mqButtons = $(mqButtons);
        if (textarea) {
          $textarea = $(textarea);
          $textarea.hide();
        }

        // la conf
        var defaultConfig = {
          fraction: true,
          infEgal: true,
          pi: true,
          puissance: true,
          racine: true,
          supEgal: true
        };
        if (!config) config = defaultConfig;

        // on ajoute les boutons demandés
        $mqEditor.mathquill('editable');
        for (var btn in config) {
          if (config.hasOwnProperty(btn) && config[btn]) {
            addButton(mqButtons, btn);
          }
        }
        S.addElement(mqButtons, "hr", {style: {visibility: "hidden", clear: "left"}});
        isInitDone = true;
        if (next) next();
      });
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
