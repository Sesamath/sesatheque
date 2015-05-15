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
"use strict";

/**
 * @file Format d'une Ref, référence à une ressource, pouvant être utilisé comme enfant d'un arbre
 */

/* global define, module*/

// suivant que l'on est coté serveur ou client
if (typeof define === 'function') define(Ref);
else if (typeof module === 'object') module.exports = Ref;
// sinon on est chargé tel quel et ce que l'on défini ici se retrouve dans l'espace de nom global

/**
 * Définition d'une référence à une ressource, que l'on peut rencontrer dans les feuilles d'un arbre
 * @param {Object} [initObj={}] L'objet qui sert à initialiser un nouvel objet Ref
 * @constructor
 */
function Ref(initObj) {
  if (! initObj instanceof Object) initObj = {}
  /**
   * L'oid de la ressource que l'on référence
   * @type {number}
   */
  this.ref = parseInt(initObj.ref, 10) || undefined;
  /**
   * Le nom
   * @type {string}
   */
  this.titre = (initObj.titre && typeof initObj.titre === 'string') ? initObj.titre : '';
  /**
   * Le typeTechnique qui permet de savoir à quel type de contenu s'attendre, ou quel picto afficher
   * @type {string}
   */
  this.typeTechnique = (initObj.typeTechnique && typeof initObj.typeTechnique === 'string') ? initObj.typeTechnique : 'arbre';
  /**
   * Un id de catégorie éventuel (pour un picto)
   * @type {number}
   */
  this.categories = (initObj.categories && initObj.categories instanceof Array ) ? initObj.categories : [];
  /**
   * Les enfants éventuels, un tableaux d'objets qui peuvent être un mix de Ref et Ressource
   * @type {Object[]}
   */
  if (initObj.enfants && initObj.enfants instanceof Array) this.enfants = initObj.enfants;
}

/**
 * Cast en string d'une ref (son titre)
 * @returns {string}
 */
Ref.prototype.toString = function () {
  return this.titre;
}
