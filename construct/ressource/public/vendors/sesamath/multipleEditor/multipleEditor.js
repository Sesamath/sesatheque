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

  function addChoices() {
    var divChoices = S.getElement('div');
    S.addText(divChoices, "Utiliser l'éditeur : ");
    S.addElement(divChoices, 'a', {onclick:multipleEditor.toSimple}, "simple");
    S.addElement(divChoices, 'a', {onclick:multipleEditor.toMathquill}, "équation");
    S.addText(divChoices, " - ");
    S.addElement(divChoices, 'a', {onclick:multipleEditor.toCkEditor}, "texte riche");
    $textarea.before(divChoices);
  }

  try {
    var w = window;
    var $ = w.jQuery;
    var wd = w.document;
    // raccourcis, si ça plante le catch gère
    var S = window.sesamath;
    var ST = S.sesatheque;

    var isInitDone = false;
    var foo = function () {};

    /**
     * Service pour insérer du mathquill
     * @service multipleEditor
     */
    var multipleEditor = {};

    // objets initialisé par init, globaux à ce module
    var current, onChangeCb, $textarea;

    /**
     * Initialise le choix de l'éditeur sur un textarea en créant un div dans container (qui sera créé dans options.container sinon)
     * @memberOf mqEditor
     * @param {Element}        [textarea]  Un textarea avec le contenu à éditer
     * @param {object}         [config]    config qui peut contenir les propriétés
     *                                       - editor : préciser simple|mathquill|ckeditor (simple par défaut)
     *                                       - choices : pour restreindre à certains éditeurs (['simple', 'mathquill', 'ckeditor'] par défaut)
     *                                       - noChoice : mettre true pour empêcher de changer d'éditeur
     *                                       - mathquill (liste de noms de boutons, cf mqEditor)
     *                                       - memoCurrent : une fonction qui sera appelée avec le nom de l'éditeur à chaque changement
     * @param {errorCallback}  [next]
     */
    multipleEditor.init = function (textarea, config, next) {
      $(function () {
        if (!next) next = foo;
        if (!config) config = {};
        if (!config.editor) config.editor = "simple";
        if (!config.choices) config.choices = ['simple', 'mathquill', 'ckeditor'];
        onChangeCb = config.memoCurrent || foo;
        $textarea = $(textarea);
        if (!config.noChoice) {
          addChoices();
        }
        isInitDone = true;
        current = config.editor;
        switch (config.editor) {
          case "simple":
            next();
            break;
          case "mathquill":
            multipleEditor.toMathquill(next);
            break;
          case "ckeditor":
            multipleEditor.toCkEditor(next);
            break;
          default :
            throw new Error("Éditeur " +current +" non géré");
        }
      });
    };

    /**
     * Cache les boutons mathquill
     * @memberOf mqEditor
     */
    multipleEditor.toCkEditor = function () {
      if (!isInitDone) throw new Error("Il faut initialiser le choix de l'éditeur avant");
    };

    /**
     * Affiche les boutons mathquill
     * @memberOf mqEditor
     */
    multipleEditor.toMathquill = function () {
      if (!isInitDone) throw new Error("Il faut initialiser le choix de l'éditeur avant");
    };

    /**
     * Cache ou affiche les boutons mathquill
     * @memberOf mqEditor
     */
    multipleEditor.toSimple = function () {
      if (!isInitDone) throw new Error("Il faut initialiser le choix de l'éditeur avant");
    };

    return multipleEditor;

  } catch (error) {
    if (typeof ST !== "undefined" && ST.addError) ST.addError(error);
    else if (typeof console !== 'undefined' && console.error) {
      console.error("Il fallait probablement appeler init avant ce module");
      console.error(error);
    }
  }

});
