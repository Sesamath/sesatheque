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

define(["jquery", "mathquill"], function () {
  'use strict';
  /**
   * Ajoute un bouton (et son comportement)
   * @private
   * @param button
   */
  function addButton(button) {
    var btn = S.addElement(buttons, 'button', {class: "mqButton", onclick:function () {return false;}});
    S.addElement(btn, 'img', {src:basePath + "images/" + button + ".png", alt:mqLabel[button]});
    S.log("Ajout bouton " +button, btn);
    btn.addEventListener('click', function () {
      if (typeof mqExpr[button] === "string") {
        // une seule commande
        $textarea.mathquill('cmd', mqExpr[button]).focus();

      } else if (mqExpr[button] && mqExpr[button].forEach) {
        // un array de commandes
        mqExpr[button].forEach(function (args) {
          $textarea.mathquill.apply($textarea, args);
        });
        $textarea.focus();

      } else {
        // inconnu
        S.log.error(button +" n'est pas un bouton connu");
      }
    });
  }
  
  try {
    var w = window;
    var $ = w.jQuery;
    var wd = w.document;
    // raccourcis, si ça plante le catch gère
    var S = window.sesamath;

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

    // objets jquery, initialisé par init, globaux à ce module
    var $wqContainer, $buttons, $textarea;

    /**
     * Initialise MathQuill dans wqContainer (le crée dans options.container sinon)
     * @memberOf mqEditor
     * @param wqContainer
     * @param {object}         [config] Éventuelle config pour mathquill, sinon ce sera la conf par défaut
     * @param {displayOptions} options
     * @param {errorCallback}  next
     */
    mqEditor.init = function (wqContainer, config, options, next) {
      // nos éléments html de base
      if (!wqContainer) wqContainer = wd.getElementById('mqEditor');
      if (!wqContainer) wqContainer = S.addElement(options.container, 'div', {id:"mqEditor"});
      var buttons = wd.getElementById("mqButtons"),
          textarea;
      if (!buttons) buttons = S.addElement(wqContainer, 'div', {id: "mqButtons"});
      var txt = wqContainer.getElementsByTagName('textarea');
      if (txt) textarea = txt[0];
      else textarea = S.addElement(wqContainer, 'textarea');
      // init de nos objets jquery
      $wqContainer = $(wqContainer);
      $buttons = $(buttons);
      $textarea = $(textarea);

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

      S.addCss(options.pluginBase + "mqEditor.css");

      // on ajoute les boutons demandés
      for (var btn in config) {
        if (config.hasOwnProperty(btn) && config[btn]) {
          addButton(btn);
        }
      }
      isInitDone = true;
      if (next) next();
    };

    /**
     * Cache les boutons mathquill
     * @memberOf mqEditor
     */
    mqEditor.hideButtons = function () {
      if (isInitDone) $buttons.hide();
    };

    /**
     * Affiche les boutons mathquill
     * @memberOf mqEditor
     */
    mqEditor.showButtons = function () {
      if (isInitDone) $buttons.show();
    };

    /**
     * Cache ou affiche les boutons mathquill
     * @memberOf mqEditor
     */
    mqEditor.toggleButtons = function () {
      if (isInitDone) $buttons.toggle();
    };

    return mqEditor;

  } catch (error) {
    if (typeof console !== 'undefined' && console.error) {
      console.error("Il fallait probablement appeler init avant ce module");
      console.error(error);
    }
  }

});
