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

/**
 * Un élément de la propriété value d'un FormField ayant widget = select|radio|checkboxes (value est un array dans ce cas)
 * @param {object} [values] Des valeurs d'initialisation
 * @constructor
 */
function FormChoice (values) {
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

  /**
   * @type {string}
   * @default undefined
   */
  this.name = values.name

  if (values.selected) {
    /**
     * @type {boolean}
     * @default undefined
     */
    this.selected = true
  }

  /**
   * cast en string si number ou boolean fourni
   * @type {string}
   * @default ''
   */
  this.value = values.value || ''
  if (typeof this.value !== 'string') this.value += ''
}

module.exports = FormChoice
