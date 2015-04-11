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

// on ne sait pas dans quel environnement on peut tourner, on prévoit ça en fallback
var filters = (function () {
  function foo(arg) {return arg;}
  return {
    array : foo,
    arrayInt : foo,
    string : foo,
    date : foo,
    int : foo
  }
})();

// suivant que l'on est coté serveur ou client
if (typeof define === 'function') {
  define(['sesamath/tools/filters'], function(realFilters) {
    if (realFilters) filters = realFilters
    else if (console && console.error) console.error(new Error("sesamath/tools/filters n'a pas été chargé, on s'en passera..."))
    return Ressource
  });
} else if (typeof module === 'object') {
  filters = require('./tools/filters')
  module.exports = Ressource;
}
// sinon on est chargé tel quel et ce que l'on défini ici se retrouve dans l'espace de nom global

/**
 * Ressource
 * @param {Object} initObj Un objet ayant des propriétés d'une ressource
 * @constructor Ressource
 */
function Ressource(initObj) {
  if (!initObj) initObj = {}
  /**
   * L'identifiant interne à cette Sésathèque
   * @type {number}
   */
  this.oid = filters.int(initObj.oid) || undefined; // on préfère l'absence de propriété à 0
  /**
   * Une liste d'avertissements éventuels (incohérences, données manquantes, etc.)
   * Pratique d'avoir un truc pour faire du push dedans sans vérifier qu'il existe
   * Viré au save s'il est vide
   */
  this.warnings = filters.arrayString(initObj.warnings)
  /**
   * identifiant du dépôt d'origine (où est stockée et géré la ressource), reste null si créé ici
   * @type {String}
   */
  this.origine = filters.string(initObj.origine);
  /**
   * Id de la ressource dans son dépôt d'origine
   * @type {String}
   */
  this.idOrigine = filters.string(initObj.idOrigine);
  /**
   * Le code du plugin qui gère la ressource
   * @type {String}
   */
  this.typeTechnique = filters.string(initObj);
  /**
   * Titre
   * @type {string}
   */
  this.titre = filters.string(initObj.titre);
  /**
   * Résumé qui apparait souvent au survol du titre ou dans les descriptions brèves, destiné à tous
   * @type {String}
   */
  this.resume = filters.string(initObj.resume);
  /**
   *  Description plus complète, facultative (préférer le résumé)
   *  @type {String}
   */
  this.description = filters.string(initObj.description);
  /**
   * Commentaires destinés aux éditeurs, ou au prescipteur de la ressource mais pas à l'utilisateur
   * @type {String}
   */
  this.commentaires = filters.string(initObj.commentaires);
  /**
   * Niveaux scolaire de la ressource, dans son système éducatif par défaut, fr_FR s'il n'est pas précisé
   * @type {Array}
   */
  this.niveaux = filters.arrayInt(initObj.niveaux);
  /**
   * Une catégorie correspond à un recoupement de types, par ex "exercice interactif"
   * @type {Array}
   */
  this.categories = filters.arrayInt(initObj.categorie);

  /**
   * Type pédagogique (5.2 - scolomfr-voc-010) : cours, exercice...
   * C'est un champ conditionné par la catégorie, mais à priori seulement, l'utilisateur peut modifier / enrichir
   * @see "http://www.lom-fr.fr/scolomfr/la-norme/manuel-technique.html?tx_scolomfr_pi1[detailElt]=62"
   * @type {Array}
   */
  this.typePedagogiques = filters.arrayInt(initObj.typePedagogiques);
  /**
   * type documentaire (1.9 - scolomfr-voc-004) : image, ressource interactive, son, texte
   * Idem, conditionné par la catégorie mais à priori seulement
   * @see http://www.lom-fr.fr/scolomfr/la-norme/manuel-technique.html?tx_scolomfr_pi1[detailElt]=49
   * @type {Array}
   */
  this.typeDocumentaires = filters.arrayInt(initObj.typeDocumentaires);
  /**
   * Liste des ressources liées, une liaison étant un array [idLiaison, idRessourceLiée]
   * @type {Array}
   */
  this.relations = filters.array(initObj.relations);
  /**
   * Contenu qui dépend du type technique (toutes les autres infos concernant la ressource de ce type)
   * @type {Object}
   */
  this.parametres = (initObj.parametres instanceof Object) ? initObj.parametres : {};
  // on accepte une chaîne json
  if (initObj.parametres && typeof initObj.parametres === 'string') {
    try {
      var parametres = JSON.parse(initObj.parametres);
      this.parametres = parametres;
    } catch(error) {
      if (console && console.error) console.error(error);
    }
  }

  /**
   * Liste d'id d'auteurs
   * @type {Array}
   */
  this.auteurs = filters.arrayInt(initObj.auteurs);
  /**
   * Liste d'id de contributeurs
   * @type {Array}
   */
  this.contributeurs = filters.arrayInt(initObj.contributeurs);
  /**
   * code langue ISO 639-2 (http://fr.wikipedia.org/wiki/Liste_des_codes_ISO_639-2)
   * @type {String}
   */
  this.langue = filters.string(initObj.langue) || 'fra';
  /**
   * Vrai si la ressource est publiée (les non-publiées sont visibles par leur auteur et ceux ayant les droits ad hoc)
   * @type {boolean=false}
   */
  this.publie = !!initObj.publie;
  /**
   * Vrai si la ressource est indexable (peut sortir sur des résultats de recherche)
   * Sert à distinguer des ressources "obsolètes" car remplacées par d'autres mais toujours publiées car utilisées.
   * @type {boolean=true}
   */
  this.indexable = initObj.hasOwnProperty('indexable') ? !!initObj.indexable : true;
  /**
   * Restriction sur la ressource, cf lassi.settings.ressource.constantes.restriction
   */
  this.restriction = filters.int(initObj.restriction)
  /**
   * Date de création
   * @type {Date}
   */
  this.dateCreation = filters.date(initObj.dateCreation) || new Date();
  /**
   * Date de mise à jour
   * @type {Date=undefined}
   */
  this.dateMiseAJour = filters.date(initObj.dateMiseAJour);
  /**
   * Version de la ressource
   * {integer}
   */
  this.version = filters.int(initObj.version) || 1;
  /**
   * L'oid de l'archive correspondant à la version précédente
   */
  this.archiveOid = filters.int(initObj.archiveOid)
}

/**
 * Cast en string d'une ressource (son titre)
 * @returns {string}
 */
Ressource.prototype.toString = function () {
  return this.titre;
}