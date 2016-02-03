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

var FormFieldGroup = require('./FormFieldGroup')

function Form(obj) {
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
  }

  if (obj.name) {
    /**
     * @type {string}
     * @default undefined
     */
    this.name = obj.name
  }

  /**
   * post|get
   * @type {string}
   * @default post
   */
  this.method = 'post'
  if (typeof obj.method === 'string' && obj.method.toLowerCase() === 'get') this.method = 'get'

  /**
   * Liste de FormFieldGroup
   * @type {FormFieldGroup[]}
   */
  this.groups = []
  if (obj.groups && obj.groups.length) {
    for (var i = 0; i < obj.groups.length; i++) {
      this.addGroup(obj.groups[i])
    }
  }
}

/**
 * Ajoute un groupe de champs
 * @param {object|FormFieldGroup} group
 * @returns {FormFieldGroup}
 */
Form.prototype.addGroup = function addGroup(group) {
  var fieldGroup = new FormFieldGroup(group)
  this.groups.push(fieldGroup)
  
  return fieldGroup
}

/**
 * Ajoute un champ dans le dernier groupe de champs (le créé si y'en a pas ou si inNewGroup)
 * @param {object|FormField} field
 * @param {boolean} [inNewGroup=false]
 * @returns {FormField}
 */
Form.prototype.addField = function addField(field, inNewGroup) {
  var nb = this.groups.length
  var fieldGroup
  if (inNewGroup) {
    fieldGroup = this.addGroup()
  } else if (nb) {
    fieldGroup = this.groups[nb]
  } else {
    fieldGroup = this.addGroup()
  }

  return fieldGroup.addField(field)
}

/**
 * Ajoute un bouton submit
 * @param {string} value texte du bouton
 * @param {string} [id] id de l'input
 * @param {string} [label] label qui serait ajouté au fieldset du submit
 * @param {string} className
 */
Form.prototype.addSubmit = function(value, id, label, className) {
  var group = {}
  if (label) group.label = label
  var fieldGroup = this.addGroup(group)
  var submit = {
    value:value,
    widget:'submit'
  }
  if (id) submit.id = id
  if (className) submit.className = className
  fieldGroup.addField(submit)
}

module.exports = Form
