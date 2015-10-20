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

/* global define, module*/
// suivant que l'on est coté serveur ou client
if (typeof define === 'function') define(function () {return Resultat;});
else if (typeof module === 'object') module.exports = Resultat;
// sinon on est chargé tel quel et ce que l'on défini ici se retrouve dans l'espace de nom global
// pas trouvé comment documenté correctement un constructeur dans une fonction anonyme auto-exécutée…

/**
 * Définition d'un résultat commune à toutes les ressources (exercices ou pas)
 * @constructor
 * @param {object|string} original Un objet ayant des propriétés d'un résultat, ou une chaine qui sera mise dans reponse
 */
function Resultat(original) {
  var values = {};
  // on accepte une simple chaine, que l'on mettra dans la propriété reponse du résultat construit
  if (typeof original === 'string') values.reponse = original;
  else if (typeof original === 'object') values = original;

  /**
   * L'identifiant du résultat, pour celui qui va le stocker
   * @default undefined
   * @type {number|string}
   */
  this.id = values.id;

  /**
   * La sesatheque de la ressource qui a généré le résultat
   * (là où on a chargé la ressource et son plugin, ajouté par celui qui récupère le résultat)
   * @default undefined
   * @type {number|string}
   */
  this.sesatheque = values.sesatheque;

  /**
   * L'identifiant de la ressource (dans sa sesatheque d'origine)
   * @default undefined
   * @type {number|string}
   */
  this.ressId = values.ressId;

  /**
   * Le type de la ressource (typeTechnique de la ressource, nom de code du plugin qui la gère et saura afficher le résultat)
   * @default undefined
   * @type {string}
   */
  this.ressType = values.ressType;

  /**
   * L'origine du l'utilisateur (à priori complété par celui qui récupère le résultat)
   * @default undefined
   * @type {number|string}
   */
  this.userOrigine = values.userOrigine;

  /**
   * L'id de l'utilisateur (l'auteur du résultat) dans son référentiel d'origine
   * (à priori complété par celui qui récupère le résultat)
   * @default undefined
   * @type {number|string}
   */
  this.userId = values.userId;

  /**
   * La date du résultat
   * @default new Date()
   * @type {Date}
   */
  this.date = values.date || new Date();

  /**
   * La durée en seconde entre le début de l'affichage de la ressource et l'envoi de ce résultat
   * @default null
   * @type {Integer}
   */
  this.duree = values.duree || null;

  /**
   * Vaut true quand c'est le dernier envoi de l'exercice (seulement pour certains types)
   * @default undefined
   * @type {boolean}
   */
  this.fin = values.fin;

  /**
   * Un contenu pour une réponse qui ne rentre pas dans la string réponse
   * (sert à distinguer les résultats où le formateur peut aller consulter un objet réponse,
   * ça peut être un paragraphe de texte, un objet xml ou base64 pour certains types, etc.)
   * @default undefined
   * @type {string|*}
   */
  this.contenu = values.contenu

  /**
   * Le score numérique, entre 0 et 1
   * @default null
   * @type {number}
   */
  this.score = values.score;
  if (this.score < 0) this.score = null;
  if (this.score > 1) this.score = null;

  /**
   * Le résultat sous une forme qualitative (rrvb pour mep, phrase d'état pour j3p, etc.)
   * @default ""
   * @type {string|*}
   */
  this.reponse = values.reponse || '';

  /**
   * L'objet initial passé au constructeur (si cet objet contient une propriété original c'est elle que l'on prend)
   * @type {Object}
   */
  this.original = values.original || original;
}

/**
 * Cast en string d'un Resultat (sa reponse)
 * @returns {string}
 */
Resultat.prototype.toString = function () {
  return (typeof this.reponse === "string") ? this.reponse : this.reponse.toString();
};
