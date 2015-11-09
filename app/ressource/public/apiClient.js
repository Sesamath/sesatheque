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
 * Module "standalone" pour get/set des ressources sur l'api d'une sesatheque
 * Il faut utiliser setBase() avant les autres méthodes pour préciser l'url absolue de la sésathèque
 * @service apiClient
 */
define(function () {
  'use strict';

  /**
   * Gère les appels ajax vers l'api de la bibliothèque
   * @private
   * @param {Integer|string|object} data Si data est un id on fera un get, si data est une ressource (un objet) un post
   * @param {ressourceCallback} next
   * @private
   */
  function callBibli(data, next) {
    var xhr, method, url, isGet;

    try {
      // post ou get ?
      if (typeof data === "object") {
        isGet = false;
        method = 'POST';
        url = base + 'api/ressource/';
      } else {
        isGet = true;
        method = 'GET';
        var id = data;
        if (!id) throw new Error("il faut fournir une ressource à poster ou un id pour la récupérer (un oid ou origine/idOrigine");
        url = base + 'api/ressource/' + id;
        data = {};
      }

      if (typeof XMLHttpRequest === "undefined") {
        throw new Error("appels ajax non supportés par le navigateur");
      } else {
        // cf https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
        xhr = new XMLHttpRequest();
      }

      // on prépare la requete
      xhr.timeout = ajaxTimeout;

      // les différentes callback
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 400) {
          var erreur, reponse;
          try {
            reponse = JSON.parse(xhr.responseText);
          } catch (error) {
            var errMsg = isGet ?
                "La ressource renvoyée par la bibliotheque n'est pas du json valide" :
                "La réponse du serveur au post n'est pas du json valide";
            erreur = new Error(errMsg +' : ' +error.toString() +' la réponse brute était ' +xhr.responseText);
          }
          next(erreur, reponse);
        } else {
          // On a une réponse mais c'est une erreur
          // il faudra gérer les 301 & 302 éventuels, mais pour le moment l'api n'en renvoie pas
          next(new Error('Error ' + xhr.status + ' : ' + xhr.responseText));
        }
      };

      xhr.onerror = function () {
        // Pb de connexion au serveur
        var errMsg = "Le serveur a renvoyé une erreur";
        if (xhr.status) errMsg += ' ' +xhr.status;
        errMsg += ' : ' +xhr.responseText;
        next(new Error(errMsg));
      };

      xhr.ontimeout = function () {
        next(new Error("Le serveur n'a pas répondu après " +Math.floor(ajaxTimeout/1000) +"s d'attente."));
      };

      // et on envoie
      xhr.open(method, url, true);
      xhr.send(data);
    } catch (error) {
      if (ST.addError) ST.addError(error);
      else if (typeof console !== 'undefined' && console.error) console.error(error);
      next(new Error("votre navigateur n'a pas fait l'appel ajax : " +error.toString()));
    }
  } // callBibli

  /**
   * la base de la sesatheque (on ajoutera le / de fin s'il manque mais en cross-domain fallait appeler init avant)
   * on appellera les urls de la forme base + 'api/ressource/…'
   * @type {string}
   */
  var base;
  if (typeof sesamath === "undefined") window.sesamath = {};
  var S = window.sesamath;
  if (!S.sesatheque) S.sesatheque = {};
  var ST = S.sesatheque;
  if (ST.base) base = ST.base;
  else base = '/';

  /**
   * Le timeout des requêtes ajax. 10s c'est bcp mais certains clients ont des BP catastrophiques
   * @private
   * @type {Integer}
   */
  var ajaxTimeout = 10000;

  return {
    /**
     * Modifie le préfixe par défaut (/)
     * @memberOf apiClient
     * @param {string} newSesathequeBase L'url de la sesathèque
     */
    setBase: function (newSesathequeBase) {
      base = newSesathequeBase;
      if (base.substr(-1) !== '/') base += '/';
    },
    /**
     * Récupère une ressource sur la bibliothèque en ajax
     * @memberOf apiClient
     * @param {Integer|string}    id   peut être un oid de la sesatheque ou origine/idOrigine
     * @param {ressourceCallback} next
     */
    getRessource: function (id, next) {
      if (!next || typeof next !== 'function') throw new Error('Il faut fournir une fonction de rappel');
      if (id) callBibli(id, next);
      else next(new Error("Il faut fournir un identifiant"));
    },
    /**
     * Enregistre une ressource sur la bibliotheque
     * @memberOf apiClient
     * @param {Ressource}         ressource
     * @param {ressourceCallback} next
     */
    setRessource: function (ressource, next) {
      if (!next || typeof next !== 'function') throw new Error('Il faut fournir une fonction de rappel');
      if (ressource) callBibli(ressource, next);
      else next(new Error("Il faut fournir une ressource"));
    }
  };
});

