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

function FormField(obj) {
  if (typeof obj !== 'object') obj = {}
  if (obj.id) {
    /**
     * @type {string}
     * @default undefined
     */
    this.id = obj.id
  }

  if (obj.className) {
    /**
     * @type {string}
     * @default undefined
     */
    this.className = obj.className
  }

  if (obj.label) {
    /**
     * @type {string}
     * @default undefined
     */
    this.label = obj.label
    if (obj.labelInfo) {
      /**
       * Un complément de label éventuel (qui pourra être stylé différemment pour un complément d'info sur le champ)
       * @type {string}
       * @default undefined
       */
      this.labelInfo = obj.labelInfo
    }
  }

  if (obj.name) {
    /**
     * @type {string}
     */
    this.name = obj.name
  }

  if (obj.attributes) {
    /**
     * @type {Attribute[]}
     * @default undefined
     */
    this.attributes = obj.attributes
  }

  if (obj.required) {
    /**
     * @type {boolean}
     * @default undefined
     */
    this.required = true
  }

  if (obj.readonly) {
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
  this.widget = obj.widget

  /**
   * @type {string|FormChoice[]}
   * @default ''
   */
  this.value = ''
  if (typeof obj.value === 'string' || typeof obj.value === 'number' || typeof obj.value === 'undefined') {
    // text par défaut
    if (!this.widget) this.widget = 'text'
    if (["text", "textarea", "submit", "button"].indexOf(this.widget) === -1) throw new Error("widget "+this.widget +" incompatible avec la valeur " +obj.value)
    this.value = obj.value || ''

  } else if (typeof obj.value === 'boolean') {
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
    if (obj.selectedValues === true) choice.selected = true
    // required a peu de sens, sinon pour obliger à cocher qqchose
    if (this.required) choice.required = true
    this.addChoice(choice)
    this.label = undefined

  } else if (obj.value instanceof Array) {
    // une liste, checkboxes par défaut
    if (!this.widget) this.widget = 'checkboxes'
    if (["select", "checkboxes", "radios"].indexOf(this.widget) === -1) throw new Error("widget incompatible avec la valeur")
    this.value = []
    if (obj.value.length) {
      for (i = 0; i < obj.value.length; i++) {
        this.addChoice(obj.value[i])
      }
    }
  }

  if (obj.selectedValues) {
    /**
     * @type {string[]}
     * @default undefined
     */
    this.selectedValues = []
    // cast de chaque élément en string
    if (obj.selectedValues instanceof Array) {
      for (var i = 0; i < obj.selectedValues.length; i++) {
        this.selectedValues.push(obj.selectedValues[i] +'')
      }
    } else {
      this.selectedValues.push(obj.selectedValues +'')
    }
  }
}

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
      this.selectedValues.indexOf(choice.value +'') > -1
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