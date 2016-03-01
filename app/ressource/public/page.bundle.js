/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	var parentJsonpFunction = window["webpackJsonp"];
/******/ 	window["webpackJsonp"] = function webpackJsonpCallback(chunkIds, moreModules) {
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, callbacks = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId])
/******/ 				callbacks.push.apply(callbacks, installedChunks[chunkId]);
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			modules[moduleId] = moreModules[moduleId];
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules);
/******/ 		while(callbacks.length)
/******/ 			callbacks.shift().call(null, __webpack_require__);
/******/ 		if(moreModules[0]) {
/******/ 			installedModules[0] = 0;
/******/ 			return __webpack_require__(0);
/******/ 		}
/******/ 	};
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// "0" means "already loaded"
/******/ 	// Array means "loading", array contains callbacks
/******/ 	var installedChunks = {
/******/ 		5:0
/******/ 	};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId, callback) {
/******/ 		// "0" is the signal for "already loaded"
/******/ 		if(installedChunks[chunkId] === 0)
/******/ 			return callback.call(null, __webpack_require__);
/******/
/******/ 		// an array means "currently loading".
/******/ 		if(installedChunks[chunkId] !== undefined) {
/******/ 			installedChunks[chunkId].push(callback);
/******/ 		} else {
/******/ 			// start chunk loading
/******/ 			installedChunks[chunkId] = [callback];
/******/ 			var head = document.getElementsByTagName('head')[0];
/******/ 			var script = document.createElement('script');
/******/ 			script.type = 'text/javascript';
/******/ 			script.charset = 'utf-8';
/******/ 			script.async = true;
/******/
/******/ 			script.src = __webpack_require__.p + "" + chunkId + "." + ({"1":"display","4":"edit"}[chunkId]||chunkId) + ".bundle.js";
/******/ 			head.appendChild(script);
/******/ 		}
/******/ 	};
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(3);
	module.exports = __webpack_require__(30);


/***/ },

/***/ 1:
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
	
	/*jshint asi:true */
	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	var log = __webpack_require__(2);
	
	/**
	 * @module tools/xhr Pour gérer les appels ajax, copie de sesatheque-client/xhr.js (mais celui-ci est browser only)
	 */
	
	/**
	 * 10s de timeout par défaut mis à toutes les requêtes qui n'en précisent pas
	 * @type {Integer}
	 */
	var defaultTimeout = 10000;
	var minTimeout = 100;
	var maxTimeout = 60000;
	
	/**
	 * Fonction qui gère l'appel xhr
	 * @private
	 * @param {string}   verb
	 * @param {string}   url
	 * @param {object}   data
	 * @param {object}   options
	 * @param {function} callback Sera appelée avec (error, réponse),
	 *                              si options.responseType === "json" la réponse sera un objet,
	 *                              sinon l'objet response du XMLHttpRequest
	 */
	function xhrCall(verb, url, data, options, callback) {
	  var xhr,
	      isNextCalled = false;
	  // pour s'assurer qu'on ne l'appelle qu'une fois, entre timeout, error et done
	  function next(error, data) {
	    if (!isNextCalled) {
	      isNextCalled = true;
	      callback(error, data);
	    }
	  }
	
	  if (typeof verb !== "string") verb = 'GET';else verb = verb.toUpperCase();
	  if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== "object") options = {};
	
	  // on est une méthode privée, tous les appels sont listés plus bas
	  //if (['GET', 'POST', 'PUT', 'DELETE'].indexOf(verb) < 0) return next(new Error("Verbe http " +verb +" non géré"))
	
	  if (typeof window.XMLHttpRequest !== 'undefined') {
	    xhr = new XMLHttpRequest();
	  } else if (typeof ActiveXObject !== "undefined") {
	    var versions = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"];
	    for (var i = 0; i < versions.length; i++) {
	      try {
	        /*global ActiveXObject*/
	        xhr = new ActiveXObject(versions[i]);
	        break;
	      } catch (e) {/* on laisse tomber et on tente le suivant */}
	    }
	  }
	
	  if (typeof xhr === 'undefined') {
	    next(new Error('Appel ajax indisponible avec ce navigateur'));
	  } else {
	    if (options.urlParams) {
	      for (var p in options.urlParams) {
	        if (options.urlParams.hasOwnProperty(p)) {
	          url += url.indexOf("?") > 0 ? '&' : '?';
	          url += p + "=";
	          url += encodeURIComponent(options.urlParams[p]);
	        }
	      }
	    }
	    xhr.open(verb, url, true);
	    if (options.withCredentials) xhr.withCredentials = true;
	    if (options.responseType) xhr.responseType = options.responseType;
	    // mettre un Content-Type sur du GET déclenche un preflight,
	    // Ce Content-Type ne concerne que ce que l'on envoie donc on regarde
	    // si y'a qqchose à envoyer, et si c'est un objet on le met d'office,
	    // sinon on laisse l'appelant préciser s'il veut (on peut poster du xml par ex)
	    if (options.headers) {
	      for (var header in options.headers) {
	        if (options.headers.hasOwnProperty(header) && typeof options.headers[header] === "string") {
	          xhr.setRequestHeader(header, options.headers[header]);
	        }
	      }
	    } else if (!!data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === "object") {
	      xhr.setRequestHeader('Content-Type', 'application/json');
	    }
	    xhr.timeout = options.timeout || defaultTimeout;
	    if (xhr.timeout < minTimeout) {
	      log(new Error("timeout " + xhr.timeout + "ms trop faible sur l'url " + url + " réinitialisé à " + defaultTimeout / 1000 + "s"));
	      xhr.timeout = defaultTimeout;
	    }
	    if (xhr.timeout > maxTimeout) {
	      log(new Error("timeout " + xhr.timeout + "ms trop élevé sur l'url " + url + " réinitialisé à " + defaultTimeout / 1000 + "s"));
	      xhr.timeout = defaultTimeout;
	    }
	    xhr.onerror = function () {
	      // Pb de connexion au serveur
	      var errMsg = "Le serveur a renvoyé une erreur";
	      if (xhr.status) errMsg += ' ' + xhr.status;
	      errMsg += ' : ' + xhr.responseText;
	      next(new Error(errMsg));
	    };
	
	    xhr.ontimeout = function () {
	      var msg = "Le serveur n'a pas répondu";
	      if (options.timeout) msg += " après " + Math.floor(options.timeout / 1000) + "s d'attente.";
	      next(new Error(msg));
	    };
	
	    xhr.onreadystatechange = function () {
	      if (this.readyState == this.DONE) {
	        var error, retour;
	
	        if (this.status === 200) {
	          retour = this.response;
	        } else {
	          // KO (les redirections sont normalement gérées par le navigateur)
	          var message;
	          switch (this.status) {
	            case 0:
	              message = "Pas de connexion";
	              break;
	            case 403:
	              message = "Accès refusé";
	              break;
	            default:
	              message = "Erreur " + this.status;
	          }
	          message += " sur " + verb + " " + url;
	          // au cas où c'est du json qui renvoie une erreur
	          if (this.response && this.response.error) message += " qui précise « " + this.response.error + " »";
	          error = new Error(message);
	          error.status = this.status;
	          error.content = this.response;
	        }
	
	        next(error, retour);
	      }
	    };
	
	    if (data) {
	      try {
	        data = JSON.stringify(data);
	      } catch (error) {
	        data = undefined;
	      }
	    }
	    xhr.send(data);
	  }
	} // xhrCall
	
	module.exports = {
	  /**
	   * Appel ajax en DELETE
	   * @param {string}           url
	   * @param {string|object}    data     Données éventuelles à envoyer dans le body de la requête
	   * @param {xhrOptions}       options
	   * @param {responseCallback} callback
	   */
	  delete: function del(url, data, options, callback) {
	    xhrCall("DELETE", url, data, options, callback);
	  },
	  /**
	   * Appel ajax en GET
	   * @param {string}           url
	   * @param {xhrOptions}       options
	   * @param {responseCallback} callback
	   */
	  get: function get(url, options, callback) {
	    xhrCall("GET", url, null, options, callback);
	  },
	  /**
	   * Appel ajax en POST
	   * @param {string}           url
	   * @param {object}           data     Données éventuelles à envoyer dans le body de la requête
	   * @param {xhrOptions}       options
	   * @param {responseCallback} callback
	   */
	  post: function post(url, data, options, callback) {
	    xhrCall('POST', url, data, options, callback);
	  },
	  /**
	   * Appel ajax en PUT
	   * @param {string}           url
	   * @param {object}           data     Données éventuelles à envoyer dans le body de la requête
	   * @param {xhrOptions}       options
	   * @param {responseCallback} callback
	   */
	  put: function put(url, data, options, callback) {
	    xhrCall('PUT', url, data, options, callback);
	  }
	};
	
	/**
	 * Options éventuelles à passer avec la requête xhr
	 * @typedef xhrOptions
	 * @param {string}  responseType    Préciser json pour récupérer un objet plutôt qu'une string dans la réponse
	 * @param {object}  headers         Liste de headers à ajouter à l'appel, sous la forme header:headerValue (par ex {"Content-Type":"text/xml"})
	 * @param {boolean} withCredentials Passer true pour l'ajouter
	 * @param {object}  urlParams       Liste de clé:valeur à ajouter à l'url (les valeurs seront passées à encodeURIComponent)
	 */

	/**
	 * @callback responseCallback
	 * @param {Error}         error    Erreur éventuelle
	 * @param {string|object} response L'objet response du XMLHttpRequest, un objet si on avait précisé options.responseType = "json", une string sinon
	 */

/***/ },

/***/ 2:
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
	 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE 
	 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
	 * Consultez la GNU Affero General Public License pour plus de détails.
	 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
	 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
	 * pour une explication en français)
	 */
	
	'use strict';
	
	/**
	 * Un console.log qui plante pas sur les anciens IE (ou d'autres navigateurs qui n'auraient pas de console.log)
	 * Sera mis en global par init si on est en dev (sinon la fonction existera mais ne fera rien)
	 *
	 * Déclaré par init (dès son chargement) avec une fonction vide
	 * puis remplacé par celle qui bosse si init() est appelé avec options.verbose
	 * @param {...*} arguments Nombre variable d'arguments, chacun sera passé à console.log ou console.error si c'est une erreur
	 */
	
	function log() {
	  if (isLogEnable) {
	    var arg;
	    try {
	      for (var i = 0; i < arguments.length; i++) {
	        arg = arguments[i];
	        if (arg instanceof Error) console.error(arg);else console.log(arg);
	      }
	    } catch (e) {
	      // rien, fallait un navigateur décent...
	    }
	  }
	}
	
	/**
	 * Flag pour savoir si log() est bavard ou muet
	 * @type {boolean}
	 */
	var isLogEnable = false;
	
	/**
	 * Rend S.log() muet
	 */
	log.disable = function () {
	  isLogEnable = false;
	};
	
	/**
	 * Rend S.log() bavard
	 */
	log.enable = function () {
	  isLogEnable = true;
	};
	
	/**
	 * log une erreur avec console.error si ça existe, en prod comme en dev (utiliser log(error) pour afficher en dev seulement)
	 * @param {...Error} arguments autant qu'on veut (console.error appelée une fois par argument)
	 */
	log.error = function () {
	  if (typeof console !== "undefined" && typeof console.error === "function") {
	    for (var i = 0; i < arguments.length; i++) {
	      console.error(arguments[i]);
	    }
	  }
	};
	
	module.exports = log;

/***/ },

/***/ 3:
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
	
	var tools = __webpack_require__(4);
	var dom = __webpack_require__(5);
	var log = __webpack_require__(2);
	
	var w = window;
	var wd = w.document;
	
	/**
	 * En attendant la gestion du load async avec es6, on utilise le bon vieux head.js,
	 * on garde ici un mapping vers les modules tiers que l'on utilise
	 */
	var externalModules = {
	  ckeditor: 'vendor/ckeditor/ckeditor',
	  ckeditorJquery: 'vendor/ckeditor/adapters/jquery',
	  head: 'vendor/headjs/dist/1.0.0/head.load.min.js',
	  jquery: 'vendor/jquery/jquery-1.11.3.min',
	  jquery18: 'vendor/jquery/jquery-1.8.3.min',
	  jqueryUi: 'vendor/jqueryUi/1.11.1/jquery-ui.min',
	  jqueryUiDialog: 'vendor/jqueryUi/1.11.4.dialogRedmond/jquery-ui.min',
	  jsoneditor: 'vendor/jsoneditor/dist/jsoneditor.min.js',
	  jstree: 'vendor/jstree/dist/jstree.min.js',
	  lodash: 'vendor/lodash/lodash.min',
	  mathjax: 'vendor/mathjax/2.5/MathJax.js?config=TeX-AMS-MML_HTMLorMML&amp;delayStartupUntil=configured&amp;dummy',
	  mathquill: 'vendor/mathquill-0.9.4/mathquill.min',
	  pluginDetect: 'vendor/pluginDetect/javaFlashDetect.min.js',
	  swfobject: 'vendor/swfobject/swfobject.2.3.min.js'
	};
	
	// pour mémoriser les modules déjà chargés
	var loadedModules = {};
	
	var base = '/';
	
	/**
	 * Ajoute un texte d'erreur dans errorsContainer (#errors ou #error ou #warnings) ET dans console.error (si ça existe)
	 * L'existence de cette fonction est testée par init.js pour savoir si on doit être chargé.
	 * @param {string|Error} error Le message à afficher
	 * @param {number} [delay] Un éventuel délai d'affichage en secondes
	 */
	function addError(error, delay) {
	  // on log toujours en console
	  log.error(error);
	  var errorsContainer = wd.getElementById('errors') || wd.getElementById('error') || wd.getElementById('warnings');
	  var errorMsg = error instanceof Error ? error.toString() : error;
	  if (/^TypeError:/.test(errorMsg)) {
	    // on envoie qqchose de plus compréhensible
	    errorMsg = 'Une erreur est survenue (voir la console pour les détails)';
	  }
	  if (errorsContainer) {
	    // on ajoute un peu de margin à ce div s'il n'en a pas
	    if (errorsContainer.style && !errorsContainer.style.margin) errorsContainer.style.margin = '0.2em';
	    var errorBlock = dom.addElement(errorsContainer, 'p', { 'class': 'error' }, errorMsg);
	    if (delay) {
	      setTimeout(function () {
	        errorsContainer.remove(errorBlock);
	      }, delay * 1000);
	    }
	  } else {
	    log.error(new Error("errorsContainer n'existe pas, impossible d'afficher une erreur dedans " + errorMsg));
	  }
	}
	
	/**
	 * Cache le #titre (en global pour que les plugins puissent le faire)
	 */
	function hideTitle() {
	  try {
	    var titre = wd.getElementById('titre');
	    if (titre && titre.style) titre.style.display = 'none';
	    log(titre ? 'titre masqué' : 'demande de masquage mais titre non trouvé');
	    var picto = wd.getElementById('pictoFeedback');
	    if (picto && picto.style) picto.style.display = 'none';
	    log(picto ? 'picto feedback masqué' : 'demande de masquage mais picto feedback non trouvé');
	  } catch (e) {
	    /* tant pis */
	  }
	}
	
	/**
	 * Complète les options si besoin avec base, container, errorsContainer qui seront créés si besoin,
	 * et ajoute aux options 'urlResultatCallback', 'userOrigine', 'userId' si elles n'y sont pas et sont dans l'url
	 * @param {initOptions}   options
	 * @param {errorCallback} [next]
	 */
	function init(options, next) {
	  if (!options) options = {};
	  log('page.init avec les options', options);
	  if (!options.base) options.base = base;
	  // (des)active la fct de log si on le demande, l'url est prioritaire sur options
	  var verbose = tools.getURLParameter('verbose') || options.verbose;
	  if (verbose === '0' || verbose === 'false') verbose = false;
	  if (verbose) log.enable();else log.disable();
	
	  // on vérifie que l'on a nos containers et on les créé sinon
	  /**
	   * Le conteneur html pour afficher la ressource, passé en options ou pris dans le dom si #display
	   * @type {Element}
	   */
	  var container = options.container || wd.getElementById('display');
	  /**
	   * Le conteneur html pour afficher d'éventuelles erreurs, passé en options ou pris dans le dom si #errors
	   * @type {Element}
	   */
	  var errorsContainer = options.errorsContainer || wd.getElementById('errors');
	  if (!errorsContainer) errorsContainer = dom.addElement(wd.getElementsByTagName('body')[0], 'div', { id: 'errors' });
	  if (!container) container = dom.addElement(wd.getElementsByTagName('body')[0], 'div', { id: 'display' });
	  // et on ajoute ces deux éléments aux options
	  options.container = container;
	  options.errorsContainer = errorsContainer;
	
	  // on regarde si d'autres options ont été passé en GET
	  var paramGet;['resultatMessageAction', 'urlResultatCallback', 'userOrigine', 'userId'].forEach(function (param) {
	    paramGet = tools.getURLParameter(param);
	    if (!options[param] && paramGet) options[param] = paramGet;
	  });
	  paramGet = tools.getURLParameter('showTitle');
	  if (paramGet === '0' || paramGet === 'false') options.showTitle = false;
	
	  // terminé
	  if (next) next();
	}
	
	/**
	 * Pour charger des modules référencé ici en async, avec headJs
	 * @param {Array} moduleNames
	 * @param callback
	 */
	function loadAsync(moduleNames, callback) {
	  function headLoad(paths, cb) {
	    var loader = w.head.load || w.head.js; // les anciennes versions de head utilisaient head.js avec la même signature
	    if (loader) loader(paths, callback);else console.error('Impossible de trouver head pour chargement asynchrone');
	  }
	  function headReady(next) {
	    if (typeof window.head === 'undefined') {
	      dom.addJs(externalModules.head, function () {
	        next();
	      });
	    } else {
	      next();
	    }
	  }
	  if (typeof moduleNames === 'string') moduleNames = [moduleNames];
	
	  // on passe par head qui gèrera au passage l'unicité de l'appel
	  headReady(function () {
	    var paths = [];
	    var errors = [];
	    moduleNames.forEach(function (moduleName) {
	      if (moduleName !== 'head') {
	        var path = externalModules[moduleName];
	        if (path) path = base + path;else if (/^https?:\/\//.test(moduleName)) path = moduleName;
	        if (path) paths.push(path);else errors.push(moduleName);
	      }
	    });
	    if (errors.length) {
	      addError('Impossible de charger le ou les modules inconnus suivants ' + errors.join(', '));
	    } else if (paths.length) {
	      headLoad(paths, callback);
	    } else {
	      callback();
	    }
	  });
	}
	
	/**
	 * Change la base (pour la mettre absolue après chargement de ce module en cross domain)
	 * @param newBase
	 */
	function setBase(newBase) {
	  base = newBase;
	}
	
	/**
	 * Module de base pour les méthodes spécifiques à sesatheque et son dom (addError, hideTitle)
	 * @service page
	 */
	module.exports = { addError: addError, hideTitle: hideTitle, init: init, loadAsync: loadAsync, setBase: setBase };
	
	/**
	 * Options à passer à init() ou à display(), les autres propriétés seront laissées intactes
	 * @typedef initOptions
	 * @type {Object}
	 * @property {string}  [base=/] Le préfixe de chemin vers la racine de la sésathèque.
	 *                                        Il faut passer un chemin http://… complet si ce module est utilisé sur un autre domaine que la sésathèque
	 *                                        Inutile si l'info a déjà été donnée à requireConfig avant
	 * @property {Element} [container]        L'élément html qui servira de conteneur au plugin pour afficher sa ressource, créé si non fourni
	 * @property {Element} [errorsContainer]  L'élément html pour afficher des erreurs éventuelles, créé si non fourni
	 * @property {boolean} [verbose=false]      Passer true pour ajouter des log en console
	 */

	/**
	 * Options à passer à une méthode display d'un plugin
	 * @typedef displayOptions
	 * @type {Object}
	 * @property {string}           base        Le préfixe de chemin vers la racine de la sésathèque (chemin http absolu en cas d'appel d'un autre domaine)
	 * @property {string}           pluginBase            Le préfixe de chemin vers le dossier du plugin (mis par display)
	 * @property {Element}          container             L'élément html qui servira de conteneur au plugin pour afficher sa ressource
	 * @property {Element}          errorsContainer       L'élément html pour afficher des erreurs éventuelles
	 * @property {boolean}          [verbose=false]       Passer true pour ajouter des log en console
	 * @property {boolean}          [isDev=false]         Passer true pour initialiser le dom source en devsesamath (pour certains plugins)
	 * @property {string}           [urlResultatCallback] Une url vers laquelle poster le résultat
	 *                                                    (idem si la page de la ressource contient ?urlScoreCallback=http…)
	 * @property {string}           [resultatMessageAction] Un nom d'action pour passer le résultat en postMessage
	 * @property {resultatCallback} [resultatCallback]    Une fonction pour recevoir un objet Resultat (si y'a pas de urlScoreCallback)
	 * @property {string}           [sesatheque]          Sera ajoutée en propriété du résultat (peut être passé en param du GET de la page),
	 *                                                      le nom de la sésathèque pour un client qui récupère des résultats de plusieurs sésatheques
	 * @property {boolean}          [showTitle=true]      Passer '0' ou 'false' via l'url ou false via options pour cacher le titre
	 * @property {string}           [userOrigine]         Sera ajoutée en propriété du résultat (peut être passé en param du GET de la page)
	 * @property {string}           [userId]              Sera ajoutée en propriété du résultat (peut être passé en param du GET de la page)
	 * @property {object}           [flashvars]           Pour les plugins qui chargent du swf, sera passé en flashvars en plus
	 */

	/**
	 * @callback resultatCallback
	 * @param {Resultat} Un objet Resultat
	 */

	/**
	 * Un élément du Dom HTML
	 * @typedef Element
	 * @type {Object}
	 * @see https://developer.mozilla.org/fr/docs/Web/API/Element
	 */

/***/ },

/***/ 4:
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
	 * Module de base pour les méthodes addCss, addElement, getElement, addError, hideTitle
	 * et log (qui ne fait rien sauf si on appelle init avec options.verbose à true), log.error affiche toujours
	 */
	'use strict';
	
	// on ajoute du forEach sur les Array si le navigateur connait pas
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	if (!Array.prototype.forEach) {
	  Array.prototype.forEach = function (fn) {
	    // jshint ignore:line
	    for (var i = 0; i < this.length; i++) {
	      // on passe en argument (eltDuTableau, index, tableau)
	      fn(this[i], i, this);
	    }
	  };
	}
	
	var log = __webpack_require__(2);
	
	/**
	 * Notre module pour toutes nos fonctions génériques
	 * @module sesamath
	 */
	var tools = {};
	
	/**
	 * Récupère un paramètre de l'url courante
	 * Inspiré de http://stackoverflow.com/a/11582513
	 * Attention, les + sont transformés en espace (RFC 1738), les %20 aussi (RFC 3986),
	 * pour récupérer des + faut qu'ils soient correctement encodés en %2B
	 * @param {string}  name              Le nom du paramètre
	 * @param {boolean} [noPlusTransform] Passer true pour conserver les "+" dans le retour,
	 *                                      sinon ils seront transformés en espace (un + devrait être encodé %2B)
	 * @returns {*} Sa valeur (ou null s'il n'existait pas)
	 */
	tools.getURLParameter = function (name, noPlusTransform) {
	  var regexp = new RegExp('[?|&]' + name + '=([^&#]+?)(&|#|$)');
	  var param = regexp.exec(window.location.search);
	  if (param) {
	    var component = noPlusTransform ? param[1] : param[1].replace(/\+/g, '%20');
	    param = decodeURIComponent(component);
	  }
	  return param;
	};
	
	/**
	 * Retourne true si l'argument est un Array
	 * @param arg
	 * @returns {boolean}
	 */
	tools.isArray = function (arg) {
	  return arg instanceof Array;
	};
	
	/**
	 * Retourne true si l'argument est une fonction
	 * @param arg
	 * @returns {boolean}
	 */
	tools.isFunction = function (arg) {
	  return typeof arg === 'function';
	};
	
	/**
	 * Retourne true si l'argument est une string
	 * @param arg
	 * @returns {boolean}
	 */
	tools.isString = function (arg) {
	  return typeof arg === 'string';
	};
	
	/**
	 * Retourne l'url avec slash de fin
	 * @param {string} url
	 * @returns {string}
	 */
	tools.urlAddSlashAdd = function (url) {
	  if (typeof url === "string") {
	    if (url.length === 0 || url.substr(-1) !== "/") url += "/";
	  } else {
	    log.error("slashAdd veut une string, reçu " + (typeof url === 'undefined' ? 'undefined' : _typeof(url)));
	    url = "/";
	  }
	
	  return url;
	};
	
	/**
	 * Retourne l'url sans slash de fin
	 * @param {string} url
	 * @returns {string}
	 */
	tools.urlTrimSlash = function (url) {
	  if (typeof url === "string") {
	    if (url.length > 0 && url.substr(-1) === "/") url = url.substr(0, url.length - 1);
	  } else {
	    log.error("slashRemove veut une string, reçu " + (typeof url === 'undefined' ? 'undefined' : _typeof(url)));
	    url = "";
	  }
	
	  return url;
	};
	
	module.exports = tools;

/***/ },

/***/ 5:
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
	 * Module de base pour les méthodes addCss, addElement, getElement, addError, hideTitle
	 * et log (qui ne fait rien sauf si on appelle init avec options.verbose à true), log.error affiche toujours
	 */
	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	var log = __webpack_require__(2);
	var wd = window.document;
	
	/**
	 * Notre module pour toutes nos fonctions génériques
	 */
	var dom = {};
	
	/**
	 * Ajoute une css dans le <head> de la page
	 *
	 * Déclaré par init (dès son chargement)
	 * @param {string}  file Chemin du fichier css (mis dans href tel quel)
	 */
	dom.addCss = function (file) {
	  var head = wd.getElementsByTagName('head')[0];
	  var links = head.getElementsByTagName('link');
	  var dejala = false;
	  for (var i = 0; i < links.length; i++) {
	    if (links[i].href === file) {
	      dejala = true;
	      break;
	    }
	  }
	
	  if (dejala) {
	    log(file + " était déjà présent, on ne l'ajoute pas");
	  } else {
	    var elt = wd.createElement('link');
	    elt.rel = 'stylesheet';
	    elt.type = 'text/css';
	    elt.href = file;
	    head.appendChild(elt);
	  }
	};
	
	/**
	 * Ajoute un js à la fin du body et appelle la callback quand il est chargé
	 * @param {string}  file Chemin du fichier jss (mis dans src tel quel)
	 */
	dom.addJs = function (file, cb) {
	  function callCb() {
	    cb();
	    elt.removeEventListener('load', callCb);
	  }
	  /** @type {HTMLElement} */
	  var body = wd.getElementsByTagName('body')[0];
	  var elt = wd.createElement('script');
	  elt.type = 'text/javascript';
	  elt.src = file;
	  elt.addEventListener('load', callCb);
	  body.appendChild(elt);
	};
	
	/**
	 * Ajoute un élément html de type tag à parent
	 * @param {HTMLElement} parent
	 * @param {string} tag
	 * @param {Object=} attrs Les attributs
	 * @param {string=} content
	 * @returns {HTMLElement} L'élément ajouté
	 */
	dom.addElement = function (parent, tag, attrs, content) {
	  var elt = dom.getElement(tag, attrs, content);
	  parent.appendChild(elt);
	
	  return elt;
	};
	
	/**
	 * Ajoute un élément html juste après element
	 * @param {HTMLElement} element
	 * @param {string} tag
	 * @param {Object=} attrs Les attributs
	 * @param {string=} content
	 * @returns {HTMLElement} L'élément ajouté
	 */
	dom.addElementAfter = function (element, tag, attrs, content) {
	  var newElt = dom.getElement(tag, attrs, content);
	  var parent = element.parentNode;
	  // pas de insertAfter, si nextSibling est null ça le mettra à la fin, cf https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore
	  if (parent) parent.insertBefore(newElt, element.nextSibling);else log.error(new Error("Navigateur incompatible (pas de parentNode), impossible d'ajouter l'élément"));
	
	  return newElt;
	};
	
	/**
	 * Ajoute un élément html juste avant element
	 * @param {HTMLElement} element
	 * @param {string} tag
	 * @param {Object=} attrs Les attributs
	 * @param {string=} content
	 * @returns {HTMLElement} L'élément ajouté
	 */
	dom.addElementBefore = function (element, tag, attrs, content) {
	  var newElt = dom.getElement(tag, attrs, content);
	  var parent = element.parentNode;
	  if (parent) parent.insertBefore(newElt, element);else log.error(new Error("Navigateur incompatible (pas de parentNode), impossible d'insérer l'élément"));
	
	  return newElt;
	};
	
	/**
	 * Ajoute un élément html comme premier enfant de parent
	 * @param {HTMLElement} parent
	 * @param {string} tag
	 * @param {Object=} attrs Les attributs
	 * @param {string=} content
	 * @returns {HTMLElement} L'élément ajouté
	 */
	dom.addElementFirstChild = function (parent, tag, attrs, content) {
	  var newElt = dom.getElement(tag, attrs, content);
	  parent.insertBefore(newElt, parent.firstChild);
	
	  return newElt;
	};
	
	/**
	 * Ajoute un élément html comme frère aîné de elementRef
	 * @param {HTMLElement} elementRef
	 * @param {string} tag
	 * @param {Object=} attrs Les attributs
	 * @param {string=} content
	 * @returns {HTMLElement} L'élément ajouté
	 */
	dom.addElementFirstSibling = function (elementRef, tag, attrs, content) {
	  var newElt = dom.getElement(tag, attrs, content);
	  elementRef.parentNode.insertBefore(newElt, elementRef.parentNode.firstChild);
	
	  return newElt;
	};
	
	/**
	 * Ajoute du texte dans un élément
	 *
	 * Déclaré par init (dès son chargement)
	 * @param {HTMLElement} elt
	 * @param {string} text
	 */
	dom.addText = function (elt, text) {
	  elt.appendChild(wd.createTextNode(text));
	};
	
	/**
	 * Vide un élément html de tous ses enfants
	 *
	 * Déclaré par init (dès son chargement)
	 * @param {HTMLElement} element
	 */
	dom.empty = function (element) {
	  if (element && element.firstChild) {
	    while (element.firstChild) {
	      element.removeChild(element.firstChild);
	    }
	  }
	};
	
	/**
	 * Retourne un élément html de type tag (non inséré dans le dom)
	 *
	 * Déclaré par init (dès son chargement)
	 * @param {string} tag
	 * @param {Object=} attrs Les attributs
	 * @param {string=} txtContent
	 */
	dom.getElement = function (tag, attrs, txtContent) {
	  var elt = wd.createElement(tag);
	  var attr;
	  try {
	    if (attrs) {
	      for (attr in attrs) {
	        if (attrs.hasOwnProperty(attr)) {
	          if (attr === 'class') elt.className = attrs.class;else if (attr === 'style') dom.setStyles(elt, attrs.style);else elt.setAttribute(attr, attrs[attr]);
	        }
	      }
	    }
	  } catch (error) {
	    log('plantage dans getElement ' + tag + ' avec les attributs ', attrs, error);
	  }
	
	  if (txtContent) dom.addText(elt, txtContent);
	
	  return elt;
	};
	
	/**
	 * Retourne un id qui n'existe pas encore dans le dom (mais ne le créé pas)
	 */
	dom.getNewId = function () {
	  // une closure pour conserver la valeur de cette variable privée entre 2 appels
	  var lastId = 0;
	  return function () {
	    var id;
	    var found = false;
	    while (!found && lastId < 10000) {
	      // au dela de 10000 id dans un dom y'a un pb !
	      found = !wd.getElementById('sesa' + lastId);
	      lastId++;
	    }
	    if (found) id = 'sesa' + lastId;
	
	    return id;
	  };
	}();
	
	/**
	 * Affecte des styles à un élément html (on peut pas affecter elt.style directement car read only, faut faire du elt.style.foo = bar)
	 * sans planter en cas de pb (on le signale juste en console)
	 *
	 * Déclaré par init (dès son chargement)
	 * @param {HTMLElement} elt
	 * @param {string|object} styles
	 */
	dom.setStyles = function (elt, styles) {
	  try {
	    if (elt && elt.style) {
	      if (typeof styles === 'string') {
	        styles = styles.split(';');
	        styles.forEach(function (paire) {
	          paire = /([\w]+):(.+)/.exec(paire);
	          if (paire && paire.length === 3) {
	            var key = paire[1];
	            elt.style[key] = paire[2];
	          }
	        });
	      } else if ((typeof styles === 'undefined' ? 'undefined' : _typeof(styles)) === 'object') {
	        for (var prop in styles) {
	          if (styles.hasOwnProperty(prop)) {
	            elt.style[prop] = styles[prop];
	          }
	        }
	      }
	    }
	  } catch (error) {
	    log.error(error);
	  }
	};
	
	module.exports = dom;

/***/ },

/***/ 30:
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
	
	var dom = __webpack_require__(5);
	var log = __webpack_require__(2);
	var xhr = __webpack_require__(1);
	
	function addLink(parent, link) {
	  var li = dom.getElement('li');
	  var aOptions = {};
	  if (link.href) aOptions.href = link.href;
	  if (link.selected) aOptions.class = "selected";
	  if (link.icon) aOptions.title = link.value;
	  var a = dom.getElement('a', aOptions);
	  if (link.icon) {
	    dom.addElement(a, 'i', { class: "fa fa-" + link.icon });
	    dom.addElement(a, 'span', {}, link.value);
	  } else if (link.iconStack) {
	    var spanStack = dom.getElement('span', { class: "fa-stack fa-lg" });
	    link.iconStack.forEach(function (icon) {
	      dom.addElement(spanStack, 'i', { class: "fa fa-" + icon });
	    });
	    a.appendChild(spanStack);
	    dom.addElement(a, 'span', {}, link.value);
	  } else {
	    dom.addText(a, link.value);
	  }
	  li.appendChild(a);
	  parent.appendChild(li);
	}
	
	/**
	 * Met à jour l'affichage des infos du user sur les pages publiques (dont le source est en cache, en version non authentifié)
	 * (vérifie si on est authentifié avec un appel ajax, pour ajouter les infos et les boutons qui vont bien)
	 * @service page/refreshAuth
	 */
	module.exports = function () {
	  if (window.location.pathname.indexOf("/public/") > -1) {
	    var url = "/api/auth";
	    // on regarde si on est sur une ressource
	    var match = window.location.pathname.match(/\/public\/[a-z]+\/(.+)$/);
	    if (match) url += "?ressourceId=" + match[1];
	    xhr.get(url, { withCredentials: true, responseType: "json" }, function (error, response) {
	      log.enable();
	      log("on récupère auth", response);
	      if (error) {
	        log.error(error);
	      } else if (response && response.isLogged) {
	        if (response.authBloc) {
	          var data = response.authBloc;
	          var authBloc = document.getElementById("auth");
	          if (authBloc) {
	            // Cf views/auth.dust
	            dom.empty(authBloc);
	            var a = dom.addElement(authBloc, 'a', { href: "#" });
	            dom.addElement(a, 'i', { class: "fa fa-user" });
	            dom.addText(a, " ");
	            dom.addElement(a, 'i', { class: "fa fa-ellipsis-v" });
	            var ul = dom.addElement(authBloc, 'ul');
	            dom.addElement(ul, 'div', {}, data.user.prenom + " " + data.user.nom);
	            data.ssoLinks.forEach(function (link) {
	              addLink(ul, link);
	            });
	            addLink(ul, data.logoutLink);
	          }
	        } else {
	          log.error("pas de authBloc dans la réponse de l'api");
	        }
	        // on passe aux boutons d'action si on est sur une ressource
	        if (response.permissions && document.getElementById("actions")) {
	          if (response.permissions.indexOf("C") > -1) dom.setStyles(document.getElementById("buttonDuplicate"), { display: "block" });
	          if (response.permissions.indexOf("D") > -1) dom.setStyles(document.getElementById("buttonDelete"), { display: "block" });
	          if (response.permissions.indexOf("W") > -1) dom.setStyles(document.getElementById("buttonEdit"), { display: "block" });
	        }
	        // la navigation
	        if (response.permissions.indexOf("C") > -1) dom.setStyles(document.getElementById("buttonAdd"), { display: "inline-block" });
	        var buttonMyRessources = document.getElementById("buttonMyRessources");
	        if (buttonMyRessources && response.oid) {
	          buttonMyRessources.href += response.oid;
	          dom.setStyles(buttonMyRessources, { display: "inline-block" });
	        }
	        var buttonSearch = document.getElementById("buttonSearch");
	        if (buttonSearch) buttonSearch.href = buttonSearch.href.replace("public", "ressource");
	      }
	    });
	  }
	};

/***/ }

/******/ });
//# sourceMappingURL=page.bundle.js.map