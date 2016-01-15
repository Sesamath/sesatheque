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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */
'use strict'

var xhr = require('./tools/xhr')

/**
 * Ajoute les propriétés xxxUrl et public
 * @private
 * @param {Ressource} ressource
 */
function addUrls(ressource, next) {
  var id = ressource.id || ressource.ref || ressource.oid;
  if (!id && ressource.origine && ressource.idOrigine) id = ressource.origine +'/' +ressource.idOrigine;
  var prefix = (ressource.restriction === 0 || ressource.public) ? 'public' : 'ressource';
  if (id) {
    ressource.dataUrl = base +'api/' +prefix +'/' +id;
    ressource.deleteUrl = base +'api/ressource/' +id;
    ressource.displayUrl = base +prefix +'/' +id;
    ressource.editUrl = base +'ressource/modifier/' +id;
    ressource.public = (ressource.public || ressource.restriction === 0);
  }
  next(null, ressource);
}

/**
 * Fonction exportée, affecte l'url absolue de la sesathèque et retourne les méthodes
 * @param {string} newSesathequeBase L'url absolue de la sesathèque (le slash de fin sera ajouté si manquant)
 * @returns {stClient}
 */
function init(newSesathequeBase) {
  if (!newSesathequeBase) throw new Error("Il faut fournir une base absolue de la sesatheque")
  if (! /^https?:\/\/[a-z\-\._]+(:[0-9]+)?(\/.*)?$/.test(newSesathequeBase)) throw new Error("La base " +newSesathequeBase +" n'est pas une racine d'url absolue valide")
  if (typeof name !== "string") throw new Error("Le nom doit être une string")
  if (newSesathequeBase.substr(-1) !== "/") newSesathequeBase += "/"
  base = newSesathequeBase;
  return stClient
}

/**
 * Gère les appels ajax vers l'api de la bibliothèque
 * @private
 * @param {Integer|string|object} data    Si data est un id on fera un get, si data est une ressource (un objet) un post
 * @param {object}                options Passer {format:"alias|compact"} pour formater la réponse
 *                                          (ou {merge:1} pour mettre à jour une ressource en envoyant seulement certaines propriétés)
 * @param {ressourceCallback}     next
 * @private
 */
function callBibli(data, options, next) {
  function end(error, ressource) {
    if (error) next(error);
    else addUrls(ressource, next);
  }
  var url, xhrOptions = {};
  if (options && options.format) {
    xhrOptions.urlParams = {};
    xhrOptions.urlParams.format = options.format;
  }
  if (options && options.merge) {
    if (!xhrOptions.urlParams) xhrOptions.urlParams = {};
    xhrOptions.urlParams.merge = "1";
  }
  xhrOptions.responseType = "json";
  xhrOptions.timeout = ajaxTimeout;
  // post ou get ?
  if (typeof data === "object") {
    url = base + 'api/ressource';
    xhr.post(url, data, xhrOptions, end);
  } else {
    var id = data;
    if (!id) throw new Error("il faut fournir une ressource à poster ou un id pour la récupérer (un oid ou origine/idOrigine");
    url = base + 'api/ressource/' + id;
    xhr.get(url, xhrOptions, end);
  }
} // callBibli

/**
 * Le timeout des requêtes ajax. 10s c'est bcp mais certains clients ont des BP catastrophiques
 * @private
 * @type {Integer}
 */
var ajaxTimeout = 10000;

/**
 * la base de la sesatheque (on ajoutera le / de fin s'il manque mais en cross-domain fallait appeler init avant)
 * on appellera les urls de la forme base + 'api/ressource/…'
 * @type {string}
 */
var base

/**
 * Méthodes du client
 * @type {stClient}
 */
var stClient = {
  /**
   * Récupère une ressource sur la bibliothèque en ajax sous forme d'alias
   * @memberOf apiClient
   * @param {Integer|string}    id   peut être un oid de la sesatheque ou origine/idOrigine
   * @param {ressourceCallback} next
   */
  getAlias: function (id, next) {
    if (!next || typeof next !== 'function') next(new Error('Il faut fournir une fonction de rappel'));
    else if (id) callBibli(id, {format:"alias"}, next);
    else next(new Error("Il faut fournir un identifiant"));
  },
  /**
   * Récupère une ressource sur la bibliothèque en ajax
   * @memberOf apiClient
   * @param {Integer|string}    id       peut être un oid de la sesatheque ou origine/idOrigine
   * @param {string}            [format] alias|compact
   * @param {ressourceCallback} next
   */
  getRessource: function (id, format, next) {
    var options;
    if (typeof format === "function") {
      next = format;
    } else {
      options = {format:format};
    }
    if (!next || typeof next !== 'function') next(new Error('Il faut fournir une fonction de rappel'));
    else if (id) callBibli(id, options, next);
    else next(new Error("Il faut fournir un identifiant"));
  },
  /**
   * Enregistre une ressource sur la bibliotheque
   * @memberOf apiClient
   * @param {Ressource}         ressource
   * @param {ressourceCallback} next
   */
  setRessource: function (ressource, isPartial, next) {
    var options;
    if (typeof isPartial === "function") {
      next = isPartial;
    } else if (isPartial) {
      options = {merge:1};
    }
    if (!next || typeof next !== 'function') next(new Error('Il faut fournir une fonction de rappel'));
    else if (ressource) callBibli(ressource, options, next);
    else next(new Error("Il faut fournir une ressource"));
  }
};

module.exports = init
