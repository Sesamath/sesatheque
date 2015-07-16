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

'use strict'

define(["jquery1", "mathquill"], function () {
  /**
   * Ajoute un bouton (et son comportement)
   * @param button
   */
  function addButton(button) {
    var attrs = {
      type: "button",
      class: "mqButton" /*,
      style: "background-image: url('" + basePath + "images/" + button + ".png');" */
    }
    var btn = w.addElement(buttons, 'button', {class: "mqButton", onclick:function () {return false;}});
    w.addElement(btn, 'img', {src:basePath + "images/" + button + ".png", alt:mqLabel[button]});
    log("Ajout bouton " +button, btn);
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
        log.error(button +" n'est pas un bouton connu");
      }
    });
  }

  var w = window;
  var $ = w.jQuery;
  var wd = w.document;
  /** {HTMLElement} Le conteneur global */
  var container;
  /** {HTMLElement} Le div des boutons */
  var buttons;
  /** {HTMLElement} Le textarea */
  var textarea;
  // les même en objets jquery
  var $container, $buttons, $textarea;
  // le chemin vers ce dossier, avec slash de fin
  var basePath;
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

  if (typeof w.log === undefined) w.log = function () {};

  try {

    /**
     * Fonction a qui on doit passer un container et une conf,
     * avec options.vendorsBaseUrl si on est sur un autre domaine que celui de la sesatheque
     */
    return {
      init: function (ctn, config, options, next) {
        // nos éléments html de base
        if (!ctn) ctn = wd.getElementById('mqEditor');
        if (ctn) container = ctn;
        else throw new Error("Il faut fournir un container ou avoir un élément mqEditor dans la page");
        buttons = wd.getElementById("mqButtons");
        if (!buttons) buttons = w.addElement(container, 'div', {id: "mqButtons"});
        var txt = container.getElementsByTagName('textarea');
        if (txt) textarea = txt[0];
        else textarea = w.addElement(container, 'textarea');
        // init de nos objets jquery
        $container = $(container);
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
        }
        if (!config) config = defaultConfig;

        // options
        if (!options) options = {};
        basePath = options.vendorsBaseUrl || '/vendors';
        basePath += "/sesamath/mqEditor/";
        w.addCss(basePath + "mqEditor.css");

        // on ajoute les boutons demandés
        for (var btn in config) {
          if (config.hasOwnProperty(btn) && config[btn]) {
            addButton(btn);
          }
        }
        isInitDone = true;
        if (next) next();
      },
      hideButtons : function () {
        if (isInitDone) $buttons.hide();
      }
    };

  } catch (error) {
    if (w.setError) w.setError(error);
    else if (console && console.error) console.error(error);
  }

});