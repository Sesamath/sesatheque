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

var FormChoice = require('./FormChoice')
var _ = require('lodash')

/**
 * Un champ de FormGroup
 * @param {object} [values] Des valeurs d'initialisation
 * @constructor
 */
function FormField(values) {
  if (!values || typeof values !== 'object') values = {}
  if (values.id) {
    /**
     * @type {string}
     * @default undefined
     */
    this.id = values.id
  }

  if (values.className) {
    /**
     * @type {string}
     * @default undefined
     */
    this.className = values.className
  }

  if (values.label) {
    /**
     * @type {string}
     * @default undefined
     */
    this.label = values.label
    if (values.labelInfo) {
      /**
       * Un complément de label éventuel (qui pourra être stylé différemment pour un complément d'info sur le champ)
       * @type {string}
       * @default undefined
       */
      this.labelInfo = values.labelInfo
    }
  }

  if (values.name) {
    /**
     * @type {string}
     */
    this.name = values.name
  }

  if (values.attributes) {
    /**
     * @type {Attribute[]}
     * @default undefined
     */
    this.attributes = values.attributes
  }

  if (values.required) {
    /**
     * @type {boolean}
     * @default undefined
     */
    this.required = true
  }

  if (values.readonly) {
    /**
     * @type {boolean}
     * @default undefined
     */
    this.readonly = true
  }

  /**
   * Pourra être imposé par value
   * @type {string}
   * @default undefined
   */
  this.widget = values.widget

  /**
   * @type {string|FormChoice[]}
   * @default ''
   */
  this.value = ''
  if (typeof values.value === 'string' || typeof values.value === 'number' || typeof values.value === 'undefined') {
    // text par défaut
    if (!this.widget) this.widget = 'text'
    if (["text", "textarea", "submit", "button"].indexOf(this.widget) === -1) throw new Error("widget "+this.widget +" incompatible avec la valeur " +values.value)
    this.value = values.value || ''

  } else if (typeof values.value === 'boolean') {
    // oui / nom sous forme de checkbox
    this.widget = 'checkboxes'
    // faut mettre label et name sur le choice
    this.value = []
    var choice = {
      label:this.label,
      name : this.name,
      value: 'true'
    }
    if (this.readonly) choice.readonly = true
    if (values.selectedValues === true) choice.selected = true
    // required a peu de sens, sinon pour obliger à cocher qqchose
    if (this.required) choice.required = true
    this.addChoice(choice)
    this.label = undefined

  } else if (values.value instanceof Array) {
    // une liste, checkboxes par défaut
    if (!this.widget) this.widget = 'checkboxes'
    if (["select", "checkboxes", "radios"].indexOf(this.widget) === -1) throw new Error("widget incompatible avec la valeur")
    this.value = []
    if (values.value.length) {
      for (i = 0; i < values.value.length; i++) {
        this.addChoice(values.value[i])
      }
    }
  }

  if (values.selectedValues) {
    /**
     * @type {string[]}
     * @default undefined
     */
    this.selectedValues = []
    // cast de chaque élément en string
    if (values.selectedValues instanceof Array) {
      for (var i = 0; i < values.selectedValues.length; i++) {
        this.selectedValues.push(values.selectedValues[i] +'')
      }
    } else {
      this.selectedValues.push(values.selectedValues +'')
    }
  }
} // FormField

FormField.prototype.addChoice = function addChoice(choice) {
  if (!this.value instanceof Array) {
    this.value = []
  }
  var i = this.value.length
  // on propage name et id si nécessaire
  if (this.widget === 'radios') choice.name = this.name
  else if (this.widget === 'checkboxes' && !choice.name) choice.name = this.name + '[' + i + ']'
  if (this.id && !choice.id) choice.id = this.id +i
  // et on ajoute les selected s'il y en a (comparaison avec cast en string)
  if (
      choice.hasOwnProperty('value') &&
      this.selectedValues &&
      this.selectedValues.length &&
      _.includes(this.selectedValues, String(choice.value))
  ) {
    choice.selected = true
  }
  this.value.push(new FormChoice(choice))
}

module.exports = FormField

/**
 * Attributs d'un tag html
 * @typedef Attribute
 * @type {object}
 * @param {string} name
 * @param {string} value
 */