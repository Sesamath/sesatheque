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

/**
 * Format d'un résultat d'une ressource Sésamath
 * sous forme d'un module js exporté pour requirejs ou node
 */

/* global define, module*/

// suivant que l'on est coté serveur ou client
// Avec requirejsoOn retourne juste le constructeur comme module mais faut le mettre en retour de fct
if (typeof define === 'function') define(function () {return Resultat});
else if (typeof module === 'object') module.exports = Resultat;
// sinon on est chargé tel quel et ce que l'on défini ici se retrouve dans l'espace de nom global

/**
 * Définition d'un résultat commune à toutes les ressources (exercices ou pas)
 *
 * @param initObj
 * @constructor
 */
function Resultat(initObj) {
  // on accepte une simple chaine, que l'on mettra dans la propriété reponse du résultat construit
  var reponse = (typeof initObj === 'string') ? initObj : '';
  // on s'assure d'avoir un objet
  if (! initObj instanceof Object) initObj = {}

  /**
   * L'identifiant du résultat, pour celui qui va le stocker
   * @type {number|string|undefined}
   */
  this.id = initObj.id || undefined;

  /**
   * La sesatheque de la ressource qui a généré le résultat
   * (là où on a chargé la ressource et son plugin, ajouté par celui qui récupère le résultat)
   * @type {number|string|undefined}
   */
  this.sesatheque = initObj.sesatheque || undefined;

  /**
   * L'identifiant de la ressource (dans son référentiel d'origine)
   * @type {number|string|undefined}
   */
  this.ressId = initObj.ressId || undefined;
  
  /**
   * Le type de la ressource (le nom de code du plugin qui la gère, et saura afficher le résultat)
   * @type {number|string|undefined}
   */
  this.ressType = initObj.ressType || undefined;
  
  /**
   * L'origine du l'utilisateur
   * (à priori complété par celui qui récupère le résultat)
   * @type {number|string|undefined}
   */
  this.userOrigine = initObj.userOrigine  || undefined;
  
  /**
   * L'id de l'utilisateur (l'auteur du résultat) dans son référentiel d'origine
   * (à priori complété par celui qui récupère le résultat)
   * @type {number|string|undefined}
   */
  this.userId = initObj.userId  || undefined;

  /**
   * La date du résultat
   * @type {*|Date}
   */
  this.date = initObj.date || new Date();

  /**
   * La durée en seconde entre le début de l'affichage de la ressource et l'envoi de ce résultat
   * @type {number}
   */
  this.duree = initObj.duree || 0;

  /**
   * Le score numérique, entre 0 et 1
   * @type {number}
   */
  this.score = initObj.score || null;
  if (this.score < 0) this.score = null;
  if (this.score > 1) this.score = null;

  /**
   * Le résultat sous une forme qualitative (rrvb pour mep, phrase d'état pour j3p, etc.)
   * @type {string|*}
   */
  this.reponse = initObj.reponse || reponse;

  /**
   * L'objet initial qu'on nous a passé
   * @type {Object}
   */
  this.original = initObj;
}

/**
 * Cast en string d'un Resultat (sa partie qualitative)
 * @returns {string}
 */
Resultat.prototype.toString = function () {
  return this.resultString;
}
