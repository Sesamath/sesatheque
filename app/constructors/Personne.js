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
 * Constructeur Personne
 * @constructor
 * @private
 * @param {Object} initObj Un objet ayant des propriétés d'une personne
 */
function Personne (initObj) {
  if (!initObj) initObj = {}
  /**
   * L'identifiant de la personne dans la sesatheque
   * @type {string}
   * @default undefined
   */
  this.oid = initObj.oid || undefined
  /**
   * L'identifiant unique authBaseId/oid, où authBaseId est le nom du authClient
   * @type {string}
   */
  this.pid = initObj.pid || undefined
  /**
   * Date de dernière vérification sur le serveur sso (mis au login, inexistant sinon), non stocké
   * @type {Date}
   * @default undefined
   */
  this._lastCheck = initObj._lastCheck || undefined
  /**
   * Prénom
   * @type {string}
   * @default ''
   */
  this.prenom = initObj.prenom || ''
  /**
   * Nom
   * @type {string}
   * @default ''
   */
  this.nom = initObj.nom || ''
  /**
   * Adresse email
   * @type {string}
   * @default ''
   */
  this.email = initObj.email || ''
  /**
   * Liste des roles {role:boolean}
   * @type {Object}
   * @default {}
   */
  this.roles = initObj.roles || {}
  /**
   * Liste des permissions, calculée d'après les roles au create + beforeStore (pour les avoir toujours ok en cache)
   * @type {Object}
   * @default undefined
   */
  this.permissions = initObj.permissions || undefined
  /**
   * groupes dont on est membre (on peut y publier)
   * @type {string[]}
   * @default undefined
   */
  this.groupesMembre = initObj.groupesMembre || []
  /**
   * groupes dont on suit les publications
   * @type {string[]}
   * @default undefined
   */
  this.groupesSuivis = initObj.groupesSuivis || []

  if (initObj.dateCreation) {
    /**
     * date de création
     * @type {Date}
     */
    this.dateCreation = typeof initObj.dateCreation === 'string' ? new Date(initObj.dateCreation) : initObj.dateCreation
  } else {
    this.dateCreation = new Date()
  }
  /**
   * D'autres propriétés regroupées dans cet objet, pour laisser la possibilité à des plugins d'ajouter facilement des infos,
   * @type {Object}
   * @default undefined
   */
  this.infos = initObj.infos || undefined
}

/**
 * Cast en string d'une Personne (prénom nom)
 * @returns {string}
 */
Personne.prototype.toString = function () {
  return this.prenom + ' ' + this.nom
}

module.exports = Personne
