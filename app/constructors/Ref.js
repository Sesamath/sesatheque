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
 * Définition d'une référence à une ressource, que l'on peut rencontrer dans les feuilles d'un arbre
 * Cela devient un alias sans oid (pas une entité)
 * @param {Object} [initObj={}] L'objet qui sert à initialiser un nouvel objet Ref, accepte un Alias
 * @constructor
 */
function Ref (initObj) {
  if (typeof initObj !== 'object') initObj = {}
  var ref = initObj.ref || parseInt(initObj.oid, 10) || undefined
  if (!ref && initObj.origine && initObj.idOrigine) ref = initObj.origine + '/' + initObj.idOrigine
  /**
   * L'oid de la ressource que l'on référence
   * @property ref
   * @type {Integer|string}
   */
  if (ref) this.ref = ref
  /**
   * Titre
   * @type {string}
   */
  this.titre = (initObj.titre && typeof initObj.titre === 'string') ? initObj.titre : 'Sans titre'
  /**
   * Résumé (pour l'élève)
   * @type {string}
   */
  this.resume = (initObj.resume && typeof initObj.resume === 'string') ? initObj.resume : ''
  /**
   * Commentaires (pour le formateur)
   * @type {string}
   */
  this.commentaires = (initObj.commentaires && typeof initObj.commentaires === 'string') ? initObj.commentaires : ''
  /**
   * Le type qui permet de savoir à quel type de contenu s'attendre, ou quel picto afficher
   * @type {string}
   */
  if (initObj.type) this.type = initObj.type
  /**
   * Un ou des id de catégorie(s) éventuel (pour un picto)
   * @type {Array}
   */
  if (Array.isArray(initObj.categories)) this.categories = initObj.categories
  /**
   * True si public (sinon il faut être authentifié pour lire la ressource)
   * @type {boolean}
   */
  this.public = (initObj.public || initObj.restriction === 0)
  /**
   * Éventuelle clé de lecture, pour que des élèves puissent lire
   * la ressource non publique si leur prof la leur affecte
   */
  if (!this.public && initObj.cle) this.cle = initObj.cle
  /**
   * L'id de la sesathèque concernée
   * @type {string}
   */
  if (initObj.baseId) this.baseId = initObj.baseId
}

/**
 * Cast en string d'une ref (son titre)
 * @returns {string}
 */
Ref.prototype.toString = function () {
  return this.titre
}

module.exports = Ref
