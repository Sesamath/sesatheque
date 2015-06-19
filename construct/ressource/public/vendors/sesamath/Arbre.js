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
 * @file Format d'un Arbre de ressources Sésamath, sous forme d'un module js exporté pour requirejs ou node
 */

/* global define, module*/

// suivant que l'on est coté serveur ou client
if (typeof define === 'function') define(function () {return Arbre});
else if (typeof module === 'object') module.exports = Arbre;
// sinon on est chargé tel quel et ce que l'on défini ici se retrouve dans l'espace de nom global

/**
 * Retourne un node jstree (propriétés text, icon et a_attr qui porte nos data)
 * duplication de la même fct de $ressourceConverter
 * @see http://www.jstree.com/docs/json/ pour le format
 * @param {Ressource} ressource
 */
function getJstNode (ressource) {
  /**
   * Retourne les datas qui nous intéressent à mettre sur le tag a
   * (pour a_attr : data-id, data-typeTechnique, href et alt)
   * @param {Ressource} ressource
   * @return {Object}
   */
  function getAttr() {
    var attr = {};
    // id
    if (ressource.oid) attr['data-ref'] = ressource.oid;
    else if (ressource.ref) attr['data-ref'] = ressource.ref;
    else if (ressource.origine && ressource.idOrigine) attr['data-ref'] = ressource.origine +'/' +ressource.idOrigine;
    // url complète
    if (ressource.displayUri) {
      attr.href = ressource.displayUri;
      attr.target = "displayRessource";
    }
    if (ressource.typeTechnique) attr['data-typeTechnique'] = ressource.typeTechnique;
    if (ressource.resume) attr.alt = ressource.resume;

    return attr;
  }

  var node;
  if (ressource) {
    node = {
      text  : ressource.titre,
      a_attr: getAttr(),
      icon  : ressource.typeTechnique + 'JstNode'
    };
  } else log.error(new Error("getJstNode appelé sans ressource"));

  return node;
}


/**
 * Définition d'un arbre, sous sa forme "data" (pour stockage et échange, pas forcément affichage)
 * C'est aussi la définition d'une branche ou d'une feuille
 *
 * La présence d'un attribut oid, laisse supposer titre et typeTechnique sont renseignés,
 * sinon ref doit être renseigné pour aller les chercher
 *
 * @param {Object} [initObj={}] L'objet qui sert à initialiser un nouvel Arbre
 * @constructor
 */
function Arbre(initObj) {
  log('constructeur Arbre avec', initObj);
  if (! initObj instanceof Object) initObj = {};
  /**
   * L'identifiant de l'arbre (pour éventuellement le référencer comme enfant d'un autre arbre)
   * @type {(Number|string|undefined)}
   */
  this.oid = initObj.oid || null;
  /**
   * Une référence vers l'oid du "vrai" Arbre|feuille sur la sesatheque courante, si on n'est
   * qu'une référence et pas l'objet complet.
   *
   * Si une appli mélange des références en provenance de différentes sesatheques, elle pourra ajouter une
   * propriété refSource pour les distinguer
   * @type {(Number|string|undefined)}
   */
  this.ref = initObj.ref;
  if (!this.ref && initObj.origine && initObj.idOrigine) {
    this.ref = initObj.origine +'/' +initObj.idOrigine;
  }
  /**
   * Le nom
   * @type {string}
   */
  this.titre = (initObj.titre && typeof initObj.titre === 'string') ? initObj.titre : '';
  /**
   * Le typeTechnique de la racine (qui peut être une feuille, dans ce cas c'est pas arbre),
   * qui permet de savoir à quel type de contenu s'attendre, ou quel picto afficher
   * @type {(Number|string|undefined)}
   */
  this.typeTechnique = initObj.typeTechnique || 'arbre'
  /**
   * Des attributs du node (ou la racine de l'arbre), ça peut être ico pour une icone particulière
   * @type {Object}
   */
  this.attributes = (initObj.attributes && initObj.attributes instanceof Object ) ? initObj.attributes : {};
  /**
   * Les enfants, un tableaux d'objets Arbre (qui peuvent n'être que des références, ou un mix)
   * @type {Arbre[]}
   */
  this.enfants = (initObj.enfants && initObj.enfants instanceof Array) ? initObj.enfants : [];
}

/**
 * Cast en string d'un arbre (son nom)
 * @returns {string}
 */
Arbre.prototype.toString = function () {
  return this.titre;
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

/**
 * Retourne un tableau children au format jstree
 * duplication de $ressourceConverter.getJstreeChildren
 * @param ressource
 * @return {Array} Le tableau des enfants
 */
Arbre.prototype.getJstreeChildren = function() {
  var children = [];
  if (this.enfants) {
    this.enfants.forEach(function (enfant) {
      var child;
      if (enfant.typeTechnique === 'arbre') {
        child = Arbre.prototype.getJstreeChildren.call(enfant);
      } else {
        child = getJstNode(enfant);
      }
      children.push(child);
    });
  }

  return children;
}

/**
 * Retourne un arbre pour jstree (array d'un node unique)
 * @returns {Array}
 */
Arbre.prototype.toJstree = function() {
  var node = getJstNode(this);
  if (this.enfants && this.enfants.length) {
    node.children = this.getJstreeChildren();
  } else {
    // url pour récupérer les enfants
    var url;
    if (this.oid) url = '/api/jstree?id=' + this.oid;
    else if (this.ref) url = '/api/jstree?id=' + this.ref;
    if (url) {
      node.children = true;
      node.data = {url: url + '&children=1'};
    }
  }

  return [node];
}
