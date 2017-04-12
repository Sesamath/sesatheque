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

/**
 * Un groupe d'utilisateurs
 * @constructor
 * @private
 * @param {Object} initObj Un objet ayant des propriétés d'un groupe
 */
function Groupe (initObj) {
  if (!initObj || typeof initObj !== 'object') initObj = {}
  /**
   * L'identifiant interne à la sésathèque
   * @type {Integer}
   * @default undefined
   */
  this.oid = initObj.oid || undefined
  /**
   * Nom
   * @type {string}
   * @default ''
   */
  if (typeof initObj.nom === 'string') this.nom = initObj.nom.toLowerCase()
  else this.nom = ''
  /**
   * Description
   * @type {string}
   * @default ''
   */
  if (typeof initObj.description === 'string') this.description = initObj.description
  else this.description = ''
  /**
   * Tout le monde peut s'y inscrire
   * @type {boolean}
   * @default false
   */
  this.ouvert = !!initObj.ouvert
  /**
   * Visible dans la liste générale des groupes, tout le monde peut suivre ses publications
   * @type {boolean}
   */
  this.public = !!initObj.public
  /**
   * liste de pid de ceux qui peuvent gérer le groupe (le créateur et ceux à qui il a délégué la gestion)
   * @type {string[]}
   */
  this.gestionnaires = initObj.gestionnaires || []
  /**
   * @name creationDate
   * @type {Date}
   * @default undefined
   */
  if (initObj.creationDate) {
    if (typeof initObj.creationDate === 'string') this.creationDate = new Date(initObj.creationDate)
    else if (initObj.creationDate instanceof Date) this.creationDate = initObj.creationDate
  } // sinon, sera ajouté à l'écriture en Bdd
}

module.exports = Groupe
