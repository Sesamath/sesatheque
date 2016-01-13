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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'
define('tools/formEditor', [], function () {
  /**
   * Retourne un control-group avec label
   * @private
   * @memberOf tools/formEditor
   * @param {Element} [parent]  Le parent (si non fourni on ajoutera un div.form-group à la fin du form
   * @param {object}  [options] On utilise label, required, remarque, wrapperAttributes
   * @returns {Element} Le div.control-group pour y mettre un input
   */
  function addWrapper(parent, options) {
    if (!parent) parent = addFormGroup()
    var divAttrs = options.wrapperAttributes || {}
    if (!divAttrs.class) divAttrs.class += " control-group"
    else divAttrs.class = "control-group"
    var wrapper = S.addElement(parent, 'div', divAttrs)
    if (options.label) {
      var label = S.addElement(wrapper, 'label', {}, options.label)
      if (options.required) S.addElement(label, 'span', {class:"required", title:"Ce champ est obligatoire"}, "*")
      if (options.remarque) S.addElement(label, 'span', {class:"remarque"}, options.remarque)
    }

    return wrapper
  }

  // Méthodes exportées

  /**
   * Ajoute un element quelconque avec l'emballage qui va bien pour le form ressource
   * @memberOf tools/formEditor
   * @param {Element} [parent]  Le parent (si non fourni on ajoutera un div.form-group à la fin du form
   * @param {string}  tag       Le tag de l'élément html à ajouter
   * @param {object}  attrs     Les attributs de l'élément tag
   * @param {object}  [options] On regarde label, required, remarque, wrapperAttributes
   * @returns {Element} L'élément ajouté
   */
  function addElement(parent, tag, attrs, options) {
    var container = S.addElement(addWrapper(parent, options), 'div', {class:"input-group " +tag})

    return S.addElement(container, tag, attrs)
  }

  /**
   * Ajoute un div.form-group à l'élément (ou avant / après élément) ou au form
   * @memberOf tools/formEditor
   * @param {Element} [element]  Le parent (si non fourni on ajoutera un div.form-group à la fin du form
   * @param {string}  [position] Si after|before|firstChild|firstSiblings, on positionne le div en frère de element à la position indiquée
   * @returns {Element} Le div.form-group
   */
  function addFormGroup(element, position) {
    if (!element) element = document.getElementById("formRessource")
    if (!element) {
      element = document.wd.getElementsByTagName("form")
      if (element.length) element = element[0]
      else throw new Error("Aucun form dans la page")
    }
    var addMethod = S.addElement
    if (element && position) {
      if (position === "after") addMethod = S.addElementAfter
      else if (position === "before") addMethod = S.addElementBefore
      else if (position === "firstSibling") addMethod = S.addElementFirstSibling
      else if (position === "firstChild") addMethod = S.addElementFirstChild
    }

    return addMethod(element, 'div', {class:"form-group"})
  }

  /**
   * Ajoute un groupe de Checkboxes avec l'emballage qui va bien pour le form ressource
   * @memberOf tools/formEditor
   * @param {Element} [parent]   Le parent (si non fourni on ajoutera un div.form-group à la fin du form
   * @param {string}  name       Le nom du groupe de checkboxes (qui auront chacun un name="{nom}[{i}]", sauf s'il n'y en qu'un, pas de [i] dans ce cas)
   * @param {object}  [options]  On regarde label, required, remarque, wrapperAttributes
   * @param {Array}   checkboxes Une liste d'item avec {label, value, [id], [checked]}, checked sera imposé à "checked" si true après cast booléen
   * @returns {Element} Le div avec tous les inputs
   */
  function addCheckboxes(parent, name, options, checkboxes) {
    var container = S.addElement(addWrapper(parent, options), 'div', {class:"input-group checkboxes"})
    if (checkboxes instanceof Array) {
      checkboxes.forEach(function (checkbox, i) {
        var id = checkbox.id || S.getNewId()
        var label = S.addElement(container, 'label', {for:id}, checkbox.label)
        var attrs = {type:"checkbox", id:id, value:checkbox.value}
        // on ne renvoie un tableau qui si y'en a plusieurs
        if (checkboxes.length > 1) attrs.name = name +"[" +i +"]"
        else attrs.name = name
        if (checkbox.checked) attrs.checked = "checked"
        S.addElement(label, 'input', attrs)
      })
    }

    return container
  }

  /**
   * Ajoute un input avec l'emballage qui va bien pour le form ressource
   * @memberOf tools/formEditor
   * @param {Element} [parent]  Le parent (si non fourni on ajoutera un div.form-group à la fin du form
   * @param {object}  [attrs]   Les attributs éventuels de l'input
   * @param {object}  [options] On regarde label, required, remarque, wrapperAttributes
   * @returns {Element} L'input text
   */
  function addInputText(parent, attrs, options) {
    var container = S.addElement(addWrapper(parent, options), 'div', {class:"input-group text"})
    if (!attrs) attrs = {}
    attrs.type = "text"

    return S.addElement(container, 'input', attrs)
  }

  /**
   * Ajoute un select avec l'emballage qui va bien pour le form ressource
   * @memberOf tools/formEditor
   * @param {Element} [parent]  Le parent (si non fourni on ajoutera un div.form-group à la fin du form
   * @param {object}  [attrs]   Les attributs éventuels du select
   * @param {object}  [options] On regarde label, required, remarque, wrapperAttributes
   * @param {Array}   choix   Les attributs des tag option à mettre, content sera pris pour le contenu text et viré des attributs,
   *                            selected sera imposé à "selected" si le cast booléen vaut true
   * @returns {Element} Le select
   */
  function addSelect(parent, attrs, options, choix) {
    var container = S.addElement(addWrapper(parent, options), 'div', {class:"input-group select"})
    if (!attrs) attrs = {}
    var select = S.getElement('select', attrs)
    if (choix instanceof Array) {
      choix.forEach(function (optionAttrs) {
        var content
        if (optionAttrs.content) {
          content = optionAttrs.content
          delete optionAttrs.content
        }
        if (optionAttrs.selected) optionAttrs.selected = "selected"
        else delete optionAttrs.selected
        S.addElement(select, 'option', optionAttrs, content)
      })
    }
    container.appendChild(select)

    return select
  }

  /**
   * Ajoute un textarea avec l'emballage qui va bien pour le form ressource
   * @memberOf tools/formEditor
   * @param {Element} [parent]  Le parent (si non fourni on ajoutera un div.form-group à la fin du form
   * @param {object}  [attrs]   Les attributs éventuels de l'input
   * @param {object}  [options] On regarde label, required, remarque, wrapperAttributes
   * @returns {Element} Le textarea
   */
  function addTextarea(parent, attrs, options) {
    var container = S.addElement(addWrapper(parent, options), 'div', {class:"input-group textarea"})

    return S.addElement(container, 'textarea', attrs, options.content || "")
  }

  var S = window.sesamath

  return {
    addCheckboxes: addCheckboxes,
    addElement   : addElement,
    addFormGroup : addFormGroup,
    addInputText : addInputText,
    addSelect    : addSelect,
    addTextarea  : addTextarea
  }
})