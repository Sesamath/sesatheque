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
 * @file Format d'une Ref, pouvant être utilisé comme enfant d'un Arbre
 */

/* global define, module*/

var filters = {

  /**
   * Retourne le tableau passé en argument ou un tableau vide si l'argument n'était pas un Array
   * @param {Array} arg L'array à controler
   * @returns {Array}
   */
  array : function (arg) {
    return (arg instanceof Array) ? arg : [];
  },

  /**
   * Retourne la chaine passée en argument ou une chaine vide
   * si l'argument est undefined ou ne peut pas être casté avec String()
   * @param arg
   * @returns {string}
   */
  string : function (arg) {
    var retour = '';
    if (typeof arg === 'string') retour = arg;
    else if (arg) {
      retour = String(arg);
      if (retour === 'undefined' || retour === '[object Object]') retour = ''
    }
    return retour;
  },

  /**
   * Retourne l'entier positif fourni ou 0
   * @param {number|string} arg
   * @returns {number}
   */
  int : function (arg) {
    var int = parseInt(arg, 10);
    if (int < 1 || int != arg) int = 0;
    return int
  },

  /**
   * Retourne un objet Date (on tente un cast si on nous fourni une string ou un entier) ou undefined
   * @param arg
   * @returns {Date|undefined}
   */
  date : function (arg) {
    var retour;
    if (arg instanceof Date) retour = arg;
    else if (arg && (typeof arg === 'string' || typeof arg === 'number')) retour = new Date(arg);
    return retour
  }
}

// suivant que l'on est coté serveur ou client
if (typeof define === 'function') define(filters);
else if (typeof module === 'object') module.exports = filters;
// sinon on est chargé tel quel et ce que l'on défini ici se retrouve dans l'espace de nom global
