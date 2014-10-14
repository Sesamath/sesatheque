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
   * La bibliothèque de la ressource qui a généré le résultat
   * (là où on a chargé la ressource et son plugin, ajouté par celui qui récupère le résultat)
   * @type {number|string|undefined}
   */
  this.biblioName = initObj.biblioName|| undefined;

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
   * Toute autre caractéristique du résultat, spécifique au type de ressource
   * @type {Object}
   */
  this.content = (initObj.content && initObj.content instanceof Object) ? initObj.content : {};
}

/**
 * Cast en string d'un Resultat (sa partie qualitative)
 * @returns {string}
 */
Resultat.prototype.toString = function () {
  return this.resultString;
}
