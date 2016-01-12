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
 * @file Collection de fonctions permettant de filtrer une variable d'après le type attendu
 */

/* global define, module*/

var filters = {};

/**
 * Retourne le tableau passé en argument ou un tableau vide si l'argument n'était pas un Array
 * @param {Array} arg L'array à controler
 * @returns {Array}
 */
filters.array = function (arg) {
  return (arg instanceof Array) ? arg : [];
};

/**
 * Retourne le tableau passé en argument ou un tableau vide si l'argument n'était pas un Array
 * Tous les éléments qui ne sont pas des entiers positifs (0 accepté) seront éliminés
 * @param {Array} arg L'array à controler
 * @returns {Array}
 */
filters.arrayInt = function (arg) {
  arg = filters.array(arg);
  // IE < 9 connait pas filter
  if (arg.filter) {
    arg = arg.filter(function (elt) {
      return (parseInt(elt, 10) === elt && elt > -1);
    });
  }
  return arg;
};

/**
 * Retourne le tableau passé en argument ou un tableau vide si l'argument n'était pas un Array
 * Tous les éléments qui ne sont pas des entiers positifs seront éliminés
 * @param {Array} arg L'array à controler
 * @returns {Array}
 */
filters.arrayString = function (arg) {
  arg = filters.array(arg);
  // IE < 9 connait pas filter
  if (arg.filter) {
    arg = arg.filter(function (elt) {
      return (typeof elt === 'string');
    });
  }
  return arg;
};


/**
 * Retourne l'entier positif fourni ou 0
 * @param {number|string} arg
 * @returns {number}
 */
filters.int = function (arg) {
  var int = 0;
  if (typeof arg === 'string') int = parseInt(arg, 10);
  else if (typeof arg === 'number') int = Math.floor(arg);
  if (int < 1 || int != arg) int = 0;
  return int;
};

/**
 * Retourne un objet Date (on tente un cast si on nous fourni une string ou un entier) ou undefined
 * @param arg
 * @returns {Date|undefined}
 */
filters.date = function (arg) {
  var retour;
  if (arg instanceof Date) retour = arg;
  else if (arg && (typeof arg === 'string' || typeof arg === 'number')) retour = new Date(arg);
  return retour;
};

/**
 * Retourne la chaine passée en argument ou une chaine vide
 * si l'argument est undefined ou ne peut pas être casté avec String()
 * @param arg
 * @returns {string}
 */
filters.string = function (arg) {
  var retour = '';
  if (typeof arg === 'string') retour = arg;
  else if (arg) {
    retour = String(arg);
    if (retour === 'undefined' || retour === '[object Object]') retour = '';
  }
  return retour;
};

// suivant que l'on est coté serveur ou client
if (typeof define === 'function') define('filters', [], filters);
else if (typeof module === 'object') module.exports = filters;
// sinon on est chargé tel quel et ce que l'on défini ici se retrouve dans l'espace de nom global
