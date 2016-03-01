webpackJsonp([1],[
/* 0 */
/***/ function(module, exports, __webpack_require__) {

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
	
	/**
	 * Afficheur générique pour l'affichage de toutes les ressources
	 * appelé avant les plugins (c'est sa fct load qui chargera le bon)
	 *
	 * Son chargement déclenche celui de init qui ajoute en global nos méthodes utilitaires, cf {@link namespace:sesamath}
	 */
	'use strict';
	
	var page = __webpack_require__(3);
	var log = __webpack_require__(2);
	var dom = __webpack_require__(5);
	var tools = __webpack_require__(4);
	
	var wd = window.document;
	
	/**
	 * Le timeout des requêtes ajax. 10s c'est bcp mais certains clients ont des BP catastrophiques
	 * @private
	 * @type {number}
	 */
	var ajaxTimeout = 10000;
	/**
	 * La date de début d'affichage
	 */
	var startDate;
	
	/**
	 * Module d'une seule fonction pour afficher une ressource quelconque.
	 * Il chargera le bon afficheur en lui passant les options attendues,
	 * en créant si besoin les contereurs dans le dom courant, avec un appel de page.init(options).
	 * @service display
	 * @param {Ressource}     ressource La ressource à afficher
	 * @param {initOptions}   [options] Les options éventuelles (passer base si ce js est chargé sur un autre domaine)
	 * @param {errorCallback} [next]    Fct appelée à la fin du chargement avec une erreur ou undefined
	 */
	function display(ressource, options, next) {
	  /**
	   * Fait le chargement proprement dit après l'init
	   * @private
	   * @param {Error} [error] Une erreur éventuelle à l'init
	   */
	  function load(error) {
	    if (error) {
	      next(error);
	    } else {
	      log('display avec la ressource', ressource);
	      log('et les options après page.init', options);
	
	      // ajoute de la css commune à toutes les ressources ici
	      dom.addCss(options.base + 'styles/ressourceDisplay.css');
	
	      // le display du plugin
	      var pluginName = ressource.type;
	      var pluginDisplay = __webpack_require__(6)("./" + pluginName + '/display');
	      if (!pluginDisplay) throw new Error("L'affichage des ressources de type " + pluginName + " n'est pas encore implémenté");
	      // pour envoyer les résultats, on regarde si on nous fourni une url ou une fct ou un nom de message
	      var Resultat, traiteResultat;
	
	      if (options) {
	        if (options.resultatCallback && tools.isFunction(options.resultatCallback)) traiteResultat = 'function';else if (options.urlResultatCallback && tools.isString(options.urlResultatCallback) && options.urlResultatCallback.substr(0, 4) === 'http') traiteResultat = 'ajax'; // jshint ignore:line
	        else if (options && options.resultatMessageAction && tools.isString(options.resultatMessageAction)) traiteResultat = 'message';
	      }
	      // un cas particulier, le prof qui teste, on fourni une callback qui fait rien,
	      // pour éviter des avertissements sur les ressources qui attendent une callback
	      if (traiteResultat === 'none') traiteResultat = function traiteResultat() {};
	      if (traiteResultat) Resultat = __webpack_require__(29);
	
	      try {
	        if (typeof pluginDisplay === 'undefined') throw new Error('Le chargement du plugin ' + pluginName + ' a échoué');
	        log('plugin ' + pluginName + ' chargé');
	        if (options.container) dom.empty(options.container);else throw new Error("L'initialisation a échoué, pas de conteneur pour la ressource");
	        if (!options.errorsContainer) throw new Error("L'initialisation a échoué, pas de conteneur pour afficher les erreurs");
	        // On vire le titre si on nous le demande via les options ou un param dans l'url
	        if (options.hasOwnProperty('showTitle') && !options.showTitle || /\?.*showTitle=0/.test(wd.URL) || /\/apercevoir\//.test(wd.URL) || /\?(.+&)?layout=iframe/.test(wd.URL)) {
	          page.hideTitle();
	        }
	        // on regarde s'il faut ajouter une fct de sauvegarde des résultats
	        if (Resultat) addResultatCallback(options, traiteResultat, Resultat);
	        // on lui ajoute toujours ça
	        if (!options.base) options.base = '/';else if (options.base.substring(-1) !== '/') options.base += '/';
	        options.pluginBase = options.base + '/plugins/' + pluginName + '/';
	        // on peut afficher
	        pluginDisplay(ressource, options, function (error) {
	          startDate = new Date();
	          if (error) {
	            log("le display a terminé mais renvoyé l'erreur", error);
	            page.addError(error);
	          } else {
	            log('le display a terminé sans erreur');
	          }
	          if (next) next(error);
	        });
	      } catch (err) {
	        page.addError(err.toString());
	      }
	    }
	  } // load
	
	  /**
	   * Ajoute une méthode resultatCallback aux options si besoin
	   * @private
	   * @param {Object}   options        L'objet sur lequel on ajoutera la methode resultatCallback
	   * @param {string}   traiteResultat Le type de traitement (function|ajax|message)
	   * @param {function} Resultat       Le constructeur Resultat
	   */
	  function addResultatCallback(options, traiteResultat, Resultat) {
	    /*global XMLHttpRequest*/
	    // Le conteneur du picto enregistrement
	    var divFeedback = wd.getElementById('pictoFeedback');
	
	    // Éteint le feedback */
	    function feedbackOff() {
	      if (divFeedback) divFeedback.className = 'feedbackOff';
	    }
	
	    // Allume le feedback OK pour 4s
	    function feedbackOk() {
	      if (divFeedback) {
	        divFeedback.className = 'feedbackOk';
	        setTimeout(feedbackOff, 4000);
	      }
	    }
	
	    // Allume le feedback KO pour 4s
	    function feedbackKo() {
	      if (divFeedback) {
	        divFeedback.className = 'feedbackKo';
	        setTimeout(feedbackOff, 4000);
	      }
	    }
	
	    if (traiteResultat) {
	      /**
	       * Envoi un résultat en ajax ou à la callback pour sauvegarde et appelle saveCallback avec le retour
	       * @private
	       * @param {Object}   result         Le résultat à envoyer (passera par le constructeur Resultat)
	       * @param {function} [saveCallback] La fonction à rappeler avec le retour de l'appel ajax ou de la callback de sauvegarde
	       */
	      options.resultatCallback = function (result, saveCallback) {
	        /**
	         * Gère l'affichage du feedback puis appelle saveCallback avec le retour
	         * @private
	         * @param retour Le retour de l'envoi du score
	         */
	        function feedback(retour) {
	          log('feedback', retour);
	          if (retour && retour.ok && retour.ok === true || retour.success && retour.success === true) {
	            feedbackOk();
	          } else {
	            if (retour && retour.error) page.addError(retour.error);
	            feedbackKo();
	          }
	          // et on appelle saveCallback si on nous l'a fourni
	          if (saveCallback) saveCallback(retour);
	        }
	
	        /**
	         * poste resultat en ajax vers traiteResultat puis appellera feedback avec le retour
	         * @private
	         * @param {Resultat} resultat
	         * @param {boolean}  deferSync Passer true pour envoyer le résultat en local
	         *                             pour que le serveur fasse suivre (pour éviter les pbs de CORS)
	         */
	        function sendAjax(resultat, deferSync) {
	          // c'est une url, on gère l'envoi
	          if (typeof XMLHttpRequest === 'undefined') {
	            // cf https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
	            throw new Error("Le navigateur ne supporte pas les appels ajax, impossible d'envoyer des résultats");
	          }
	          // cf https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
	          var xhr = new XMLHttpRequest();
	          // pour que le navigateur envoie les cookies
	          xhr.withCredentials = true;
	
	          // les différentes callback
	          xhr.onload = function () {
	            if (xhr.status >= 200 && xhr.status < 400) {
	              try {
	                var retour = JSON.parse(xhr.responseText);
	                feedback(retour);
	              } catch (error) {
	                feedback({ error: "La réponse de l'enregistrement du résultat est invalide" });
	              }
	            } else {
	              // On a une réponse mais c'est une erreur
	              feedback({
	                error: "La réponse de l'enregistrement du résultat est une erreur " + xhr.status + ' : ' + xhr.responseText
	              });
	            }
	          };
	
	          xhr.onerror = function () {
	            // Pb de connexion au serveur
	            feedback({ error: "Impossible d'envoyer le résultat (à " + options.urlResultatCallback + ')' });
	          };
	
	          // et on envoie, mais sur le proxy si sync (car on est sur un event unload et l'envoi de la requete options est annulée en cross domain)
	          var url;
	          if (deferSync) {
	            resultat.deferUrl = options.urlResultatCallback;
	            url = options.base + 'api/deferPost';
	            log('on passe en synchrone vers ' + url);
	          } else {
	            // on pouvait pas mettre de timeout en synchrone
	            url = options.urlResultatCallback;
	            xhr.timeout = ajaxTimeout;
	            xhr.ontimeout = function () {
	              feedback({
	                error: "Pas de réponse de l'enregistrement du résultat après " + Math.floor(ajaxTimeout / 1000) + "s d'attente."
	              });
	            };
	          }
	          xhr.open('POST', url, !deferSync);
	          xhr.setRequestHeader('Content-type', 'application/json'); // text/plain évite le preflight mais le body parser interprête pas
	          try {
	            xhr.send(JSON.stringify(resultat));
	          } catch (error) {
	            feedback({ error: "Impossible de convertir (donc d'envoyer) le résultat renvoyé par la ressource." });
	          }
	        }
	
	        function sendMessage(resultat) {
	          var chunks = options.resultatMessageAction.split('::');
	          var action = options.resultatMessageAction;
	          var resultatProp = chunks[1] || 'resultat';
	          var message = {
	            action: action
	          };
	          message[resultatProp] = resultat;
	          // on envoie
	          window.top.postMessage(message, '*');
	        }
	
	        // MAIN addResultatCallback
	        log('resultatCallback display a reçu', result);
	        var deferSync = result.deferSync;
	        var resultat = new Resultat(result);
	        // on impose juste date et durée
	        resultat.date = new Date();
	        // le plugin peut imposer sa mesure
	        if (!resultat.duree && startDate) {
	          resultat.duree = Math.floor((new Date().getTime() - startDate.getTime()) / 1000);
	        }
	        // on regarde si on nous a demandé d'ajouter des paramètres utilisateur au résultat
	        ['sesatheque', 'userOrigine', 'userId'].forEach(function (paramName) {
	          var paramValue = tools.getURLParameter(paramName) || options[paramName];
	          if (paramValue) resultat[paramName] = paramValue;
	        });
	        // @todo ajouter des vérifs minimales
	
	        // si on nous a passé une fct on lui envoie le résultat
	        if (traiteResultat === 'function') {
	          log('on envoie ce résultat à la fct qui nous a été passé en param', resultat);
	          options.resultatCallback(resultat);
	        } else if (traiteResultat === 'ajax') {
	          log('on va poster ce résultat vers ' + traiteResultat, resultat);
	          sendAjax(resultat, deferSync);
	        } else if (traiteResultat === 'message') {
	          if (options.resultatMessageAction === 'none') {
	            log("On a reçu ce résultat (que l'on ne fait pas suivre on est en test)", resultat);
	          } else {
	            log('postMessage de ce résultat vers ' + traiteResultat, resultat);
	            sendMessage(resultat);
	          }
	        }
	      }; // fin définition options.resultatCallback
	    }
	  } // addResultatCallback
	
	  page.init(options, load);
	}
	
	module.exports = display;
	
	// et l'on s'exporte dans le dom global pour pouvoir être utilisé hors webpack
	if (typeof window !== 'undefined') {
	  if (typeof window.sesatheque === 'undefined') window.sesatheque = {};
	  window.sesatheque.display = display;
	}

/***/ },
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./am/display": 7,
		"./arbre/display": 9,
		"./ato/display": 11,
		"./calkc/display": 12,
		"./coll_doc/display": 13,
		"./ec2/display": 14,
		"./ecjs/display": 15,
		"./em/display": 17,
		"./iep/display": 18,
		"./j3p/display": 19,
		"./mathgraph/display": 21,
		"./mental/display": 22,
		"./url/display": 23
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 6;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

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
	
	'use strict';
	
	var page = __webpack_require__(3);
	var dom = __webpack_require__(5);
	var log = __webpack_require__(2);
	var swf = __webpack_require__(8);
	
	var isLoaded;
	var ressOid;
	
	/**
	 * Affiche une ressource am (aides mathenpoche : animations flash, sans réponse de l'élève)
	 * @service plugins/am/display
	 * @param {Ressource}      ressource  L'objet ressource
	 * @param {displayOptions} options    Les options après init
	 * @param {errorCallback}  next       La fct à appeler quand le swf sera chargé (sans argument ou avec une erreur)
	 */
	module.exports = function display(ressource, options, next) {
	  try {
	    var baseSwf, swfUrl, swfOpt;
	    var container = options.container;
	    if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");
	
	    // on enverra le résultat à la fermeture (si y'a eu un chargement, isLoaded sert de flag)
	    if (options.resultatCallback && window.addEventListener) {
	      window.addEventListener('unload', function () {
	        log("unload am");
	        var resultat = {
	          ressType: 'am',
	          ressId: ressource.oid,
	          score: 1,
	          fin: true,
	          deferSync: true
	        };
	        if (options.sesatheque) resultat.sesatheque = options.sesatheque;
	        if (isLoaded) options.resultatCallback(resultat);
	        // sinon le swf n'a pas été chargé, on envoie rien
	      });
	    }
	    var params = ressource.parametres;
	
	    log('start am display avec la ressource', ressource);
	    //les params minimaux
	    if (!ressource.oid || !ressource.titre || !params) {
	      throw new Error("Paramètres manquants");
	    }
	    // init de ressOid en global à ce module (pour les appels ultérieurs de getResultat)
	    ressOid = ressource.oid;
	
	    // On réinitialise le conteneur
	    dom.empty(container);
	
	    // notre base (si ça vient pas de l'interface de développement des exo mathenpoche
	    // faudra le préciser via ressource.parametres.baseUrl)
	    if (ressource.origine !== 'am' && ressource.parametres.baseUrl) baseSwf = ressource.parametres.baseUrl;else baseSwf = "http://mep-col.sesamath.net/dev/aides/" + (params.mep_langue_id ? params.mep_langue_id : 'fr');
	    // url du swf
	    swfUrl = baseSwf + '/aide' + ressource.idOrigine + ".swf";
	    // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
	    container.setAttribute("width", 735);
	    container.style.width = '735px';
	
	    swfOpt = {
	      base: baseSwf + "/",
	      largeur: 735,
	      hauteur: 450
	    };
	    swf.load(container, swfUrl, swfOpt, function (error) {
	      if (error) {
	        next(error);
	      } else {
	        isLoaded = true;
	        next();
	      }
	    });
	  } catch (error) {
	    if (next) next(error);else page.addError(error);
	  }
	};

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

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
	'use strict';
	
	var page = __webpack_require__(3);
	var log = __webpack_require__(2);
	
	/**
	 * Charge un swf dans l'élément container
	 * @param {Element}        container L'élément html dans lequel on ajoutera
	 * @param {string}         swfHref   Le chemin vers le swf à charger
	 * @param {swfloadOptions} [options] Des paramètres utilisés pour le chargement
	 * @param {errorCallback}  next      Appelé quand le swf est chargé (mais pas forcément tout ce qu'il charge lui-même)
	 */
	function load(container, swfHref, options, next) {
	  /**
	   * Callback appelée après le chargement de swfobject
	   * @private
	   * @param {Event} e
	   */
	  function callbackFn(e) {
	    if (!next) next = function next() {};
	    if (e) {
	      if (e.success) {
	        log("Lancement de " + swfHref + ' réussi');
	        next();
	      } else {
	        var errorMsg = "Javascript fonctionne mais votre navigateur ne supporte pas les éléments Adobe Flash, impossible d'afficher cette ressource.";
	        page.addError(errorMsg);
	        next(new Error(errorMsg));
	      }
	    } else {
	      log('callback de chargement appelée sans argument');
	    }
	  }
	
	  var wd = window.document;
	  var htmlElt, largeur, hauteur, flashversion, flashvars, swfParams, swfAttributes;
	  // l'id du div html que l'on créé, qui sera remplacé par un tag object pour le swf
	  var divId = options.id || 'sesaSwf' + new Date().getTime();
	
	  // le message en attendant le chargement
	  htmlElt = wd.createElement("div");
	  htmlElt.id = divId;
	  htmlElt.appendChild(wd.createTextNode("Chargement de la ressource en cours"));
	  container.appendChild(htmlElt);
	
	  flashvars = options.flashvars || {};
	
	  // les params pour le player
	  swfParams = {
	    "menu": "false",
	    "wmode": "window",
	    "allowScriptAccess": "always" // important pour que le swf puisse communiquer avec le js de cette page
	  };
	  if (options.base) swfParams.base = options.base;
	  // et les attributs pour le loader swfobject.embedSWF
	  swfAttributes = {
	    id: divId,
	    name: divId
	  };
	  largeur = options.largeur || 400;
	  hauteur = options.hauteur || 400;
	  flashversion = options.flashversion || '8';
	
	  // swfobject.embedSWF (swfUrl, htmlId, largeur, hauteur, version_requise,
	  //    expressInstallSwfurl, flashvars, params, attributes, callbackFn)
	  page.loadAsync('swfobject', function () {
	    try {
	      window.swfobject.embedSWF(swfHref, divId, largeur, hauteur, flashversion, null, flashvars, swfParams, swfAttributes, callbackFn);
	    } catch (error) {
	      page.addError(error);
	    }
	  });
	}
	
	/**
	 * @file Un module js pour charger un swf dans un container, utilisé par plusieurs plugins de ressources (utilise swfobject)
	 */
	module.exports = { load: load };
	
	/**
	 * @typedef swfloadOptions
	 * @type {Object}
	 * @param {string} [id]        Id du div html que l'on va créer
	 * @param {Object} [flashvars] Les flashvars qui seront passées au swf
	 * @param {string} [base]      Une base à passer en paramètre au swf, tous les load lancés par le swf seront traité en relatif à cette base
	 * @param {Integer} [hauteur=400] La hauteur d'affichage imposée au swf
	 * @param {Integer} [largeur=400] La largeur d'affichage imposée au swf
	 */

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

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
	
	'use strict';
	
	var page = __webpack_require__(3);
	var dom = __webpack_require__(5);
	var log = __webpack_require__(2);
	var jstreeConverter = __webpack_require__(10);
	
	/**
	 * Affiche l'arbre, avec les boutons pour déplier les branches et afficher l'aperçu des feuilles
	 * @service plugins/arbre/display
	 * @param {Ressource}      ressource  L'objet ressource
	 * @param {displayOptions} options    Les options après init
	 * @param {errorCallback}  next       La fct à appeler quand l'arbre sera chargé (sans argument ou avec une erreur)
	 */
	module.exports = function display(ressource, options, next) {
	  var error;
	  try {
	    log('arbre.display avec', ressource);
	    if (typeof window.jQuery === 'undefined') throw new Error("jQuery n'a pas été chargé");
	    var $ = window.jQuery;
	    /* jshint jquery:true */
	    var container = options.container;
	    if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");
	    var errorsContainer = options.errorsContainer;
	    if (!errorsContainer) throw new Error("Il faut passer dans les options un conteneur html pour les erreurs");
	
	    dom.addCss(options.base + 'vendor/jstree/dist/themes/default/style.min.css');
	    page.loadAsync(['jstree'], function () {
	      var pluginBase = options.pluginBase;
	      if (!ressource.base) ressource.base = "/";
	
	      // un div d'aperçu
	      //var apercuElt = dom.getElement('iframe', {id: dom.getNewId(), width:'50%',height:'400px', style : 'float:right;resize:both;overflow:scroll;'})
	      //var apercuElt = dom.getElement('div', {id: dom.getNewId(), style : 'float:right;width:50%;height:400px;resize:both;border:none;'})
	      //dom.addElement(apercuElt, 'iframe', {style : 'width:100%;height:100%;border:none;'})
	      var apercuContainer = dom.addElement(container, 'div', {
	        style: {
	          position: 'absolute',
	          "background-color": "#fff"
	        }
	      });
	      // en global car on s'en sert souvent, pas la peine de le recalculer dans chaque fct
	      var $apercuContainer = $(apercuContainer);
	      // un flag pour savoir si on est en mode aperçu (true, false ou null)
	      var isApercu = null;
	      // l'iframe sera créée au chargement
	      var iframeApercu;
	      // quand on charge des swf, on a des erreurs
	      // Error: Permission denied to access property "toString"
	      // que l'on peut ignorer (cf http://stackoverflow.com/a/13101119)
	
	      /**
	       * Ajoute les boutons
	       * @private
	       */
	      var initApercu = function initApercu() {
	        log('init aperçu');
	        if (isApercu === null) {
	          dom.empty(apercuContainer);
	          // en relative
	          var boutons = dom.addElement(apercuContainer, 'div', {
	            style: {
	              position: 'absolute',
	              "z-index": 2,
	              float: "right",
	              "right": 0
	            }
	          });
	          var apercuFermer = dom.addElement(boutons, 'img', {
	            src: pluginBase + 'images/fermer.png',
	            alt: "fermer l'aperçu",
	            style: { float: 'right' }
	          });
	          var apercuAgrandir = dom.addElement(boutons, 'img', {
	            src: pluginBase + 'images/agrandir.png',
	            alt: "agrandir l'aperçu",
	            style: { float: 'right' }
	          });
	          var apercuReduire = dom.addElement(boutons, 'img', {
	            src: pluginBase + 'images/reduire.png',
	            alt: "réduire l'aperçu",
	            style: { float: 'right' }
	          });
	          $(apercuFermer).click(fermer);
	          $(apercuAgrandir).click(agrandir);
	          $(apercuReduire).click(reduire);
	          // on veut pas de transparent
	          $apercuContainer.css('background-color', '#fff');
	          $apercuContainer.show();
	          // on ajoute l'iframe dedans
	          iframeApercu = dom.addElement(apercuContainer, 'iframe', {
	            style: {
	              position: 'absolute',
	              "z-index": 1,
	              width: '100%',
	              height: '100%'
	            }
	          });
	          isApercu = false;
	        } else {
	          log.error('div apercu déjà initialisé');
	        }
	      };
	
	      var fermer = function fermer() {
	        log("on ferme");
	        // on vide
	        $apercuContainer.empty();
	        iframeApercu = null;
	        // on cache
	        $apercuContainer.hide();
	        isApercu = null;
	      };
	
	      var agrandir = function agrandir() {
	        log("grand");
	        if (isApercu === false) {
	          $apercuContainer.css('top', '5%');
	          $apercuContainer.css('left', '5%');
	          $apercuContainer.height('90%');
	          $apercuContainer.width('90%');
	          isApercu = true;
	        }
	      };
	
	      var reduire = function reduire() {
	        log("petit");
	        if (isApercu) {
	          $apercuContainer.height('30%');
	          $apercuContainer.width('30%');
	          $apercuContainer.css('top', '70%');
	          $apercuContainer.css('left', '70%');
	          isApercu = false;
	        }
	      };
	
	      // on crée un div pour le tree et ses compagnons
	      var caseTree = dom.addElement(container, 'div');
	      // la recherche
	      var searchContainer = dom.addElement(caseTree, "div", { class: 'search' });
	      dom.addElement(searchContainer, 'span', null, 'Mettre en valeur les titres contenant ');
	      var searchInput = dom.addElement(searchContainer, 'input', { type: 'text' });
	
	      // l'arbre
	      var treeId = dom.getNewId();
	      dom.addElement(caseTree, "div", { id: treeId });
	      // l'élément root, pas encore un array
	      var rootElt = jstreeConverter.toJstree(ressource);
	      rootElt.state = { opened: true };
	
	      var jstData = {
	        'core': {
	          'data': function data(node, next) {
	            //log('fct data', node)
	            if (node.id == '#') {
	              next(rootElt);
	            } else {
	              // faut faire l'appel ajax nous même car jstree peut pas mixer json initial + ajax ensuite
	              // @see http://git.net/jstree/msg12107.html
	              $.ajax({
	                url: node.data.url,
	                timeout: options.timeout || 10000,
	                dataType: 'json',
	                xhrFields: {
	                  withCredentials: true
	                }
	              }).success(next).error(function (jqXHR, textStatus, error) {
	                next(["Erreur lors de l'appel ajax pour récupérer les éléments"]);
	                page.addError(error);
	              });
	            }
	          }
	        },
	        plugins: ["search"]
	      };
	
	      var $tree = $('#' + treeId);
	      //log('$tree', $tree)
	      $tree.jstree(jstData);
	
	      /* Pour récupérer un élément sous sa forme jstree, c'est (id est l'id jstree, sans #)
	       * var jstNode = $.jstree.reference($tree).get_node(id)
	       * et les data que l'on a mise sont dans
	       * jstNode.original, par ex jstNode.original.a_attr['data-type']
	       */
	
	      // pour la recherche, on écoute la modif de l'input
	      var timer;
	      var $searchInput = $(searchInput);
	      $searchInput.keyup(function () {
	        // on est appelé à chaque fois qu'une touche est relachée dans cette zone de saisie
	        // on lancera la recherche dans 1/4s si y'a pas eu d'autre touche
	        if (timer) {
	          clearTimeout(timer);
	        }
	        timer = setTimeout(function () {
	          var v = $searchInput.val();
	          $tree.jstree(true).search(v);
	        }, 250);
	      });
	
	      // pour l'aperçu, on peut pas écouter les clic sur a.jstree-anchor ni li.jstree-node car jstree les intercepte
	      // on écoute donc l'événement select sur le jstree
	      $tree.on('select_node.jstree', function (e, data) {
	        var jstNode = data.node.original;
	        log("on veut l'aperçu du node", jstNode);
	        if (jstNode && jstNode.a_attr) {
	          if (jstNode.a_attr['data-type'] === 'arbre') {
	            // on fait du toggle
	            if ($tree.jstree('is_open', data.node)) $tree.jstree('close_node', data.node);else $tree.jstree('open_node', data.node);
	          } else {
	            if (isApercu === null) initApercu();
	            // on resize avant chargement
	            agrandir();
	            // et on lui file une url à charger
	            log("on va charger " + jstNode.a_attr.href);
	            iframeApercu.src = jstNode.a_attr.href;
	          }
	        }
	        /*
	         var href = data.rslt.obj.children("a").attr("href")
	         // this will load content into a div:
	         $("#contents").load(href)
	         // this will follow the link:
	         document.location.href = href; */
	      });
	    });
	  } catch (e) {
	    error = e;
	  }
	  if (next) next(error);else if (error) page.addError(error);
	}; // display

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

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
	'use strict';
	
	var log = __webpack_require__(2);
	
	var baseUrl;
	
	/**
	 * Retourne les datas qui nous intéressent à mettre sur le tag a
	 * (pour a_attr : data-ref, data-type, href et alt)
	 * @private
	 * @return {Object}
	 */
	function getAttr(ressource, defaultBase) {
	  var attr = {};
	  var base = ressource.base || defaultBase || baseUrl;
	  if (base && base.substr(-1) !== "/") base += "/";
	  // ref
	  var ref = ressource.id || ressource.ref || ressource.oid;
	  if (!ref && ressource.origine && ressource.idOrigine) ref = ressource.origine + '/' + ressource.idOrigine;
	  var isPublic = ressource.public || !ressource.restriction;
	  var displayUrl = ressource.displayUrl;
	  var dataUrl = ressource.dataUrl;
	  if (ref) {
	    attr['data-ref'] = ref;
	    if (!displayUrl) {
	      if (isPublic) displayUrl = base + 'public/voir/' + ref;else if (ressource.cle) displayUrl = base + 'public/voir/cle/' + ressource.cle;else displayUrl = base + 'ressource/voir/' + ref;
	    }
	    if (!dataUrl) {
	      if (isPublic) dataUrl = base + 'api/public/' + ref;else if (ressource.cle) dataUrl = base + 'api/public/cle/' + ressource.cle;else dataUrl = base + 'api/ressource/' + ref;
	    }
	  } else if (ressource.cle) {
	    if (!displayUrl) displayUrl = base + 'public/voir/cle/' + ressource.cle;
	    if (!dataUrl) dataUrl = base + 'api/public/cle/' + ressource.cle;
	  }
	  if (displayUrl) {
	    attr.href = displayUrl;
	    attr['data-displayurl'] = displayUrl;
	  }
	  if (dataUrl) attr['data-dataurl'] = dataUrl;
	  if (ressource.type) attr['data-type'] = ressource.type;
	  if (ressource.resume) attr.alt = ressource.resume;
	
	  return attr;
	}
	
	/**
	 * Retourne un node jstree (propriétés text, icon et a_attr qui porte nos data)
	 * @see http://www.jstree.com/docs/json/ pour le format
	 * @param {Ressource} ressource
	 * @param {string}    [defaultBase]
	 */
	function getJstNode(ressource, defaultBase) {
	  var node;
	  if (ressource) {
	    node = {
	      text: ressource.titre,
	      a_attr: getAttr(ressource, defaultBase),
	      icon: ressource.type + 'JstNode'
	    };
	  } else throw new Error("getJstNode appelé sans ressource");
	
	  return node;
	}
	
	/**
	 * Retourne un tableau children au format jstree
	 * @param {string} nodeId Le nodeId dont on veut les enfants, passer '#' ou null pour la racine
	 *               (pour trouver l'objet jstree._model.data[nodeId])
	 * @param {object} jstree L'objet jstree complet, retourné par $.jstree.reference('#leTree')
	 * @return {Array} Le tableau des enfants de nodeId
	 */
	function getEnfants(nodeId, jstree) {
	  //log('getEnfants de ' +nodeId, jstree)
	  var enfants = [];
	  var i = 0;
	  try {
	    if (!nodeId) nodeId = '#';
	    var root = jstree._model.data;
	    root[nodeId].children.forEach(function (rootChildId) {
	      var child = root[rootChildId];
	      var enfant = toRef(child, jstree);
	      if (i < 5) {
	        log("traitement child", child);
	        log("devenu", enfant);
	        i++;
	      }
	      if (enfant && (enfant.ref || enfant.type === 'arbre')) enfants.push(enfant);else log.error("Pb de conversion du child, ni ref ni arbre", child);
	    });
	  } catch (error) {
	    log.error(error);
	  }
	  //log("pour " +nodeId +" on va retourner", enfants)
	
	  return enfants;
	}
	
	/**
	 * Retourne un tableau children au format jstree
	 * @param {Ressource} ressource
	 * @param {string}    [defaultBase]
	 * @return {Array} Le tableau des enfants
	 */
	function getJstreeChildren(ressource, defaultBase) {
	  var base = ressource.base || defaultBase || baseUrl;
	  if (base.substr(-1) !== "/") base += "/";
	  var children = [];
	  if (ressource.type === 'arbre' && ressource.enfants && ressource.enfants.forEach) {
	    ressource.enfants.forEach(function (enfant) {
	      var child;
	      if (enfant.type === 'arbre') {
	        child = toJstree(enfant, base);
	      } else {
	        child = getJstNode(enfant, base);
	      }
	      children.push(child);
	    });
	  }
	
	  return children;
	}
	
	/**
	 * Affecte la base de la sésathèque pour les urls mis dans les éléments de l'arbre
	 * (sinon ces urls seront absolues sur le domaine courant)
	 * @param {string} url L'url de base http://domaine.tld:port de la sesatheque
	 */
	function setBaseUrl(url) {
	  if (typeof url === 'string') {
	    if (url.substr(-1) === '/') url = url.substr(0, url.length - 1);
	    baseUrl = url;
	  }
	}
	
	/**
	 * Transforme un ressource de la bibli en node pour jstree
	 * (il faudra le mettre dans un tableau, à un seul élément si c'est un arbre)
	 * @param {Ressource|Alias} ressource Une ressource ou une référence à une ressource
	 * @param {string}          [defaultBase]
	 * @returns {Object}
	 */
	function toJstree(ressource, defaultBase) {
	  var base = ressource.base || defaultBase || baseUrl;
	  if (base.substr(-1) !== "/") base += "/";
	  var node = getJstNode(ressource, base);
	  if (ressource.type === 'arbre') {
	    if (ressource.enfants && ressource.enfants.length) {
	      node.children = getJstreeChildren(ressource, base);
	    } else {
	      // url pour récupérer les enfants
	      var path;
	      if (ressource.oid) path = 'api/jstree?ref=' + ressource.oid;else if (ressource.ref) path = 'api/jstree?ref=' + ressource.ref;else if (ressource.origine && ressource.idOrigine) path = 'api/jstree?ref=' + ressource.origine + '/' + ressource.idOrigine;
	      if (path) {
	        node.children = true;
	        node.data = { url: base + path + '&children=1' };
	      }
	    }
	  }
	
	  return node;
	}
	
	/**
	 * Retourne une Ref à partir d'un node jstree
	 * @param {jQueryElement} node Un element de l'objet reference jstree _model.data[childId]
	 * @param {object} jstree L'objet jstree complet, retourné par $.jstree.reference('#leTree')
	 * @returns {Ref} La ref (presque, ref, titre, type, avec displayUrl & resume en plus,
	 *                mais pas categories, et enfants seulement si on passe le jstree complet)
	 */
	function toRef(node, jstree) {
	  //log('toRef de', node)
	  var item = {};
	  var nodeSrc;
	  if (node.text && node.a_attr) {
	    nodeSrc = node;
	  } else if (node.original) {
	    nodeSrc = node.original;
	  } else {
	    log.error("node impossible à convertir en ref", node);
	  }
	  if (nodeSrc) {
	    item.titre = nodeSrc.text;
	    if (nodeSrc.a_attr) {
	      item.type = nodeSrc.a_attr['data-type'];
	      if (item.type === 'arbre' && node.children && node.children.length && jstree) {
	        item.enfants = getEnfants(node.id, jstree);
	      }
	      if (nodeSrc.a_attr['data-displayurl']) item.displayUrl = nodeSrc.a_attr['data-displayurl'];
	      if (nodeSrc.a_attr['data-dataurl']) item.dataUrl = nodeSrc.a_attr['data-dataurl'];
	      if (nodeSrc.a_attr['data-ref']) item.ref = nodeSrc.a_attr['data-ref'];
	      if (nodeSrc.a_attr.alt) item.resume = nodeSrc.a_attr.alt;
	    }
	    //log('converti en', item)
	  }
	
	  return item;
	}
	
	/**
	 * Exporte des méthodes pour convertir ou manipuler des jstree
	 * @service display/jstreeConverter
	 */
	var jstreeConverter = {
	  getJstNode: getJstNode,
	  getEnfants: getEnfants,
	  getJstreeChildren: getJstreeChildren,
	  setBaseUrl: setBaseUrl,
	  toJstree: toJstree,
	  toRef: toRef
	};
	
	module.exports = jstreeConverter;

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

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
	
	'use strict';
	
	var page = __webpack_require__(3);
	var dom = __webpack_require__(5);
	var log = __webpack_require__(2);
	
	var isLoaded;
	
	/**
	 * Affiche une ressource ato
	 * @service plugins/ato/display
	 * @param {Ressource}      ressource  L'objet ressource
	 * @param {displayOptions} options    Les options après init
	 * @param {errorCallback}  next       La fct à appeler quand l'atome sera chargé (sans argument ou avec une erreur)
	 */
	module.exports = function display(ressource, options, next) {
	
	  function loaded() {
	    isLoaded = true;
	    if (next) next();
	  }
	
	  try {
	    var container = options.container;
	    if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");
	
	    // on enverra un résultat seulement à la fermeture
	    if (options.resultatCallback && container.addEventListener) {
	      container.addEventListener('unload', function () {
	        if (isLoaded) {
	          options.resultatCallback({
	            ressType: 'ato',
	            ressOid: ressource.oid,
	            score: 1
	          });
	        }
	      });
	    }
	
	    log('start ato display avec la ressource', ressource);
	    //les params minimaux
	    if (!ressource.oid || !ressource.titre) {
	      throw new Error("Paramètres manquants");
	    }
	
	    // On réinitialise le conteneur
	    dom.empty(container);
	
	    var url = "http://mep-outils.sesamath.net/manuel_numerique/diapo.php?env=ressource&atome=" + ressource.idOrigine;
	    var iframe = dom.addElement(container, 'iframe', { src: url, style: "width:100%;height:100%" });
	    if (iframe.addEventListener) iframe.addEventListener("load", loaded);else loaded();
	  } catch (error) {
	    if (next) next(error);else page.addError(error);
	  }
	};

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

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
	'use strict';
	
	var page = __webpack_require__(3);
	var dom = __webpack_require__(5);
	var log = __webpack_require__(2);
	var swf = __webpack_require__(8);
	
	/**
	 * contient l'historique des réponses de chaque question (utilisé par window.com_calkc_resultat que le swf appelle)
	 * @private
	 */
	var histoReponses = [];
	
	/**
	 * Affiche une ressource calkc
	 * @service plugins/calkc/display
	 * @param {Ressource}      ressource  L'objet ressource
	 * @param {displayOptions} options    Les options après init
	 * @param {errorCallback}  next       La fct à appeler quand le contenu sera chargé
	 */
	module.exports = function display(ressource, options, next) {
	  try {
	    log('start calkc display avec la ressource', ressource);
	    var swfUrl;
	    //les params minimaux
	    if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.xml) {
	      throw new Error("Paramètres manquants");
	    }
	    var container = options.container;
	    if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");
	
	    // On réinitialise le conteneur
	    dom.empty(container);
	    // Ajout css
	    dom.addCss(options.pluginBase + 'calkc.css');
	
	    // callback de réponse (toujours appelée par le swf) exportée dans le dom (nom en dur dans le swf)
	    if (options.resultatCallback) {
	      /**
	       * Mis en global par le plugin calkc (ne fait rien si aucune callback de résultat n'est fournie),
	       * car appelée par calkc.swf à la validation d'une opération.
	       * Renverra le résultat formaté à la callback passée via les options
	       * @global
	       */
	      window.com_calkc_resultat = function (nombrequestions, numeroquestion, reponse) {
	        // reponse est de la forme 1#+#1#egal#2#|13|ok
	        // reponse comporte la liste des touches tapées|le temps écoulé|ok/suite/tard
	        histoReponses.push([nombrequestions, reponse]);
	        options.resultatCallback({ reponse: histoReponses });
	      };
	    } else {
	      window.com_calkc_resultat = function () {};
	    }
	
	    // url du swf
	    swfUrl = options.pluginBase + 'calkc.swf';
	    // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
	    container.setAttribute("width", 589);
	    var swfOptions = {
	      largeur: 589,
	      hauteur: 393,
	      flashvars: {
	        parametres_xml: ressource.parametres.xml.replace('\\n', '').replace('\n', '')
	      }
	    };
	    log('appel swfobject avec', swfOptions);
	    swf.load(container, swfUrl, swfOptions, next);
	  } catch (error) {
	    if (next) next(error);else page.addError(error);
	  }
	};

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

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
	'use strict';
	
	var page = __webpack_require__(3);
	var dom = __webpack_require__(5);
	var log = __webpack_require__(2);
	
	var baseCollDoc = "http://ressources.sesamath.net";
	
	/**
	 * Affiche la ressource coll_doc (atome de manuel ou cahier)
	 * @service plugins/coll_doc/display
	 * @param {Ressource}      ressource  L'objet ressource
	 * @param {displayOptions} options    Les options après init
	 * @param {errorCallback}  [next]     La fct à appeler quand le contenu sera chargé (sans argument ou avec une erreur)
	 */
	module.exports = function display(ressource, options, next) {
	  try {
	    var container = options.container;
	    if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");
	
	    // on enverra le résultat à la fermeture
	    if (options.resultatCallback && container.addEventListener) {
	      container.addEventListener('unload', function () {
	        var resultat = {
	          ressType: 'coll_doc',
	          ressId: ressource.oid,
	          score: 1
	        };
	        if (options.sesatheque) resultat.sesatheque = options.sesatheque;
	        options.resultatCallback(resultat);
	      });
	    }
	
	    log('start coll_doc display avec la ressource', ressource);
	    //les params minimaux
	    if (!ressource.oid || !ressource.titre || !ressource.parametres) {
	      throw new Error("Paramètres manquants");
	    }
	    var url;
	    try {
	      url = ressource.parametres.url || ressource.parametres.files[0].uri;
	    } catch (error) {
	      log.error(error);
	      throw new Error("Il manque l'adresse de cette ressource dans ses paramètres");
	    }
	    // On réinitialise le conteneur
	    dom.empty(container);
	    if (ressource.parametres.url) {
	      // on affiche le lecteur d'origine
	      dom.addElement(container, 'iframe', { src: url, style: "width:100%;height:100%", onload: next });
	    } else if (url) {
	      // on affiche les lien de téléchargement
	      var msg;
	      if (ressource.parametres.files.length > 1) msg = "Fichiers composant la ressource";else msg = "Voici le lien pour télécharger la ressource";
	      var ul = dom.addElement(container, 'ul', null, msg);
	      ressource.parametres.files.forEach(function (file) {
	        var li = dom.addElement(ul, 'li');
	        if (file.uri) {
	          url = baseCollDoc + file.uri;
	          var pos = file.uri.lastIndexOf('/');
	          var name = file.uri.substr(pos + 1);
	          dom.addElement(li, 'a', { href: url }, name);
	        } else {
	          dom.addElement(li, 'span', { class: "error" }, "Url manquante");
	        }
	      });
	      next();
	    }
	  } catch (error) {
	    if (next) next(error);else page.addError(error);
	  }
	};

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

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
	'use strict';
	
	var page = __webpack_require__(3);
	var tools = __webpack_require__(4);
	var dom = __webpack_require__(5);
	var log = __webpack_require__(2);
	var swf = __webpack_require__(8);
	
	/**
	 * Affiche la ressource ec2 (exercices calculatice en flash)
	 * @service plugins/ec2/display
	 * @param {Ressource}      ressource  L'objet ressource
	 * @param {displayOptions} options    Possibilité de passer ec2Base pour modifier http://ressources.sesamath.net/replication_calculatice/flash
	 * @param {errorCallback}  next       La fct à appeler quand le swf sera chargé
	 */
	module.exports = function display(ressource, options, next) {
	  try {
	    var ec2Base = tools.getURLParameter("ec2Base") || options.ec2Base || "http://ressources.sesamath.net/replication_calculatice/flash";
	    var swfUrl;
	
	    log('start ec2 display avec la ressource', ressource);
	    //les params minimaux
	    if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.swf) {
	      throw new Error("Paramètres manquants");
	    }
	    // le swf
	    swfUrl = ec2Base + '/' + ressource.parametres.swf;
	    // les fcts exportées pour le swf
	    var optionsChargement = ressource.parametres.json || "defaut";
	    window.charger_options = function () {
	      return optionsChargement;
	    };
	
	    window.enregistrer_score = function (datasCalculatice) {
	      if (options && options.resultatCallback) {
	        log("résultats reçus", datasCalculatice);
	        options.resultatCallback({ reponse: datasCalculatice });
	      }
	    };
	
	    // On réinitialise le conteneur
	    dom.empty(options.container);
	
	    // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
	    options.container.setAttribute("width", 735); // change rien avec ff
	    options.container.style.width = '735px';
	
	    var swfOptions = {
	      largeur: 735,
	      hauteur: 450,
	      base: ec2Base + '/',
	      flashvars: {
	        contexte: 'LaboMEP', // encore utile ça ?
	        statut: 'eleve'
	      }
	    };
	
	    swf.load(options.container, swfUrl, swfOptions, next);
	  } catch (error) {
	    if (next) next(error);else page.addError(error);
	  }
	};

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var require;/**
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
	'use strict';
	
	var page = __webpack_require__(3);
	var tools = __webpack_require__(4);
	var dom = __webpack_require__(5);
	var log = __webpack_require__(2);
	
	/**
	 * Affiche les ressources ecjs (exercices calculatice en javascript)
	 * inspiré de http://calculatice.ac-lille.fr/calculatice/bibliotheque/javascript/api/
	 * @service plugins/ecjs/display
	 * @param {Ressource}      ressource  L'objet ressource
	 * @param {displayOptions} options    Possibilité de passer ecjsBase pour modifier http://ressources.sesamath.net/replication_calculatice/javascript
	 * @param {errorCallback}  [next]     La fct à appeler quand le swf sera chargé
	 */
	module.exports = function display(ressource, options, next) {
	  /*global head*/
	  try {
	    // vérifs de base
	    if (!options.container) throw new Error("Paramétrage manquant (conteneur)");
	    if (!ressource.parametres.fichierjs) throw new Error("Paramétrage manquant (nom de l'exercice à lancer)");
	
	    // pour utiliser le serveur de calculatice mettre http://calculatice.ac-lille.fr/calculatice/bibliotheque/javascript
	    var ecjsBase = tools.getURLParameter("ecjsBase") || options.ecjsBase || "http://ressources.sesamath.net/replication_calculatice/javascript";
	
	    // d'après {ecjsBase}/api/clc-api.main.js
	    // celui-là détruit notre style et semble ne rien apporter dans les exos
	    //"http://calculatice.ac-lille.fr/calculatice/squelettes/css/clear.css",
	    dom.addCss(ecjsBase + "/lib-externes/jquery/css/start/jquery-ui-1.10.4.custom.min.css");
	    dom.addCss(ecjsBase + "/clc/css/clc.css");
	    // si on prend pas le css original qui reset html et body, ça casse tout (le rectangle clc s'affiche pas),
	    // mais en le laissant ça casse nos styles, faudrait le mettre toujours en iframe :-/
	    head.ready(function () {
	      // on attend que tout soit fini pour virer require que Raphael et Big ne supportent pas
	      // on espère que plus personne n'en aura besoin
	      if (true) require = undefined; // jshint ignore:line
	      if (true) __webpack_require__(16) = undefined; // jshint ignore:line
	      // Cf /home/sesamath/bin/fetchCalculatice.sh qui tourne sur le serveur web ressources.sesamath.net
	      // pour la liste des js concaténés dans scripts.js
	      head.load(ecjsBase + "/scripts.js", function () {
	        // on vérifie que l'on a tous les objets globaux souhaités
	        var glob = ["Modernizr", "$", "SVG", "Raphael", "Big", "createjs", "CLC"];
	        var prop, i;
	        for (i = 0; i < glob.length; i++) {
	          prop = glob[i];
	          if (typeof window[prop] === "undefined") throw new Error("Problème de chargement, " + prop + " n'existe pas");
	        }
	
	        /*global CLC, $*/
	        function envoyerScoreExoJs(event, data) {
	          log("résultats reçus du js calculatice", data);
	          resultatSent = true; // même si ça plante, pas la peine de recommencer au unload
	          var dataToSend = {
	            fin: true
	          };
	          if (data.total > 0) {
	            var score = parseInt(data.score, 10) || 0;
	            dataToSend.score = score / data.total;
	            dataToSend.reponse = score + " sur " + data.total;
	          } else {
	            dataToSend.reponse = "score indéterminé";
	          }
	          if (options && options.resultatCallback) {
	            options.resultatCallback(dataToSend);
	          }
	        }
	
	        // On réinitialise le conteneur
	        var container = options.container;
	        dom.empty(container);
	        var exoClc = dom.addElement(container, 'div', { id: "exoclc", style: { margin: "0 auto", width: "735px" } });
	        var footer = dom.addElement(container, 'p', {
	          style: {
	            "text-align": "right",
	            margin: "0 auto",
	            width: "735px"
	          }
	        }, "Exercice original provenant du site ");
	        dom.addElement(footer, 'a', { href: "http://calculatice.ac-lille.fr/", target: "_blank" }, "Calcul@tice");
	        var $exoClc = $(exoClc);
	        // les options et le nom de l'exo
	        var optionsClc = ressource.parametres.options || {};
	        optionsClc.parametrable = !!options.isFormateur || options.optionsClcCallback;
	        var nomExo = ressource.parametres.fichierjs;
	        var cheminExo = ecjsBase + "/exercices/";
	        var exoLoaded = false;
	        var isLoaded;
	        var resultatSent = false;
	
	        // si ça intéresse l'appelant et que le chargement est KO on finira par le dire après 10s
	        if (next && typeof next === "function") {
	          setTimeout(function () {
	            if (!exoLoaded) next(new Error("Exercice calculatice toujours pas chargé après 10s"));
	          }, 10000); // on laisse 10s avant d'envoyer une erreur de chargement
	        }
	        // on envoie un score vide au unload si rien n'a été envoyé avant
	        if (options && options.resultatCallback) {
	          // on ajoute un envoi au unload si rien n'a été envoyé avant
	          window.addEventListener('unload', function () {
	            log("unload ecjs");
	            if (isLoaded && !resultatSent) {
	              envoyerScoreExoJs(null, {
	                score: 0,
	                reponse: "Aucune réponse",
	                fin: true
	              });
	            }
	          });
	        }
	        // cree un exo de maniere asynchrone
	        var reqExo = CLC.loadExo(cheminExo + nomExo, optionsClc);
	
	        // quand l'exo est pret on le met dans son div
	        reqExo.done(function (exercice) {
	          log("exo clc", exercice);
	          $exoClc.html(exercice);
	          isLoaded = true;
	          // le 2e arg se retrouve dans event.data (event 1er arg passé à la callback)
	          // pour la liste des événements, chercher "publier" dans les sources calculatice
	          // on a validationQuestion, validationOption, finExercice
	          // l'evt est lancé sur
	          // pour finExercice on récupère {idExo, numExo, score {int, nb de bonnes réponses}, total {int, nb total de questions}, duree {int, en secondes}}
	          exercice.on("finExercice", null, envoyerScoreExoJs);
	          if (next && typeof next === "function") {
	            exoLoaded = true;
	            next();
	          }
	          // si l'utilisateur veut récupérer les paramètres, on les lui affiche directement
	          if (typeof options.optionsClcCallback === "function") {
	            exercice.on('validationOption', null, function (event, optionsClc) {
	              options.optionsClcCallback(optionsClc);
	            });
	            $exoClc.ready(function () {
	              // on a pas d'événement sur l'exo chargé, faut attendre que le js de calculatice ait complété le dom
	              var i = 0;
	
	              function delayOptions() {
	                if (i++ < 300) {
	                  setTimeout(function () {
	                    var $button = $('button.parametrer');
	                    if ($button.length > 0) {
	                      if ($button.length > 1) {
	                        log.error("On a plusieurs boutons qui répondent au sélecteur 'button .bouton.parametrer'");
	                        $button = $button.first();
	                      }
	                      log("on a trouvé le bouton après " + i * 10 + "ms d'attente");
	                      $button.click();
	                      i = 0;
	                      delayOptionsValidate();
	                    } else {
	                      delayOptions();
	                    }
	                  }, 10);
	                } else {
	                  log.error("Pas trouvé le bouton paramétrer après 5s", $exoClc.html());
	                }
	              }
	
	              function delayOptionsValidate() {
	                if (i++ < 300) {
	                  setTimeout(function () {
	                    var $button = $('button.tester-parametre');
	                    if ($button.length > 0) {
	                      if ($button.length > 1) {
	                        log.error("On a plusieurs boutons qui répondent au sélecteur 'button.tester-parametre'");
	                        $button = $button.first();
	                      }
	                      log("on a trouvé le bouton valider après " + i * 10 + "ms d'attente");
	                      $button.hide();
	                    } else {
	                      delayOptionsValidate();
	                    }
	                  }, 10);
	                } else {
	                  log.error("Pas trouvé le bouton paramétrer après 5s", $exoClc.html());
	                }
	                //$('button.tester-parametre').hide()
	              }
	
	              delayOptions();
	            });
	          }
	        });
	      });
	    });
	  } catch (error) {
	    if (next) next(error);else page.addError(error);
	  }
	};

/***/ },
/* 16 */
/***/ function(module, exports) {

	module.exports = function() { throw new Error("define cannot be used indirect"); };


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

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
	'use strict';
	
	var page = __webpack_require__(3);
	var dom = __webpack_require__(5);
	var log = __webpack_require__(2);
	var swf = __webpack_require__(8);
	
	var ressId;
	var ressType = 'em';
	var isLoaded, lastResult;
	
	/**
	 * afficher les ressource em (exercices mathenpoche, en flash)
	 * @service plugins/em/display
	 * @param {Ressource}      ressource  L'objet ressource
	 * @param {displayOptions} options    Les options après init
	 * @param {errorCallback}  next       La fct à appeler quand le swf sera chargé
	 */
	module.exports = function display(ressource, options, next) {
	  try {
	    var container = options.container;
	    if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");
	    var errorsContainer = options.errorsContainer;
	    if (!errorsContainer) throw new Error("Il faut passer dans les options un conteneur html pour les erreurs");
	
	    /** class utilisée dans notre css */
	    var cssClass = 'mepRess';
	    var params = ressource.parametres;
	    var baseMepSwf, idSwf, swfUrl, largeur, hauteur, flashvars;
	
	    // l'id du div html que l'on créé, qui sera remplacé par un tag object pour le swf
	    ressId = ressource.oid;
	
	    log('start display em avec la ressource (+options)', ressource, options);
	    //les params minimaux
	    if (!ressource.oid || !ressource.titre || !params) {
	      throw new Error("Paramètres manquants");
	    }
	
	    // Ajout css
	    if (options.baseUrl) dom.addCss(options.baseUrl + 'mep.css'); // si on a pas tant pis pour le css
	    container.className = cssClass;
	
	    // le message en attendant le chargement
	    dom.empty(container);
	    var loadingElt = dom.addElement(container, 'p', {}, "Chargement de la ressource " + ressource.oid + " en cours.");
	
	    // notre base
	    if (ressource.origine !== 'em' && ressource.baseUrl) baseMepSwf = ressource.baseUrl;else if (options.verbose) baseMepSwf = "http://mep-col.devsesamath.net/dev/swf";else baseMepSwf = "http://mep-col.sesamath.net/dev/swf";
	    // id du swf
	    idSwf = Number(params.swf_id ? params.swf_id : ressource.idOrigine);
	    // url du swf
	    swfUrl = baseMepSwf + '/exo' + idSwf + ".swf";
	    /**
	     * Lance le chargement avec swfobject
	     */
	    if (params.mep_modele === 'mep2lyc') {
	      largeur = 959;
	      hauteur = 618;
	    } else {
	      largeur = 735;
	      hauteur = 450;
	    }
	    // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
	    if (container.style) container.style.width = largeur + 'px';else container.setAttribute("width", largeur + 'px'); // marche pas avec chrome ou ff
	
	    /** @see http://redmine.sesamath.net/projects/alibaba/wiki/ExosMep pour les flashvars à passer */
	    flashvars = options.flashvars || {};
	    // ces flashvars pour le swf sont obligatoires et on les impose ici
	    flashvars.idMep = Number(ressource.idOrigine);
	    flashvars.modeleMep = params.mep_modele === "mep1" ? "1" : "2";
	    flashvars.abreviationLangue = params.mep_langue_id;
	    flashvars.idSwf = idSwf;
	    // si n on a pas de chiffrement de la réponse qui sera une string au format "vrrp..."
	    // (sinon c'est un nombre qui correspond à cette réponse chiffrée)
	    // et la propriété score est ajoutée (un entier donnant le nb de bonnes réponses)
	    flashvars.ch = options.ch || 'n';
	    // ensuite le facultatif si présent
	    if (params.aide_id) flashvars.idAide = Number(params.aide_id);
	    // pour les profs (passer les questions et voir l'aide)
	    if (options.isFormateur) {
	      log("affichage par un formateur, on désactive le score et regarde si on peut activer le bouton suite et l'aide (suivant ressource)");
	      // à l'import on ne met pas ces valeurs si c'est o (valeur par défaut)
	      if (params.suite_formateur) flashvars.isBoutonSuite = params.suite_formateur;else flashvars.isBoutonSuite = "o";
	      if (params.aide_formateur) flashvars.isBoutonAide = params.aide_formateur;else flashvars.isBoutonAide = "o";
	    }
	    // 0 ressources publiques en 2013-11, mais qq unes dans MEPS pas publiées
	    if (params.nb_wnk) flashvars.mep_nb_wnk = params.nb_wnk;
	
	    // traitement du résultat éventuel
	    if (options.resultatCallback && !options.isFormateur) {
	      // faut une fonction qui va transformer le résultat au format attendu
	      // et la pour rendre accessible au swf dans son dom
	      window.resultatCallback = function (result) {
	        log("resultatCallback em reçoit", result);
	        var resultMod = {
	          reponse: result.reponse,
	          nbq: result.nbq || params.nbq_defaut,
	          ressId: ressId,
	          ressType: ressType,
	          fin: result.fin === "o",
	          original: result
	        };
	        // le score sera calculé d'après la réponse juste avant enregistrement en bdd
	        // (après déchiffrement coté serveur), mais si c'est j3p qui charge il veut l'intercepter
	        if (resultMod.nbq) {
	          resultMod.score = result.score / resultMod.nbq;
	        } else {
	          resultMod.score = null;
	        }
	        lastResult = resultMod;
	
	        options.resultatCallback(resultMod);
	      };
	
	      // on ajoute un envoi au unload si rien n'a été envoyé avant
	      window.addEventListener('unload', function () {
	        log("unload em");
	        if (isLoaded && !lastResult) {
	          lastResult = {
	            reponse: "",
	            nbq: params.nbq_defaut,
	            ressId: ressId,
	            ressType: ressType,
	            original: null,
	            fin: true,
	            deferSync: true
	          };
	          options.resultatCallback(lastResult);
	        }
	        // sinon le swf n'a pas été chargé ou il a déjà envoyé une réponse et on envoie rien au unload
	      });
	
	      flashvars.nomFonctionCallback = 'resultatCallback';
	    }
	
	    var swfOptions = {
	      flashvars: flashvars,
	      largeur: largeur,
	      hauteur: hauteur,
	      flashversion: 8,
	      base: baseMepSwf + "/"
	    };
	    // pour debug
	    log('flashvars', flashvars);
	    swf.load(container, swfUrl, swfOptions, function (error) {
	      if (!error) log('chargement du swf ok');
	      container.removeChild(loadingElt);
	      if (next) next();
	    });
	  } catch (error) {
	    if (next) next(error);else page.addError(error);
	  }
	};

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

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
	'use strict';
	
	var page = __webpack_require__(3);
	var dom = __webpack_require__(5);
	var log = __webpack_require__(2);
	
	var isLoaded;
	
	/**
	 * Affiche une ressource iep (animation instrumenpoche)
	 * @service plugins/iep/display
	 * @param {Ressource}      ressource  L'objet ressource (une ressource iep a en parametres soit une propriété url
	 *                                      avec l'url du xml soit une propriété xml avec la string xml)
	 * @param {displayOptions} options    Les options après init
	 * @param {errorCallback}  next       La fct à appeler quand l'iep sera chargé (sans argument ou avec une erreur)
	 */
	module.exports = function display(ressource, options, next) {
	
	  /**
	   * Affiche le xml dans le conteneur passé en options
	   * @private
	   * @param xml
	   */
	  function affiche(xml) {
	    //log("on va afficher le xml : " +xml)
	    // On réinitialise le conteneur
	    dom.empty(container);
	    var error;
	    var width = ressource.parametres.width || container.offsetWidth || 800;
	    var height = ressource.parametres.height || width * 0.75 || 600;
	    // pour créer le svg, ceci marche pas (il reste à 0 de hauteur), faut passer par createElementNS
	    //var svg = dom.addElement(container, 'svg', {id:'svg', width:"800px", height:"500px", xmlns:"http://www.w3.org/2000/svg"})
	    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	    svg.setAttributeNS(null, "width", width);
	    svg.setAttributeNS(null, "height", height);
	    svg.style.display = "block";
	    container.appendChild(svg);
	    if (window.iep.iepApp) {
	      var app = new window.iep.iepApp();
	      app.addDoc(svg, xml);
	    } else {
	      error = new Error("Problème de chargement du moteur instrumenpoche (constructeur iepApp absent)");
	    }
	    if (next) next(error);else if (error) page.addError(error);
	  }
	
	  try {
	    log('start iep display avec la ressource', ressource);
	    var container = options.container;
	    if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");
	    //les params minimaux
	    if (!ressource.oid || !ressource.titre || !ressource.parametres) throw new Error("Paramètres manquants");
	    if (!ressource.parametres.url && !ressource.parametres.xml) throw new Error("Pas de script instrumenpoche en paramètre");
	
	    // on enverra un résultat seulement à la fermeture
	    if (options.resultatCallback && container.addEventListener) {
	      container.addEventListener('unload', function () {
	        if (isLoaded) {
	          options.resultatCallback({
	            ressType: 'iep',
	            ressOid: ressource.oid,
	            score: 1
	          });
	        }
	      });
	    }
	    var xml = ressource.parametres.xml;
	    var url = ressource.parametres.url;
	    var isExternal = url && !xml;
	    page.loadAsync(['mathjax', 'http://iep.sesamath.net/iepjsmin.js'], function () {
	      /*global MathJax*/
	      MathJax.Hub.Config({
	        tex2jax: {
	          inlineMath: [["$", "$"], ["\\(", "\\)"]]
	        },
	        jax: ["input/TeX", "output/SVG"],
	        TeX: { extensions: ["color.js"] },
	        messageStyle: 'none'
	      });
	      MathJax.Hub.Queue(function () {
	        if (isExternal) {
	          // faut aller chercher la source
	          var xhr = __webpack_require__(1);
	          var options = {};
	          if (url.indexOf(".php?") > 0) options.withCredentials = true;
	          xhr.get(url, options, function (error, xml) {
	            if (error) {
	              log.error(error);
	              page.addError("L'appel de " + url + " a échoué");
	            } else {
	              affiche(xml);
	            }
	          });
	        } else {
	          affiche(xml);
	        }
	      });
	    });
	  } catch (error) {
	    if (next) next(error);else page.addError(error);
	  }
	};

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

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
	'use strict';
	
	var page = __webpack_require__(3);
	var tools = __webpack_require__(4);
	// var dom = require('../../tools/dom')
	var log = __webpack_require__(2);
	var xhr = __webpack_require__(1);
	
	var urlBaseJ3p = 'http://j3p.sesamath.net';
	
	/**
	 * Affiche la ressource dans l'élément d'id mepRess
	 * @service plugins/j3p/display
	 * @param {Ressource}      ressource  L'objet ressource
	 * @param {displayOptions} options    Les options après init
	 * @param {errorCallback}  next       La fct à appeler quand le swf sera chargé
	 */
	module.exports = function display(ressource, options, next) {
	  /**
	   * Chargera la ressource quand on aura éventuellement récupéré lastResultat
	   */
	  function load() {
	    log('lancement du chargement j3p sur ' + urlBaseJ3p);
	    // cf https://github.com/petehunt/webpack-howto et
	    // https://webpack.github.io/docs/code-splitting.html
	    __webpack_require__.e/* nsure */(2, function (require) {
	      var loader = __webpack_require__(20);
	      try {
	        // on cache toujours le titre
	        page.hideTitle();
	        // on lui donne nos params
	        loader.init({ urlBaseJ3p: urlBaseJ3p, log: log });
	        var j3pOptions = {};
	        if (options.resultatCallback) {
	          j3pOptions.resultatCallback = options.resultatCallback;
	        }
	        if (options.lastResultat) {
	          j3pOptions.lastResultat = options.lastResultat;
	        }
	        log('loader j3p avec le graphe', ressource.parametres.g);
	        if (ressource.parametres.g instanceof Array) {
	          loader.charge(options.container, ressource.parametres.g, j3pOptions);
	          next(); // le chargement sera pas terminé mais le loader propose pas de callback
	        } else {
	            next(new Error("Le graphe n'est pas un tableau"));
	          }
	      } catch (error) {
	        page.addError(error);
	      }
	    });
	  }
	
	  try {
	    log('j3p.display avec ressource et options', ressource, options);
	    // les params minimaux
	    if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.g) {
	      throw new Error('Ressource incomplète');
	    }
	    if (!options.container || !options.errorsContainer) throw new Error('Paramètres manquants');
	
	    // le domaine où prendre les js j3p
	    if (options.isDev) {
	      urlBaseJ3p = 'http://j3p.devsesamath.net';
	    }
	
	    var lastResultUrl = tools.getURLParameter('lastResultUrl');
	    if (lastResultUrl) {
	      log('on va chercher un lastResultat sur ' + lastResultUrl);
	      xhr.get(lastResultUrl, { responseType: 'json' }, function (error, lastResultat) {
	        if (error) {
	          page.addError('Impossible de récupérer le dernier résultat');
	          log.error(error);
	        } else if (lastResultat) {
	          if (lastResultat.success) {
	            if (lastResultat.resultat) options.lastResultat = lastResultat.resultat;
	          } else {
	            log.error("l'appel de lastResultat a échoué", lastResultat);
	          }
	        }
	        load();
	      });
	    } else {
	      load();
	    }
	  } catch (error) {
	    page.addError(error);
	  }
	};

/***/ },
/* 20 */,
/* 21 */
/***/ function(module, exports, __webpack_require__) {

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
	'use strict';
	
	var page = __webpack_require__(3);
	var tools = __webpack_require__(4);
	var dom = __webpack_require__(5);
	var log = __webpack_require__(2);
	
	function displayJava(ressource, options, next) {
	  var params = ressource.parametres;
	  var container = options.container;
	  var width = Math.max(container.offsetWidth || 0, 640);
	  var height = Math.round(width * 0.75);
	  if (params.height && params.height > 400) height = params.height;
	  var appletName = "mtgApplet";
	  // faut d'abord créer un élément html complet avant de le mettre dans le dom,
	  // sinon il peut lancer le jar avant d'avoir tous les params
	  var applet = dom.getElement('applet', {
	    id: appletName,
	    //name: appletName +"name",
	    code: "mathgraph32.MtgFrame.class",
	    archive: options.pluginBase + "MathGraph32Applet.jar",
	    width: width,
	    height: height,
	    style: "border:#000 solid 1px;"
	  });
	  var allowFull = ["MenuBar", "LeftToolbar", "TopToolbar", "RightToolbar", "IndicationArea", "ToolsChoice", "FileMenu", "OptionsMenu"];
	  var allowEleve = params.allowEleve || allowFull;
	  allowFull.forEach(function (allow) {
	    dom.addElement(applet, 'param', { name: "allow" + allow, value: allowEleve.indexOf(allow) > -1 ? "true" : "false" });
	  });
	  dom.addElement(applet, 'param', { name: "language", value: "true" });
	  dom.addElement(applet, 'param', { name: "level", value: params.level });
	  if (params.figure) dom.addElement(applet, 'param', { name: "figureData", value: params.figure });else dom.addElement(applet, 'param', { name: "initialFigure", value: "orthonormalFrame" });
	  dom.addText(applet, "Ceci est une appliquette MathGraph32. Il semble que Java ne soit pas installé sur votre ordinateur. Aller sur ");
	  dom.addElement(applet, 'a', { href: "http://www.java.com" }, "java.com");
	  dom.addText(applet, " pour installer java.");
	  var p = dom.addElement(applet, 'p', {}, "Sinon, visualiser cette page avec le ");
	  dom.addElement(p, 'a', { href: "?js=1" }, "lecteur javascript");
	  dom.addText(p, " (mais l'enregistrement de la figure ne sera pas possible).");
	  // on peut la mettre dans le dom
	  dom.empty(container);
	  container.appendChild(applet);
	
	  if (options.resultatCallback && container.addEventListener) {
	    // et on ajoute un bouton pour envoyer
	    p = dom.addElement(container, "p");
	    var button = dom.addElement(p, "button", {}, "Envoyer la figure");
	    button.addEventListener("click", function () {
	      log("envoi de la figure");
	      try {
	        var newFigure = document[appletName].getScript();
	        options.resultatCallback({
	          ressType: 'mathgraph',
	          ressOid: ressource.oid,
	          score: 1,
	          reponse: newFigure
	        });
	      } catch (error) {
	        log.error(error);
	        page.addError("Impossible de récupérer la figure de l'applet java");
	      }
	    });
	  }
	
	  // cb si présente
	  if (next) next();
	}
	
	function displayJs(ressource, options, next) {
	  var container = options.container;
	
	  // on enverra un résultat seulement à la fermeture
	  if (options.resultatCallback && container.addEventListener) {
	    container.addEventListener('unload', function () {
	      if (isLoaded) {
	        options.resultatCallback({
	          ressType: 'mathgraph',
	          ressOid: ressource.oid,
	          score: 1
	        });
	      }
	    });
	  }
	
	  // on affiche un avertissement si on force
	  if (ressource.parametres.levelEleve > 0 && tools.getURLParameter("js")) {
	    dom.addElement(container, "p", { "class": "warning" }, "Vous avez imposé le lecteur javascript, l'envoi de la figure n'est pas possible");
	  }
	
	  var dependencies = ["http://www.mathgraph32.org/js/4.9.9/mtg32jsmin.js", "http://www.mathgraph32.org/js/MathJax/MathJax.js?config=TeX-AMS-MML_SVG-full.js"];
	  page.loadAsync(dependencies, function () {
	    /*global MathJax, mtg32*/
	    if (typeof MathJax === "undefined") throw new Error("Mathjax n'est pas chargé");
	    if (typeof mtg32 === "undefined") throw new Error("Mathgraph32 n'est pas chargé");
	    var width = ressource.parametres.width || container.offsetWidth || 800;
	    var height = ressource.parametres.height || width * 0.75 || 600;
	    var svgId = "mtg32svg";
	    // la consigne éventuelle
	    if (ressource.parametres.consigne) dom.addElement(container, 'p', null, ressource.parametres.consigne);
	    // pour créer le svg, ceci marche pas (il reste à 0 de hauteur), faut passer par createElementNS
	    //var svg = dom.addElement(container, 'svg', {id:'svg', width:"800px", height:"500px", xmlns:"http://www.w3.org/2000/svg"})
	    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	    svg.setAttributeNS(null, "id", svgId);
	    svg.setAttributeNS(null, "width", width);
	    svg.setAttributeNS(null, "height", height);
	    svg.style.display = "block";
	    container.appendChild(svg);
	    MathJax.Hub.Config({
	      tex2jax: {
	        inlineMath: [["$", "$"], ["\\(", "\\)"]]
	      },
	      jax: ["input/TeX", "output/SVG"],
	      TeX: { extensions: ["color.js"] },
	      messageStyle: 'none'
	    });
	    MathJax.Hub.Queue(function () {
	      var mtg32App = new mtg32.mtg32App();
	      mtg32App.addDoc(svgId, ressource.parametres.figure, true);
	      mtg32App.calculateAndDisplayAll();
	      isLoaded = true;
	      if (next) next();
	    });
	  });
	}
	
	var isLoaded;
	
	/**
	 * Affiche une ressource mathgraph, avec l'applet java ou le lecteur js (suivant paramétrage de la ressource)
	 * On peut forcer le js en précisant ?js=1 dans l'url
	 * @service plugins/mathgraph/display
	 * @param {Ressource}      ressource  L'objet ressource (une ressource mathgraph a en parametres soit une propriété url
	 *                                      avec l'url du xml soit une propriété xml avec la string xml)
	 * @param {displayOptions} options    Les options après init
	 * @param {errorCallback}  next       La fct à appeler quand l'mathgraph sera chargé (sans argument ou avec une erreur)
	 */
	module.exports = function display(ressource, options, next) {
	  try {
	    var container = options.container;
	    if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");
	
	    log('start mathgraph display avec la ressource', ressource);
	    //les params minimaux
	    if (!ressource.oid || !ressource.titre || !ressource.parametres) {
	      throw new Error("Paramètres manquants");
	    }
	    if (!ressource.parametres.figure) {
	      throw new Error("Pas de figure mathgraph en paramètre");
	    }
	    // on utilise java seulement si levelEleve est positif dans les paramètres (et que l'on impose pas js dans l'url)
	    if (ressource.parametres.levelEleve > 0 && !tools.getURLParameter("js")) displayJava(ressource, options, next);else displayJs(ressource, options, next);
	  } catch (error) {
	    if (next) next(error);else page.addError(error);
	  }
	};

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

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
	
	'use strict';
	
	var page = __webpack_require__(3);
	var tools = __webpack_require__(4);
	var dom = __webpack_require__(5);
	var log = __webpack_require__(2);
	var swf = __webpack_require__(8);
	
	/**
	 * Renvoie le xml qui sera passé au flash à partir de ressource.parametres.xml
	 * adaptation en js du code de labomep:outils/mental/display.php
	 * @private
	 * @param params le contenu de ressource.parametres.xml, qui est du json !!
	 */
	function getXmlParam(params) {
	  if (!tools.isArray(params.series)) {
	    throw new Error("Aucune série à traiter");
	  }
	
	  // L'objet js que l'on construit à partir des params
	  var o = {
	    isDelai: params.isdelai === 'o',
	    delai: '',
	    aleatoire_exercice: params.alea === 'o',
	    temp_series: [],
	    operations: []
	  };
	  if (o.isDelai && params.delai) o.delai = nettoie_nombre(params.delai);
	
	  params.series.forEach(function (serie) {
	    var newSerie = {
	      quantite: nettoie_nombre(serie.ndcdcs),
	      type: serie.tdcdcs,
	      aleatoire: serie.posalea === 'alea',
	      isdelai: serie.isdelai === 'o',
	      delai: serie.delai || '',
	      nombres: getNombresFromSerie(serie),
	      signes: getSignesFromSerie(serie)
	    };
	    var newOperation = getOperations(serie);
	    // si une des opérations de la série est foireuse on oublie la série
	    if (newOperation) {
	      o.temp_series.push(newSerie);
	      o.operations.push(newOperation);
	    }
	  }); // params.series.forEach
	
	  // mélanges les opérations des différentes séries si nécéssaire
	  if (o.aleatoire_exercice) o.operations = shuffle(o.operations);
	
	  // reste à générer le xml
	  return xmlGenerate(o);
	}
	
	/**
	 * Retourne le tableaux nombres d'une série
	 * @private
	 * @param serie
	 * @returns {Array}
	 */
	function getNombresFromSerie(serie) {
	  // le tableau que l'on va retourner
	  var nombres = [];
	  serie.nb.forEach(function (nb) {
	    var newNb;
	    // nature du nombre
	    switch (nb.cts) {
	      case 1:
	        newNb = {
	          type: 'fixe',
	          fixe: nettoie_nombre(nb.cns)
	        };
	        break;
	
	      case 2:
	        newNb = {
	          type: 'liste',
	          liste: [],
	          liaison: nb.cls === 'o'
	        };
	        nb.cns.split('|').forEach(function (item) {
	          newNb.liste.push(nettoie_nombre(item));
	        });
	        break;
	
	      case 3:
	        newNb = {
	          type: 'intervalle'
	        };
	        var bornes = nb.cns.split('|');
	        newNb.debut = nettoie_nombre(bornes[0]);
	        newNb.fin = nettoie_nombre(bornes[1]);
	        break;
	
	      case 4:
	        newNb = { type: 'sans restriction' };
	        break;
	
	      default:
	        page.addError("ressource incohérente (type de série inconnu)");
	    }
	
	    // chiffres admissibles
	    if (nb.cts > 2) {
	      // intervalle ou sans restriction
	      newNb.chiffres = [];
	      for (var posChiffre = 0; posChiffre < 8; posChiffre++) {
	        newNb.chiffres.push(nb.ccs.substr(posChiffre, 1) == 1);
	      }
	    }
	
	    // couleur
	    newNb.couleur = nb.ccns;
	    // temps d'affichage du nombre
	    newNb.idDelai = nb.cdns !== 'permanent';
	    if (newNb.isDelai) newNb.delai = parseInt(nb.cdns); // '20 s' => 20
	    // fini pour ce nb
	    nombres.push(newNb);
	  }); // serie.nb.forEach
	
	  return nombres;
	}
	
	function getSignesFromSerie(serie) {
	  // les signes qui seront retournés
	  var signes = [];
	  var type = serie.tdcdcs;
	  var numsigne = 0;
	  var signe = {};
	  var symbole, nbTermes;
	  serie.s.forEach(function (s) {
	    numsigne++;
	    switch (type) {
	      // addition
	      case '1':
	      case '2':
	      case '3':
	      case '4':
	        nbTermes = type + 1;
	        symbole = numsigne < nbTermes ? '+' : '=';
	        break;
	      // soustraction
	      case '5':
	        symbole = numsigne < 2 ? '-' : '=';
	        break;
	      // multiplication de 2, 3, 4 ou 5 facteurs
	      case '6':
	      case '7':
	      case '8':
	      case '9':
	        nbTermes = type - 4;
	        symbole = numsigne < nbTermes ? '*' : '=';
	        break;
	      case '10':
	        symbole = numsigne < 2 ? '-' : '=';
	        break;
	      default:
	        page.addError("ressource incohérente (type de série inconnu)");
	    }
	    signe.signe = symbole;
	    signe.couleur = s.ccss;
	    signe.isdelai = s.ccds != 'permanent';
	    if (signe.isdelai) signe.delai = parseInt(s.ccds);
	    signes.push(signe);
	  });
	
	  return signes;
	}
	
	/**
	 * Retourne les opérations de la série (ou undefined si on a pas réussi à trouver de tirage aléatoire satisfaisant)
	 * @private
	 * @param {Object} serie
	 * @returns {Array|undefined}
	 */
	function getOperations(serie) {
	  var nombres_generes,
	      signes_generes,
	      choix_position_liaison,
	      temp_position,
	      nombre_genere,
	      signe_genere,
	      operation,
	      operations = [],
	      operation_annullee,
	      c,
	      i,
	      resultat,
	      val0,
	      val1,
	      temp;
	  var maxTentatives = 100;
	  for (var q = 0; q < serie.quantite; q++) {
	    operation_annullee = true;
	    c = 0;
	    // Si le tirage convient pas on recommence, mais pas trop quand même
	    while (operation_annullee && c < maxTentatives) {
	      nombres_generes = [];
	      signes_generes = [];
	      choix_position_liaison = false;
	      // création des nombres constitutifs de l'opération
	      serie.forEach(function (nombre) {
	        // valeur numérique ou rang dans la liste en cas de liste liée
	        switch (nombre.type) {
	          case 'fixe':
	            nombre_genere.valeur = genere_fixe(nombre);
	            break;
	
	          case 'liste':
	            if (nombre.liste && nombre.liste.liaison) {
	              if (choix_position_liaison) {
	                nombre_genere.valeur = nombre[temp_position];
	              } else {
	                temp_position = genere_position_liste_liee(nombre);
	                choix_position_liaison = true;
	                nombre_genere.valeur = nombre[temp_position];
	              }
	            } else {
	              nombre_genere.valeur = genere_liste_non_liee(nombre);
	            }
	            break;
	
	          case 'intervalle':
	            temp = genere_intervalle(nombre);
	            nombre_genere.valeur = temp;
	            break;
	
	          case 'sans restriction':
	            temp = genere_sans_restriction(nombre);
	            nombre_genere.valeur = temp;
	            break;
	
	          default:
	            page.addError("ressource incohérente (type liste/intervalle inconnu)");
	        }
	
	        // temps d'affichage
	        nombre_genere.isdelai = nombre.isdelai;
	        nombre_genere.delai = nombre.delai || '';
	        // couleur
	        nombre_genere.couleur = couleur_nom(nombre.couleur);
	        // on empile le nombre généré
	        nombres_generes.push = nombre_genere;
	      }); // jshint ignore:line
	
	      // si nécéssaire, on mélange les positions des nombres au sein de l'opération
	      if (serie.aleatoire) {
	        shuffle(nombres_generes);
	      }
	
	      // création des signes opératoires constitutifs de l'opération
	      serie.signes.forEach(function (signe) {
	        // on se charge du temps d'affichage
	        signe_genere.isdelai = signe.isdelai;
	        signe_genere.delai = signe.delai || '';
	        // de quel signe s'agit-il ?
	        signe_genere.valeur = signe.signe;
	        // on se charge de la couleur
	        signe_genere.couleur = couleur_nom(signe.couleur);
	        // on empile le signe généré
	        signes_generes.push(signe_genere);
	      }); // jshint ignore:line
	
	      // determination du résultat de l'opération
	      // - attention, dans le cas d'un quotient, c'est la partie entière du quotient qui constitue le résultat
	
	      if (!nombres_generes[0].hasOwnProperty('valeur')) {
	        throw new Error("Le premier nombre généré n'a pas de valeur");
	      }
	
	      switch (serie.type) {
	        // addition
	        case 1:
	        case 2:
	        case 3:
	        case 4:
	          resultat = nombres_generes[0].valeur;
	          for (i = 1; i <= serie.type; i++) {
	            resultat += nombres_generes[i].valeur;
	          }break;
	        // soustraction
	        case 5:
	          // on veut pas obtenir de négatif comme résultat de soustraction
	          if (nombres_generes[0].valeur < nombres_generes[1].valeur) operation_annullee = true;else resultat = nombres_generes[0].valeur - nombres_generes[1].valeur;
	          break;
	        // multiplication
	        case 6:
	        case 7:
	        case 8:
	        case 9:
	          resultat = nombres_generes[0].valeur;
	          for (i = 1; i < serie.type - 5; i++) {
	            resultat = resultat * nombres_generes[1].valeur;
	          }break;
	        // division
	        case 10:
	          val0 = nombres_generes[0].valeur;
	          val1 = nombres_generes[1].valeur;
	          // pas de diviseur nul
	          if (val1 === 0) operation_annullee = true;
	          // le résultat doit être entier
	          resultat = Math.floor(val0 / val1);
	          operation_annullee = resultat !== Math.floor(resultat);
	          break;
	        default:
	          page.addError("ressource incohérente (type de série inconnu)");
	      }
	    } // while operation_annullee
	
	    if (c === maxTentatives) {
	      log("Impossible de trouver un tirage aléatoire satisfaisant toutes les conditions");
	      // ça va annuler la série
	      return undefined;
	    }
	
	    // on empile l'opération créée en plaçant nombres et signes dans l'ordre d'écriture
	    operation = [];
	    operation[0] = nombres_generes[0];
	    operation[1] = signes_generes[0];
	    operation[2] = nombres_generes[1];
	    operation[3] = signes_generes[1];
	    if (nombres_generes[2]) operation[4] = nombres_generes[2];
	    if (signes_generes[2]) operation[5] = signes_generes[2];
	    if (nombres_generes[3]) operation[6] = nombres_generes[3];
	    if (signes_generes[3]) operation[7] = signes_generes[3];
	    if (nombres_generes[4]) operation[8] = nombres_generes[4];
	    if (signes_generes[4]) operation[9] = signes_generes[4];
	    operation.resultat = resultat;
	    operation.isdelai = serie.isdelai;
	    operation.delai = serie.delai;
	    operations.push(operation);
	  } // for sur quantite
	
	  return operations;
	} // getOperations
	
	/**
	 * Retourne le xml généré à partir de l'objet
	 * @private
	 * @param o
	 * @returns {string}
	 */
	function xmlGenerate(o) {
	  // cf https://developer.mozilla.org/fr/docs/Comment_cr%C3%A9er_un_arbre_DOM
	  // https://developer.mozilla.org/en-US/docs/Web/API/XMLDocument
	  //
	  if (!window.document.implementation || typeof window.document.implementation.createDocument !== 'function') {
	    throw new Error("Votre navigateur ne supporte pas la méthode document.implementation.createDocument " + "et ne peut donc pas afficher de ressource de calcul mental");
	  }
	  // notre arbre, on commence par la racine
	  var parametrage = window.document.implementation.createDocument("", "", null);
	  var noeud_poseur = parametrage.createElement('CALCUL_MENTAL');
	  noeud_poseur.setAttribute("version", "1");
	  if (o.isDelai) noeud_poseur.setAttribute("t", o.delai);
	  o.operations.forEach(function (operation) {
	    var noeud_ques = parametrage.createElement('saisie');
	    if (operation.isdelai) noeud_ques.setAttribute("t", operation.delai);
	    var noeud = {};
	    operation.forEach(function (tab, key) {
	      // on gère pas ici les propriétés non numériques (cf getOperations)
	      if (parseInt(key) == key) {
	        noeud[key] = parametrage.createElement('affiche', formate_nombre(tab.valeur));
	        if (tab.couleur != 'noir') noeud[key].setAttribute("c", tab.couleur);
	        if (tab.isdelai) noeud[key].setAttribute("t", tab.delai);
	        noeud_ques.appendChild(noeud[key]);
	      }
	    });
	    // le point d'interrogation (ATTENTION, le tag saisie s'appelle noeud_ques et le tag affiche s'appelle noeud_saisie)
	    var noeud_saisie = parametrage.createElement('affiche', '?');
	    noeud_ques.appendChild(noeud_saisie);
	    // valeur du résultat
	    var noeud_resultat = parametrage.createElement('reponse', formate_nombre(operation.resultat));
	    noeud_ques.appendChild(noeud_resultat);
	    noeud_poseur.appendChild(noeud_ques);
	  });
	  parametrage.appendChild(noeud_poseur);
	
	  return parametrage.toString().replace(/\n/g, '').replace(/\+/g, "#").replace(/"/g, "'");
	} // xmlGenerate
	
	/**
	 * Transforme une chaîne en nombre (vire les espaces éventuels et remplace , par .)
	 * @private
	 * @param {string|number} nb
	 * @returns {number}
	 */
	function nettoie_nombre(nb) {
	  if (tools.isString(nb)) return Number(nb.replace(/,/g, '.').replace(/\s/g, ''));else return Number(nb);
	}
	
	/**
	 * Retourne une string avec la virgule en séparateur décimal
	 * @private
	 * @param nombre
	 * @returns {string}
	 */
	function formate_nombre(nombre) {
	  var nbString = nombre + '';
	  return nbString.replace('.', ',');
	}
	
	/**
	 * Retourne le tableau d'entrée mélangé sans le modifier
	 * @private
	 * @param tab
	 * @returns {Array}
	 */
	function shuffle(tab) {
	  if (tab.length < 2) return tab;
	  var shuffled = [];
	  var i;
	  while (tab.length > 1) {
	    i = intRandom(tab.length);
	    shuffled.push(tab.splice(i, 1)[0]);
	  }
	  shuffled.push(tab[0]);
	
	  return shuffled;
	}
	
	/**
	 * Retourne le nb fixe
	 * @private
	 * @param nombre
	 * @returns {number}
	 */
	function genere_fixe(nombre) {
	  return nettoie_nombre(nombre.fixe);
	}
	
	/**
	 * générateur de nombres fixes dans une liste non liée
	 * (je sais pas non plus ce que ça veut dire mais le code renvoie un nb pris au hasard dans nombre.liste)
	 * @private
	 * @param nombre
	 * @returns {number}
	 */
	function genere_liste_non_liee(nombre) {
	  var i = intRandom(nombre.liste.length);
	  return nombre.liste[i];
	}
	
	/**
	 * générateur de position dans une liste non liée
	 * Renvoie un index aléatoire de nombre.liste
	 * @private
	 * @param nombre
	 * @returns {number|*}
	 */
	function genere_position_liste_liee(nombre) {
	  return intRandom(nombre.liste.length);
	}
	
	/**
	 * Générateur de nombres dans un intervalle
	 * @private
	 * @param {Array} nombre [debut, fin]
	 * @return {Integer} Le nombre généré dans
	 */
	function genere_intervalle(nombre) {
	  if (!nombre.hasOwnProperty('debut') || !nombre.hasOwnProperty('fin') || nombre.fin < nombre.debut) {
	    throw new Error("Paramètres d'intervalle incorrects");
	  }
	  return rand(nombre.debut, nombre.fin);
	}
	
	/**
	 * générateur de nombres sans restrictions
	 * Génère un nombre xxx,xxxxx au hasard, en appliquant le masque de nombre.chiffres
	 * @private
	 * @param nombre
	 * @returns {number}
	 */
	function genere_sans_restriction(nombre) {
	  var presence_un_chiffre = false;
	  var nombre_genere = 0;
	  var i, chiffre, puissance;
	  for (i = 0; i < 8; i++) {
	    if (nombre.chiffres[i]) {
	      chiffre = rand(0, 9);
	      puissance = Math.pow(10, 3 - i);
	      nombre_genere += chiffre * puissance;
	      presence_un_chiffre = true;
	    }
	  }
	  if (presence_un_chiffre) return nombre_genere;else return false;
	}
	
	/**
	 * conversion code=>nom des couleurs
	 * @private
	 * @param code_couleur
	 * @returns {string}
	 */
	function couleur_nom(code_couleur) {
	  var tab_couleurs = ["orange", "rouge", "vert", "brique", "bleu", "noir"];
	  return tab_couleurs[code_couleur];
	}
	
	/**
	 * Génère un entier aléatoire entre min et max (inclus)
	 * @private
	 * @param min
	 * @param max
	 * @returns {number} entier >= min et <= max
	 */
	function rand(min, max) {
	  return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	/**
	 * Renvoie un entier entre 0 (inclus) et inferieurA (exclu)
	 * @private
	 * @param inferieurA
	 * @returns {number|*}
	 */
	function intRandom(inferieurA) {
	  return Math.floor(Math.random() * inferieurA);
	}
	
	var baseMental;
	/**
	 * l'historique des réponses de chaque question
	 * @private
	 */
	var histoReponses = [];
	
	/**
	 * Affiche les ressources mental (exercices de calcul mental, avec cm.swf et un xml de paramètres)
	 * avec param en json, mais dans parametres.xml (sic)
	 * qui permettent de générer un xml ici avec l'aléatoire paramétré
	 * ex 36162 36248 36404 40141 (pris au hasard dans les ressources persos de profs)
	 * @service plugins/mental/display
	 * @param {Ressource}      ressource  L'objet ressource
	 * @param {displayOptions} options    Les options après init
	 * @param {errorCallback}  next       La fct à appeler quand le swf sera chargé
	 */
	module.exports = function display(ressource, options, next) {
	  var swfUrl;
	
	  log('start mental display avec la ressource', ressource);
	
	  try {
	    //les params minimaux
	    if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.xml) {
	      throw new Error("Paramètres manquants");
	    }
	    // base et swf
	    baseMental = options.pluginBase + 'cm/swf';
	    swfUrl = baseMental + '/cm.swf';
	
	    // les fcts exportées pour le swf
	    if (options && options.resultatCallback) {
	      window.com_mental_resultat = function (nbQuestions, numQuestion, reponse) {
	        // reponse est de la forme o/n
	        histoReponses.push([nbQuestions, reponse]);
	        // labomep recevait aussi type_tag : 'mental', node_type: 'mental', idres : ressource.oid, origine & seance_id,
	        // l'appelant devra le mettre dans la callback qu'il nous donne s'il en a besoin
	        options.resultatCallback({
	          reponse: histoReponses
	        });
	      };
	    } else window.com_mental_resultat = function () {};
	
	    // On réinitialise le conteneur
	    var container = options.container;
	    dom.empty(container);
	
	    // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
	    container.setAttribute("width", 735);
	    container.style.width = '735px';
	
	    var swfOptions = {
	      largeur: 735,
	      hauteur: 450,
	      base: baseMental,
	      flashvars: {
	        parametres_xml: getXmlParam(ressource.parametres.xml)
	      }
	    };
	
	    swf.load(container, swfUrl, swfOptions, next);
	  } catch (error) {
	    if (next) next(error);else page.addError(error);
	  }
	};

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

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
	'use strict';
	
	var page = __webpack_require__(3);
	var dom = __webpack_require__(5);
	var log = __webpack_require__(2);
	var swf = __webpack_require__(8);
	
	var $ = window.jQuery; /* jshint jquery:true */
	
	/**
	 * Ajoute l'iframe (ou un div si c'est un swf directement)
	 * @private
	 */
	function addPage(params, next) {
	  log('addPage avec les params', params);
	  var url = params.adresse;
	  var page = dom.addElement(container, 'div', { id: 'page' });
	  var args = { src: url, id: 'pageContent' };
	
	  // l'iframe, mais on fait un cas particulier pour les urls en swf qui ne renvoient pas un DOMDocument
	  // ff aime pas et sort une erreur js Error: Permission denied to access property 'toString'
	  // chrome râle aussi parce que c'est pas un document
	  if (/^[^?]+.swf(\?.*)?$/.test(url)) {
	    // faut pas prendre les truc.php?toto=truc.swf
	    log("C'est un swf, on ajoute un div et pas une iframe");
	    var swfContainer = dom.addElement(page, 'div', args);
	    var swfId = 'swf' + new Date().getTime();
	    var options = {
	      id: swfId,
	      hauteur: params.hauteur || Math.floor(window.innerHeight - 60),
	      largeur: params.largeur || Math.floor(window.innerWidth - 40)
	    };
	    if (isBasic) options.hauteur -= 60;
	    if (options.hauteur < 100) options.hauteur = 100;
	    if (options.largeur < 100) options.largeur = 100;
	    log('On charge ' + url + ' dans #page avec', options);
	    swf.load(swfContainer, url, options, function () {
	      if (!options.hauteur && !options.largeur) autosize();
	      // on est appelé quand swfobject a mis l'object dans le dom, mais le swf est pas forcément chargé
	      // on regarde la hauteur pour savoir si c'est fait
	      var $swfId = $('#' + swfId);
	      if ($swfId.innerHeight() > 10) {
	        next();
	      } else {
	        $swfId.on('load', function () {
	          isLoaded = true;
	          next();
	        });
	      } // ne pas passer directement next en cb sinon il sera appelé avec un argument, qui sera interprété comme une erreur
	    });
	    /* */
	  } else if (/^[^?]+.(png|jpe?g|gif)(\?.*)?$/.test(url)) {
	      if (params.hauteur > 100) args.height = params.hauteur;
	      if (params.largeur > 100) args.width = params.largeur;
	      log("c'est une image, pas d'iframe mais un tag img", args, params);
	      dom.addElement(page, 'img', args);
	      isLoaded = true;
	      next();
	    } else {
	      var iframe = dom.addElement(page, 'iframe', args, 'Si vous lisez ce texte,' + ' votre navigateur ne supporte probablement pas les iframes');
	      // url source (non cliquable) en footer
	      autosize();
	      if (iframe.addEventListener) {
	        iframe.addEventListener('load', function () {
	          isLoaded = true;
	          next();
	        });
	      } else {
	        isLoaded = true;
	        next();
	      }
	    }
	  dom.addElement(page, 'p', { id: 'urlSrc' }, 'source : ' + params.adresse);
	}
	
	/**
	 * Appelle resizePage et le colle comme comportement au resize de la fenêtre
	 */
	function autosize() {
	  // on redimensionne dès que jQuery est prêt
	  $(resizePage);
	  // et à chaque changement de la taille de la fenêtre
	  $(window).resize(resizePage);
	}
	
	/**
	 * Modifie la taille de l'iframe pour lui donner tout l'espace restant de container
	 */
	function resizePage() {
	  var $page = $('#page');
	  var $pageContent = $('#pageContent');
	  var occupe = 0;
	  ['#errors', '#warnings', '#titre', '#entete', '#urlSrc'].forEach(function (selector) {
	    occupe += $(selector).outerHeight(true);
	  });
	  var tailleDispo = Math.floor(window.innerHeight - occupe);
	  if (tailleDispo < 300) tailleDispo = 300;
	  $('#display').css('height', tailleDispo + 'px');
	  log('resize iframe à ' + tailleDispo);
	  // pour l'iframe de l'url, faut retirer ce que l'on utilise pour consigne & co
	  if (!isBasic) tailleDispo -= $('#entete').innerHeight();
	  $page.css('height', tailleDispo + 'px');
	  $pageContent.css('height', tailleDispo + 'px');
	  // et la largeur de l'iframe
	  tailleDispo = $(container).innerWidth() - 4; // 2px de marge dans le css
	  if (tailleDispo < 300) tailleDispo = 300;
	  log('resize largeur à ' + tailleDispo);
	  $page.css('width', tailleDispo + 'px');
	  $pageContent.css('width', tailleDispo + 'px');
	}
	
	/**
	 * Envoie le résultat à resultatCallback
	 * @param {string}   reponse
	 * @param {boolean}  deferSync
	 * @param {function} next
	 */
	function sendResultat(reponse, deferSync, next) {
	  var resultat = {
	    score: 1,
	    ressId: ressId,
	    ressType: 'url'
	  };
	  if (deferSync) {
	    resultat.fin = true;
	    resultat.deferSync = true;
	  }
	  if (reponse) resultat.reponse = reponse;
	  resultatCallback(resultat, next);
	}
	
	var container;
	var errorsContainer;
	var isBasic;
	var ressId;
	var resultatCallback;
	var isLoaded;
	
	/**
	 * Affiche les ressources de type url (page externe) en créant une iframe dans le container (ou un div si l'url est un swf)
	 * @service plugins/url/display
	 * @param {Ressource}      ressource  L'objet ressource
	 * @param {displayOptions} options    Les options après init
	 * @param {errorCallback}  next       La fct à appeler quand le contenu sera chargé
	 */
	module.exports = function display(ressource, options, next) {
	  log('url.display avec les options', options);
	  try {
	    // les params minimaux
	    if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.adresse) throw new Error('Ressource incomplète');
	    ['base', 'pluginBase', 'container', 'errorsContainer'].forEach(function (param) {
	      if (!options[param]) throw new Error('Paramètre ' + param + ' manquant');
	    });
	
	    // init de nos var globales
	    container = options.container;
	    errorsContainer = options.errorsContainer;
	    if (typeof options.resultatCallback === 'function') resultatCallback = options.resultatCallback;
	    ressId = ressource.oid;
	
	    // raccourcis
	    var params = ressource.parametres;
	    var url = params.adresse;
	    if (!url) throw new Error('Url manquante');
	    if (!/^https?:\/\//.test(url)) throw new Error('Url invalide : ' + url);
	
	    // init
	    dom.addCss(options.pluginBase + 'url.css');
	
	    var hasConsigne = params.question_option && params.question_option !== 'off';
	    var hasReponse = params.answer_option && params.answer_option !== 'off';
	    var isBasic = !hasConsigne && !hasReponse;
	    // ni question ni réponse
	    if (isBasic) {
	      addPage(params, next);
	      if (resultatCallback) {
	        // un listener pour envoyer 'affiché' comme score (i.e. un score de 1 avec une durée)
	        $('body').on('unload', function () {
	          if (isLoaded) sendResultat(null, true);
	        });
	      } // sinon rien à faire
	    } else {
	        /**
	         * Ajout des comportements pour la gestion des panneaux Consigne et Réponse avec jQueryUi
	         * On charge ces dépendances avec notre loader
	         */
	        page.setBase(options.pluginBase);
	        page.loadAsync(['jqueryUiDialog'], function () {
	          // les autres sont des modules à nous chargés par webpack
	          __webpack_require__.e/* nsure */(3, function (require) {
	            function sendReponse() {
	              if (!isResultatSent) {
	                var reponse = $(textarea).val();
	                sendResultat(reponse, false, function (retour) {
	                  if (retour && (retour.ok || retour.success)) isResultatSent = true;
	                });
	              }
	            }
	
	            var hasCkeditor = params.answer_editor && params.answer_editor.indexOf('ckeditor') === 0;
	            var hasMqEditor = params.answer_editor === 'mqEditor';
	            var editorName;
	            if (hasCkeditor) editorName = 'ckeditor';else if (hasMqEditor) editorName = 'mqEditor';
	            var editor;
	            if (editorName) editor = __webpack_require__(24)("./" + editorName);
	            var urlUi = __webpack_require__(28);
	            // on ajoute tous nos div même si tous ne serviront pas (car urlUi les cherche dans la page)
	            var entete = dom.addElement(container, 'div', { id: 'entete' });
	            dom.addElement(entete, 'div', { id: 'lienConsigne' }, 'Consigne');
	            dom.addElement(entete, 'div', { id: 'lienReponse' }, 'Réponse');
	            dom.addElement(entete, 'div', { id: 'filariane' });
	            dom.addElement(entete, 'div', { id: 'information', 'class': 'invisible' });
	            var divConsigne = dom.addElement(entete, 'div', { id: 'consigne', 'class': 'invisible' });
	            var divReponse = dom.addElement(entete, 'div', { id: 'reponse', 'class': 'invisible' });
	            if (hasConsigne) {
	              if (params.consigne) $(divConsigne).html(params.consigne);else log.error('Pas de consigne alors que question_option vaut ' + params.question_option);
	            }
	            if (hasReponse) {
	              var form = dom.addElement(divReponse, 'form', { action: '' });
	              var textarea = dom.addElement(form, 'textarea', { id: 'answer', cols: '50', rows: '10' });
	              if (hasCkeditor) {
	                /* global CKEDITOR */
	                if (CKEDITOR.env.ie && CKEDITOR.env.version < 9) CKEDITOR.tools.enableHtml5Elements(document);
	                CKEDITOR.config.height = 150;
	                CKEDITOR.config.width = 'auto';
	                if (params.answer_editor === 'ckeditorTex') {
	                  CKEDITOR.config.extraPlugins = 'mathjax';
	                  CKEDITOR.config.mathJaxLib = '/vendors/mathjax/2.2/MathJax.js?config=TeX-AMS-MML_HTMLorMML';
	                }
	                CKEDITOR.replace('answer', {
	                  toolbarGroups: [{ name: 'clipboard', groups: ['clipboard', 'undo'] }, { name: 'editing', groups: ['find', 'selection'] }, { name: 'insert' }, { name: 'forms' }, { name: 'tools' }, { name: 'document', groups: ['mode', 'document', 'doctools'] }, { name: 'others' }, '/', { name: 'basicstyles', groups: ['basicstyles', 'cleanup'] }, { name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi'] }, { name: 'styles' }, { name: 'colors' }, { name: 'about' }],
	                  removeButtons: 'Styles,Source',
	                  customConfig: '' // on veut pas charger le config.js
	                });
	              } else if (hasMqEditor) {
	                  editor(form, params.mqEditorConfig, options);
	                }
	              if (resultatCallback) {
	                var isResultatSent = false;
	                dom.addElement(form, 'br');
	                var boutonReponse = dom.addElement(form, 'button', { id: 'envoi' }, 'Enregistrer cette réponse');
	                // on ajoute l'envoi de la réponse sur le bouton et à la fermeture
	                $(boutonReponse).click(sendReponse);
	                $('body').on('unload', function () {
	                  sendReponse(null, true);
	                });
	                $(textarea).change(function () {
	                  isResultatSent = false;
	                });
	              } else if (options.preview) {
	                dom.addElement(form, 'p', null, "Réponse attendue mais pas d'envoi possible en prévisualisation");
	              } else {
	                dom.addElement(form, 'p', { 'class': 'info', style: { margin: '1em;' } }, "Aucun enregistrement ne sera effectué (car aucune destination n'a été fournie pour l'envoyer, normal en visualisation seule)");
	              }
	              addPage(params, function () {
	                urlUi(ressource, options, function () {
	                  $('#loading').empty();
	                  next();
	                });
	              });
	            }
	          }); // require.ensure
	        }); // page.loadAsync
	      } // fin question-réponse
	  } catch (error) {
	    if (next) next(error);else page.addError(error);
	  }
	};

/***/ },
/* 24 */,
/* 25 */,
/* 26 */,
/* 27 */,
/* 28 */,
/* 29 */
/***/ function(module, exports) {

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
	'use strict';
	
	/**
	 * Définition d'un résultat commune à toutes les ressources (exercices ou pas)
	 * @constructor
	 * @param {object|string} original Un objet ayant des propriétés d'un résultat, ou une chaine qui sera mise dans reponse
	 */
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	function Resultat(original) {
	  var values = {};
	  // on accepte une simple chaine, que l'on mettra dans la propriété reponse du résultat construit
	  if (typeof original === 'string') values.reponse = original;else if ((typeof original === 'undefined' ? 'undefined' : _typeof(original)) === 'object') values = original;
	
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
	   * Le type de la ressource (type de la ressource, nom de code du plugin qui la gère et saura afficher le résultat)
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
	  this.contenu = values.contenu;
	
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
	  return typeof this.reponse === "string" ? this.reponse : this.reponse.toString();
	};
	
	module.exports = Resultat;

/***/ }
]);
//# sourceMappingURL=display.bundle.js.map