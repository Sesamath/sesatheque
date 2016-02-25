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

var FormGroup = require('./FormGroup')

/**
 * Formulaire (objet formaté pour la vue form)
 * @param {object} [values] Des valeurs d'initialisation
 * @constructor
 */
function Form(values) {
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
  }

  if (values.name) {
    /**
     * @type {string}
     * @default undefined
     */
    this.name = values.name
  }

  /**
   * post|get
   * @type {string}
   * @default post
   */
  this.method = 'post'
  if (typeof values.method === 'string' && values.method.toLowerCase() === 'get') this.method = 'get'

  /**
   * Liste de FormGroup
   * @type {FormGroup[]}
   */
  this.groups = []
  if (values.groups && values.groups.length) {
    for (var i = 0; i < values.groups.length; i++) {
      this.addGroup(values.groups[i])
    }
  }
} // Form

/**
 * Ajoute un groupe de champs
 * @param {object|FormGroup} group
 * @returns {FormGroup}
 */
Form.prototype.addGroup = function addGroup(group) {
  var formGroup = new FormGroup(group)
  this.groups.push(formGroup)
  
  return formGroup
}

/**
 * Ajoute un champ dans le dernier groupe de champs (le créé si y'en a pas ou si inNewGroup)
 * @param {object|FormField} field
 * @param {boolean} [inNewGroup=false]
 * @returns {FormField}
 */
Form.prototype.addField = function addField(field, inNewGroup) {
  var nb = this.groups.length
  var formGroup
  if (inNewGroup || !nb) {
    formGroup = this.addGroup()
  } else {
    formGroup = this.groups[nb]
  }

  return formGroup.addField(field)
}

/**
 * Ajoute un bouton submit
 * @param {string} value texte du bouton
 * @param {string} [id] id de l'input
 * @param {string} [label] label qui serait ajouté au fieldset du submit
 * @param {string} className
 */
Form.prototype.addSubmit = function addSubmit(value, id, label, className) {
  var group = {}
  if (label) group.label = label
  var formGroup = this.addGroup(group)
  var submit = {
    value:value,
    widget:'submit'
  }
  if (id) submit.id = id
  if (className) submit.className = className
  formGroup.addField(submit)
}

/**
 * Retourne le champ d'id demandé s'il existe (undefined sinon)
 * @param {string} id
 * @returns {FormGroup}
 */
Form.prototype.getFieldById = function getFieldById(id) {
  var field
  if (id) {
    this.groups.some(function (formGroup) {
      return formGroup.fields.some(function (formField) {
        if (formField.id === id) {
          field = formField
          return true
        }
      })
    })
  }
  return field
}

/**
 * Retourne le champ ayant le name demandé s'il existe (undefined sinon)
 * @param {string} name
 * @returns {FormField}
 */
Form.prototype.getFieldByName = function getFieldByName(name) {
  var field
  if (name) {
    this.groups.some(function (formGroup) {
      return formGroup.fields.some(function (formField) {
        if (formField.name === name) {
          field = formField
          return true
        }
      })
    })
  }
  return field
}

/**
 * Retourne le groupe ayant le name demandé s'il existe (undefined sinon)
 * @param {string} name
 * @returns {FormGroup}
 */
Form.prototype.getGroupByName = function getGroupByName(name) {
  var group
  if (name) {
    this.groups.some(function (formGroup) {
      if (formGroup.name === name) {
        group = formGroup
        return true
      }
    })
  }
  return group
}

/**
 * Retourne le groupe d'id demandé s'il existe (undefined sinon)
 * @param {string} id
 * @returns {FormGroup}
 */
Form.prototype.getGroupById = function getGroupById(id) {
  var group
  if (id) {
    this.groups.some(function (formGroup) {
      if (formGroup.id === id) {
        group = formGroup
        return true
      }
    })
  }
  return group
}


module.exports = Form
