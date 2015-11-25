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

// suivant que l'on est coté serveur ou client
if (typeof define === 'function') define(function () {return Ref;});
else if (typeof module === 'object') module.exports = Ref;
// sinon on est chargé tel quel et ce que l'on défini ici se retrouve dans l'espace de nom global
// pas trouvé comment documenté correctement un constructeur dans une fonction anonyme auto-exécutée…

/* global define, module*/

/**
 * Définition d'une référence à une ressource, que l'on peut rencontrer dans les feuilles d'un arbre
 * @param {Object} [initObj={}] L'objet qui sert à initialiser un nouvel objet Ref, accepte un Alias
 * @constructor
 */
function Ref(initObj) {
  if (!initObj instanceof Object) initObj = {};
  /**
   * L'oid de la ressource que l'on référence
   * @property ref
   * @type {Integer|string}
   */
  if (initObj.alias) {
    this.ref = initObj.alias;
  } else {
    this.ref = parseInt(initObj.ref, 10) || parseInt(initObj.oid, 10) || undefined;
    if (!this.ref && initObj.origine && initObj.idOrigine) this.ref = initObj.origine + '/' + initObj.idOrigine;
  }
  /**
   * Titre
   * @type {string}
   */
  this.titre = (initObj.titre && typeof initObj.titre === 'string') ? initObj.titre : 'Sans titre';
  /**
   * Résumé (pour l'élève)
   * @type {string}
   */
  this.resume = (initObj.resume && typeof initObj.resume === 'string') ? initObj.resume : '';
  /**
   * Commentaires (pour le formateur)
   * @type {string}
   */
  this.commentaires = (initObj.commentaires && typeof initObj.commentaires === 'string') ? initObj.commentaires : '';
  /**
   * Le type qui permet de savoir à quel type de contenu s'attendre, ou quel picto afficher
   * @type {string}
   */
  this.type = (initObj.type && typeof initObj.type === 'string') ? initObj.type : 'arbre';
  /**
   * Un ou des id de catégorie(s) éventuel (pour un picto)
   * @type {Array}
   */
  this.categories = (initObj.categories && initObj.categories instanceof Array ) ? initObj.categories : [];

  var prefix = (initObj.restriction === 0) ? "public" : "ressource";
  /**
   * Uri d'affichage (facultatif), commence par /public/ ou /ressource/
   * @type {string}
   */
  this.displayUri = initObj.displayUri || "/" +prefix +"/voir/" +this.ref;
  /**
   * Url absolue d'affichage (facultatif)
   * @type {string}
   */
  this.displayUrl = initObj.displayUrl;
  /**
   * Uri des data en json (facultatif), commence par /public/ ou /ressource/
   * @type {string}
   */
  this.dataUri = initObj.dataUri || "/api/" +prefix +"/" +this.ref;
  /**
   * Url absolue des data en json (facultatif)
   * @type {string}
   */
  this.dataUrl = initObj.dataUrl;
  /**
   * La base de la sesathèque concernée
   * @type {string}
   */
  this.base = initObj.base;
}

/**
 * Cast en string d'une ref (son titre)
 * @returns {string}
 */
Ref.prototype.toString = function () {
  return this.titre;
};
