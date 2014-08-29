/**
 * @file Format d'un Arbre de ressources Sésamath, sous forme d'un module js exporté pour requirejs ou node
 */

/* global define, module*/

// suivant que l'on est coté serveur ou client
if (typeof define === 'function') define(Arbre);
else if (typeof module === 'object') module.exports = Arbre;
// sinon on est chargé tel quel et ce que l'on défini ici se retrouve dans l'espace de nom global

/**
 * Définition d'un arbre, sous sa forme "data" (pour stockage et échange, pas forcément affichage)
 * C'est aussi la définition d'une branche ou d'une feuille
 *
 * @param {Object} initObj L'objet qui sert à initialiser un nouvel Arbre
 * @constructor
 */
function Arbre(initObj) {
  if (! initObj instanceof Object) initObj = {}
  /**
   * L'identifiant de l'arbre (pour éventuellement le référencer comme enfant d'un autre arbre)
   * @type {(Number|string|undefined)}
   */
  this.id = initObj.id || undefined;
  /**
   * Une référence vers le "vrai" Arbre, si on n'est qu'une référence et pas l'objet complet 
   * @type {(Number|string|undefined)}
   */
  this.ref = initObj.ref || undefined;
  /**
   * L'origine de la référence, pour savoir où aller la chercher
   * Il peut être un identifiant d'une bibliothèque ou une origine (dans ce cas ref est un idOrigine de ressource)
   * S'il est vide ou absent, on considèrera ref comme un id de la bibliothèque courante
   * @type {(Number|string|undefined)}
   */
  this.refOrigine  = initObj.refOrigine || undefined;
  /**
   * Le nom
   * @type {string}
   */
  this.titre = (initObj.titre && typeof initObj.titre === 'string') ? initObj.titre : '';
  /**
   * Le typeTechnique de la racine (qui peut être une feuille),
   * qui permet de savoir à quel type de contenu s'attendre, ou quel picto afficher
   * @type {(Number|string|undefined)}
   */
  this.typeTechnique = initObj.typeTechnique || undefined
  /**
   * Le contenu du node (ou la racine de l'arbre)
   * @type {Object}
   */
  this.contenu = (initObj.contenu && initObj.contenu instanceof Object ) ? initObj.contenu : {};
  /**
   * Les enfants, un tableaux d'objets Arbre (qui peuvent n'être que des références, ou un mix)
   * @type {Array}
   */
  this.enfants = (initObj.enfants && initObj.enfants instanceof Array) ? initObj.enfants : [];
}

/**
 * Cast en string d'un arbre (son nom)
 * @returns {string}
 */
Arbre.prototype.toString = function () {
  return this.name;
}

/**
 * Formate un arbre en ressource
 * @returns {Ressource}
 */
Arbre.prototype.toRessource = function () {
  /**
   * La ressource que l'on va renvoyer
   * @type {Ressource}
   */
  var r = {};
  /**
   * L'arbre que l'on transforme (raccourci d'écriture)
   * @type {Arbre}
   */
  var a = this;
  
  if (a.id) r.id = a.id;
  r.titre = (a.titre) ? a.titre : 'arbre sans titre';
  r.type = 'arbre';
  r.categories = [8];
  r.typeDocumentaires = [1];
  r.parametres = a;
  
  return r;
}