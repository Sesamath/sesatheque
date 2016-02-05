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

//var _ = require('lodash')
var tools = require('../tools')
var Form = require('../ressource/srcClient/constructors/Form')

module.exports = function ($page) {
  /**
   * Service de gestion des formulaires
   * @service $form
   */
  var $form = {}

  /**
   * Ajoute un champ au form (dans le fieldGroup demandé ou un nouveau) et le retourne.
   * Wrapper de formGroup.addField
   * @param {Form}             form      L'objet form que l'on va augmenter et qui sera passé à la vue
   * @param {object|FormField} field     Propriétés du champ à créer (passer au moins name et value)
   * @param {object}           [options] options
   *                              si fieldGroup existe ses propriétés seront ajoutées au formGroup utilisé (trouvé ou créé)
   *                              si fieldGroupId existe on cherchera un FieldGroup correspondant dans form
   *                              sinon, si fieldGroupName existe idem
   *                              sinon (ou si on a pas trouvé de fieldGroup) on créera un nouveau FormGroup
   */
  $form.addField = function addField(form, field, options) {
    if (!options) options = {}
    var formGroup
    if (options.fieldGroupId) formGroup = form.getGroupById(options.fieldGroupId)
    if (options.fieldGroupName) formGroup = form.getGroupByName(options.fieldGroupName)
    if (!formGroup) formGroup = form.addGroup(options.fieldGroup)

    return formGroup.addField(field)
  }

  /**
   * Ajoute un token au form en hidden
   * @param {Form} form
   * @param {Context} context
   * @returns {string} Le token
   */
  $form.addToken = function (form) {
    var token = tools.getToken()
    var field = {
      name:'token',
      value:token,
      widget:'hidden'
    }
    form.addField(field)

    return token
  }

  /**
   * Retourne un form avec tous les champs dans le même groupe
   * @param {object|Form}          [formValues]
   * @param {object|FormGroup}     [groupValues]
   * @param {object[]|FormField[]} [fields]
   * @param {string}               [submitValue]
   * @returns {Form}
   */
  $form.construct = function (formValues, groupValues, fields, submitValue) {
    var form = new Form(formValues)
    var formGroupField = form.addGroup(groupValues)
    if (typeof fields === 'object' && !(fields instanceof Array)) fields = [fields]
    fields.forEach(function (field) {
      formGroupField.addField(field)
    })
    form.addSubmit(submitValue)

    return form
  }

  /**
   * Retourne un form vide
   * @param {object|Form} obj
   * @returns {Form}
   */
  $form.get = function (formValues) {
    return new Form(formValues)
  }

  /**
   * Affiche un formulaire
   * @param {Context} context
   * @param {object|Form} formValues
   * @param {object|FormGroup} groupValues
   * @param {object[]|FormField[]} fields
   * @param {string} submitValue
   * @param {string} pageTitle
   * @param {object} blocs
   */
  $form.print = function print(context, formValues, groupValues, fields, submitValue, pageTitle, blocs) {
    var contentBloc = $form.construct(formValues, groupValues, fields, submitValue)
    contentBloc.$view = 'form'
    $page.print(context, pageTitle, contentBloc, blocs)
  }

  return $form
}
