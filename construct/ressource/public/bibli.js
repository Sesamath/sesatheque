/**
 * Module pour get/set des ressources sur l'api de la bibli courante
 * Attention, les urls sont en dur et supposent que la bibliotheque est installée à la racine du domaine,
 * il faut modifier prefix si ce n'est pas le cas
 */
/*global define, window, XMLHttpRequest */
'use strict';

/**
 * le prefixe d'installation de la bibliotheque, doit commencer et finir par un slash,
 * on appellera les urls de la forme
 * prefix + 'api/ressource/…'
 * @type {string}
 */
var prefix = '/';

define({
  setPrefix:setPrefix,
  getRessource:getRessource,
  setRessource:setRessource
})

/**
 * Modifie le préfixe par défaut (/)
 * @param bibliPrefix Le préfixe a mettre devant api/ressource. Il doit se terminer par un slash,
 *                    et commencer par slash ou http
 */
function setPrefix(bibliPrefix) {
  prefix = bibliPrefix;
}

/**
 * Récupère une ressource sur la bibliothèque en ajax
 * @param id
 * @param next
 */
function getRessource(id, next) {
  if (!next || typeof next !== 'function') throw new Error('Il faut fournir une fonction de rappel');
  if (!id) return next(new Error("Il faut fournir un identifiant"));
  if (parseInt(id, 10) != id) return next(new Error("L'identifiant fourni n'est pas un entier"));
  callBibli(id, next)
}

/**
 * Enregistre une ressource sur la bibliotheque
 * @param ressource
 * @param next
 */
function setRessource(ressource, next) {
  if (!next || typeof next !== 'function') throw new Error('Il faut fournir une fonction de rappel');
  if (!ressource) return next(new Error("Il faut fournir une ressource"));
  if (!ressource.titre || !ressource.categories) return next(new Error("Ressource invalide"));
  callBibli(ressource, next);
}

/**
 *
 * @param {number|Object} data Si data est un id on fera un get, si data est une ressource un post
 * @param {function} next
 * @private
 */
function callBibli(data, next) {
  var request, reponse, isGet;
  var timeout = 20000; // 20s c'est énorme mais certains peuvent avoir des BP catastrophiques

  // post ou get ?
  isGet = !data.hasOwnProperty('titre')

  if (typeof XMLHttpRequest !== undefined) {
    // cf https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
    request = new XMLHttpRequest();
  } else {
    return next(new Error("votre navigateur ne supporte pas les appels ajax"));
  }
  try {
    request.timeout = timeout;
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

    request.open('GET', prefix + 'api/ressource/' + id, true);
    request.send();
  } catch (error) {
    next(new Error("votre navigateur ne supporte pas les appels ajax, erreur : " +error.toString()));
  }
}