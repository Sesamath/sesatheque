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

var _ = require('lodash')
var Form = require('../ressource/srcClient/constructors/Form')

module.exports = function () {
  /**
   * Ajoute un choix à une liste de checkboxes / radios
   * @param {Choice[]}  choices         La liste de choix courante
   * @param {string}    label           Le label à afficher
   * @param {string}    key             Le nom du champ parent (attribut name, on ajoutera l'index)
   * @param {string}    value           La valeur
   * @param {string[]}  selectedValues  Une liste de valeurs à cocher à l'affichage
   */
  function addChoice(choices, label, key, value, selectedValues) {
    var i = choices.length
    var choice = {
      value: value,
      id: '' +key +i,
      label: label,
      name : key + '[' + i + ']'
    }
    // et on ajoute les selected s'il y en a
    if (selectedValues && selectedValues.length && selectedValues.indexOf(value) > -1) {
      choice.selected = true
    }
    choices.push(choice)
  }

  /**
   * Retourne la propriété choices pour select/checkboxes/radios (ne gère pas le select multiple)
   * @private
   * @param {string}            key       Le nom de la propriété
   * @param {Array[]}           values    La liste de choix possibles [[valeur,label],[…],…]
   * @param {string[]|number[]} selected  Les valeurs à présélectionner (tableau d'une seule valeur pour un sélect)
   * @param {boolean}           isUnique  Si c'est un select et pas des checkbox
   *                                      (dans ce cas on ajoute pas de propriété name sur chaque choix)
   * @returns {Array}
   */
  function getChoices(key, values, widget, selected) {
    var choices = []
    values.forEach(function (value) {
      var val = value[0]
      var label = value[1] || value[0]
      addChoice(choices, label, key, val, selected)
    })

    return choices
  }

  /**
   * Service de gestion des formulaires
   * @service $form
   */
  var $form = {}

  /**
   * Ajoute un champ à fieldGroup.fields si fourni, et le retourne.
   * Ne gère pas encore les select multiple et les radios
   * Si value est un tableau et que widget n'est pas précisé ce sera checkboxes (préciser select si besoin)
   * Si value est une chaine ou un nombre, widget vaudra text (préciser textarea si besoin)
   * Si value est un booléen il sera dans une checkbox unique
   * @param {object} form L'objet form que l'on va augmenter et qui sera passé à la vue
   * @param {string} label
   * @param {string}                      key Le nom de la propriété qui sera ajouté (aussi utilisé pour le name et l'id)
   * @param {string|number|boolean|Array} value
   * @param {object}                      [options] Propriétés possibles :
   *                                        {boolean} required : pour ajouter l'attribut au html
   *                                        {boolean} isUnique : utile seulement si value est un array et que widget n'est pas précisé
   *                                                   (si true impose select, sinon checkboxes)
   *                                        {string}  widget : text|textarea|select|radios|checkboxes|submit
   *                                        {string[]} selected : liste des valeurs à précocher/sélectionner
   */
  $form.addField = function addField(fieldGroup, label, key, value, options) {
    if (!options) options = {}
    var field = {
      id   : options.id || key, // le template ajoutera un préfixe de son choix s'il veut
      label: label,
      name: key,
      widget : 'text'
    }
    if (options.required) field.required = true
    // les différents cas possibles
    if (value instanceof Array) {
      if (!options.widget) {
        options.widget = options.isUnique ? 'select' : 'checkboxes'
      }
      field.widget = options.widget
      field.choices = getChoices(key, value, field.widget, options.selected)
    } else if (typeof value === "boolean") {
      // une seule checkbox
      field.choices = getChoices(key, [value], 'checkboxes', options.selected)
    } else if (typeof value === "string" || typeof value === "number") {
      // input text ou textarea
      if (["textarea", "submit", "button"].indexOf(options.widget) > -1) field.widget = options.widget
      field.value = value
    } else {
      log.error(new Error("value incorrecte pour $form.addField " + typeof value))
    }
    if (fieldGroup && _.isArray(fieldGroup.fields)) fieldGroup.fields.push(field)

    return field
  }

  /**
   * Ajoute un champ à form dans le groupe d'id groupeId et le retourne
   * @param {Form} form
   * @param {string} groupId id du groupe dans lequel ajouter le champ
   * @param {string} [label]
   * @param {string} [className]
   * @param {Field[]} [fields]
   * @returns {FieldGroup}
   */
  $form.addGroup = function (form, id, label, className, fields) {
    var fieldGroup = {
      fields : fields || []
    }
    if (id) fieldGroup.id = id
    if (label) fieldGroup.label = label
    if (className) fieldGroup.className = className
    if (form && _.isArray(form.groups)) form.groups.push(fieldGroup)

    return fieldGroup
  }

  /**
   * Ajoute un bouton submit
   * @param form
   * @param value
   * @param id
   * @param label
   * @param className
   */
  $form.addSubmit = function(form, value, id, label, className) {
    var group = $form.addGroup(form, null, label, className)
    $form.addField(group, null, null, value, {widget:'submit'})
  }

  /**
   * Retourne un form vide
   * @param {object|Form} obj
   * @returns {Form}
   */
  $form.get = function (obj) {
    return new Form(obj)
  }

  return $form
}
