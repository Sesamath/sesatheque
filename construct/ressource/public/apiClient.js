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
 * Module pour get/set des ressources sur l'api de la sesatheque courante
 * Attention, les urls sont en dur et supposent que la sesatheque est installée à la racine du domaine,
 * 
 * il faut utiliser setPrefix() avant les autres méthodes si ce n'est pas le cas
 */
/*global define, XMLHttpRequest */
'use strict';

/**
 * le prefixe d'installation de la bibliotheque, doit commencer et finir par un slash,
 * on appellera les urls de la forme
 * prefix + 'api/ressource/…'
 * @type {string}
 */
var prefix = '/';

/**
 * Le timeout des requêtes ajax. 10s c'est bcp mais certains clients ont des BP catastrophiques
 * @type {number}
 */
var ajaxTimeout = 10000;

define({
  /**
   * Modifie le préfixe par défaut (/)
   * @param bibliPrefix Le préfixe a mettre devant api/ressource. Il doit se terminer par un slash,
   *                    et commencer par slash ou http
   */
  setPrefix: function (bibliPrefix) {
    prefix = bibliPrefix;
    if (prefix.substr(-1) !== '/') prefix += '/';
  },
  /**
   * Récupère une ressource sur la bibliothèque en ajax
   * @param id peut être un oid de la sesatheque ou origine/idOrigine
   * @param next sera appelé avec (error, ressource)
   */
  getRessource: function (id, next) {
    if (!next || typeof next !== 'function') throw new Error('Il faut fournir une fonction de rappel');
    if (!id) return next(new Error("Il faut fournir un identifiant"));
    callBibli({id:id}, next);
  },
  /**
   * Enregistre une ressource sur la bibliotheque
   * @param ressource
   * @param next
   */
  setRessource: function (ressource, next) {
    if (!next || typeof next !== 'function') throw new Error('Il faut fournir une fonction de rappel');
    if (!ressource) return next(new Error("Il faut fournir une ressource"));
    if (!ressource.titre || !ressource.categories) return next(new Error("Ressource invalide (titre et categories sont obligatoires)"));
    callBibli(ressource, next);
  }
});


/**
 * Gère les appels ajax vers l'api de la bibliothèque
 * @param {number|Object} data Si data est un id on fera un get, si data est une ressource un post
 * @param {function} next
 * @private
 */
function callBibli(data, next) {
  var xhr, method, url, isGet;

  try {
    // post ou get ?
    if (data.hasOwnProperty('titre')) {
      isGet = false;
      method = 'POST';
      url = prefix + 'api/ressource/';
    } else {
      isGet = true;
      method = 'GET';
      var id = data.oid || data.id;
      if (!id && data.origine && data.idOrigine) id = data.origine +'/' +data.idOrigine;
      if (!id) throw new Error("il faut fournir une ressource à poster ou un id pour la récupérer (propriétés oid ou id ou origine+idOrigine");
      url = prefix + 'api/ressource/' + id;
      data = {};
    }

    if (typeof XMLHttpRequest !== undefined) {
      // cf https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
      xhr = new XMLHttpRequest();
    } else {
      return next(new Error("votre navigateur ne supporte pas les appels ajax"));
    }

    // on prépare la requete
    xhr.timeout = ajaxTimeout;

    // les différentes callback
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 400) {
        try {
          var reponse = JSON.parse(xhr.responseText);
          next(null, reponse);
        } catch (error) {
          var errMsg = isGet ?
              "La ressource renvoyée par la bibliotheque n'est pas du json valide" :
              "La réponse du serveur au post n'est pas du json valide";
          next(new Error(errMsg +' : ' +error.toString() +' la réponse brute était ' +xhr.responseText));
        }
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
      next(new Error("Le serveur n'a pas répondu après " +Math.floor(timeout/1000) +"s d'attente."));
    };

    // et on envoie
    xhr.open(method, url, true);
    xhr.send(data);
  } catch (error) {
    next(new Error("votre navigateur n'a pas fait l'appel ajax : " +error.toString()));
  }
}