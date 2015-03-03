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
 * Module pour get/set des ressources sur l'api de la bibli courante
 * Attention, les urls sont en dur et supposent que la bibliotheque est installée à la racine du domaine,
 * il faut modifier prefix si ce n'est pas le cas
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
  },
  /**
   * Récupère une ressource sur la bibliothèque en ajax
   * @param id
   * @param next
   */
  getRessource: function (id, next) {
    if (!next || typeof next !== 'function') throw new Error('Il faut fournir une fonction de rappel');
    if (!id) return next(new Error("Il faut fournir un identifiant"));
    if (parseInt(id, 10) != id) return next(new Error("L'identifiant fourni n'est pas un entier"));
    callBibli(id, next)
  },
  /**
   * Enregistre une ressource sur la bibliotheque
   * @param ressource
   * @param next
   */
  setRessource: function (ressource, next) {
    if (!next || typeof next !== 'function') throw new Error('Il faut fournir une fonction de rappel');
    if (!ressource) return next(new Error("Il faut fournir une ressource"));
    if (!ressource.titre || !ressource.categories) return next(new Error("Ressource invalide"));
    callBibli(ressource, next);
  }
})


/**
 * Gère les appels ajax vers l'api de la bibliothèque
 * @param {number|Object} data Si data est un id on fera un get, si data est une ressource un post
 * @param {function} next
 * @private
 */
function callBibli(data, next) {
  var request, method, url, isGet;

  // post ou get ?
  if (data.hasOwnProperty('titre')) {
    isGet = true;
    method = 'GET';
    url = prefix + 'api/ressource/' + data.id;
  } else {
    isGet = false;
    method = 'POST';
    url = prefix + 'api/ressource/';
  }

  if (typeof XMLHttpRequest !== undefined) {
    // cf https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
    request = new XMLHttpRequest();
  } else {
    return next(new Error("votre navigateur ne supporte pas les appels ajax"));
  }
  try {
    // on prépare la requete
    request.timeout = ajaxTimeout;

    // les différentes callback
    request.onload = function () {
      if (request.status >= 200 && request.status < 400) {
        try {
          var reponse = JSON.parse(request.responseText);
          next(null, reponse);
        } catch (error) {
          var errMsg = isGet ?
              "La ressource renvoyée par la bibliotheque est invalide" :
              "La réponse du serveur n'est pas du json valide";
          next(new Error(errMsg +' : ' +request.responseText));
        }
      } else {
        // On a une réponse mais c'est une erreur
        // il faudra gérer les 301 & 302 éventuels, mais pour le moment l'api n'en renvoie pas
        next(new Error('Error ' + request.status + ' : ' + request.responseText));
      }
    };

    request.onerror = function () {
      // Pb de connexion au serveur
      var errMsg = "Le serveur a renvoyé une erreur";
      if (request.status) errMsg += ' ' +request.status;
      errMsg += ' : ' +request.responseText;
      next(new Error(errMsg));
    };

    request.ontimeout = function () {
      next(new Error("Le serveur n'a pas répondu après " +Math.floor(timeout/1000) +"s d'attente."));
    };

    // et on envoie
    request.open(method, url, true);
    request.send(data);
  } catch (error) {
    next(new Error("votre navigateur ne supporte pas les appels ajax, erreur : " +error.toString()));
  }
}