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

'use strict';
define('tools/formEditor', [], function () {
  /**
   * Retourne un control-group avec label
   * @private
   * @memberOf tools/formEditor
   * @param {Element} [parent]  Le parent (si non fourni on ajoutera un div.form-group à la fin du form
   * @param {object}  [options] On utilise label, required et remarque
   * @returns {Element} Le div.control-group pour y mettre un input
   */
  function getWrapper(parent, options) {
    if (!parent) parent = addFormGroup();
    var wrapper = S.addElement(parent, 'div', {class:"control-group"});
    if (options.label) {
      var label = S.addElement(wrapper, 'label', {}, options.label);
      if (options.required) S.addElement(label, 'span', {class:"required", title:"Ce champ est obligatoire"}, "*");
      if (options.remarque) S.addElement(label, 'span', {class:"remarque"}, options.remarque);
    }

    return wrapper;
  }

  // Méthodes exportées

  /**
   * Ajoute un element quelconque avec l'emballage qui va bien pour le form ressource
   * @memberOf tools/formEditor
   * @param {Element} [parent]  Le parent (si non fourni on ajoutera un div.form-group à la fin du form
   * @param {string}  tag       Le tag de l'élément html à ajouter
   * @param {object}  attrs     Les attributs de l'élément tag
   * @param {object}  [options] On utilise éventuellement label et required
   * @returns {Element} L'élément ajouté
   */
  function addElement(parent, tag, attrs, options) {
    var container = S.addElement(getWrapper(parent, options), 'div', {class:"input-group " +tag});

    return S.addElement(container, tag, attrs);
  }

  /**
   * Ajoute un div.form-group à l'élément (ou avant / après élément) ou au form
   * @memberOf tools/formEditor
   * @param {Element} [element]  Le parent (si non fourni on ajoutera un div.form-group à la fin du form
   * @param {string}  [position] Si after|before|firstChild|firstSiblings, on positionne le div en frère de element à la position indiquée
   * @returns {Element} Le div.form-group
   */
  function addFormGroup(element, position) {
    if (!element) element = document.getElementById("formRessource");
    if (!element) {
      element = document.wd.getElementsByTagName("form");
      if (element.length) element = element[0];
      else throw new Error("Aucun form dans la page");
    }
    var addMethod = S.addElement;
    if (element && position) {
      if (position === "after") addMethod = S.addElementAfter;
      else if (position === "before") addMethod = S.addElementBefore;
      else if (position === "firstSibling") addMethod = S.addElementFirstSibling;
      else if (position === "firstChild") addMethod = S.addElementFirstChild;
    }

    return addMethod(element, 'div', {class:"form-group"});
  }

  /**
   * Ajoute un input avec l'emballage qui va bien pour le form ressource
   * @memberOf tools/formEditor
   * @param {Element} [parent]  Le parent (si non fourni on ajoutera un div.form-group à la fin du form
   * @param {object}  [attrs]   Les attributs éventuels de l'input
   * @param {object}  [options] On utilise éventuellement label et required
   * @returns {Element} L'input text
   */
  function addInputText(parent, attrs, options) {
    var container = S.addElement(getWrapper(parent, options), 'div', {class:"input-group text"});
    if (!attrs) attrs = {};
    attrs.type = "text";

    return S.addElement(container, 'input', attrs);
  }

  /**
   * Ajoute un textarea avec l'emballage qui va bien pour le form ressource
   * @memberOf tools/formEditor
   * @param {Element} [parent]  Le parent (si non fourni on ajoutera un div.form-group à la fin du form
   * @param {object}      [attrs]   Les attributs éventuels de l'input
   * @param {object}      [options] On utilise label, required et content
   * @returns {Element} Le textarea
   */
  function addTextarea(parent, attrs, options) {
    var container = S.addElement(getWrapper(parent, options), 'div', {class:"input-group textarea"});

    return S.addElement(container, 'textarea', attrs, options.content || "");
  }

  var S = window.sesamath;

  return {
    addElement   : addElement,
    addFormGroup : addFormGroup,
    addInputText : addInputText,
    addTextarea  : addTextarea
  };
});