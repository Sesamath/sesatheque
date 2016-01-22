(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = ({}).hasOwnProperty;

  var endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  };

  var _cmp = 'components/';
  var unalias = function(alias, loaderPath) {
    var start = 0;
    if (loaderPath) {
      if (loaderPath.indexOf(_cmp) === 0) {
        start = _cmp.length;
      }
      if (loaderPath.indexOf('/', start) > 0) {
        loaderPath = loaderPath.substring(start, loaderPath.indexOf('/', start));
      }
    }
    var result = aliases[alias + '/index.js'] || aliases[loaderPath + '/deps/' + alias + '/index.js'];
    if (result) {
      return _cmp + result.substring(0, result.length - '.js'.length);
    }
    return alias;
  };

  var _reg = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (_reg.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';
    path = unalias(name, loaderPath);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has.call(cache, dirIndex)) return cache[dirIndex].exports;
    if (has.call(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  require.list = function() {
    var result = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  require.brunch = true;
  require._cache = cache;
  globals.require = require;
})();
require.register("tools/xhr", function(exports, require, module) {
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

var log = require('./log');

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
});

;require.register("tools/log", function(exports, require, module) {
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
});

;require.register("apiClient", function(exports, require, module) {
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

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var xhr = require('./tools/xhr');

/**
 * Une fonction qui prend une base de sésathèque et renvoie un client dessus
 * @module apiClient
 */

/**
 * Ajoute les propriétés xxxUrl et public
 * @private
 * @param {Ressource} ressource
 */
function addUrls(ressource, next) {
  var id = ressource.id || ressource.ref || ressource.oid;
  if (!id && ressource.origine && ressource.idOrigine) id = ressource.origine + '/' + ressource.idOrigine;
  var prefix = ressource.restriction === 0 || ressource.public ? 'public' : 'ressource';
  if (id) {
    ressource.dataUrl = base + 'api/' + prefix + '/' + id;
    ressource.deleteUrl = base + 'api/ressource/' + id;
    ressource.displayUrl = base + prefix + '/' + id;
    ressource.editUrl = base + 'ressource/modifier/' + id;
    ressource.public = ressource.public || ressource.restriction === 0;
  }
  next(null, ressource);
}

/**
 * Fonction exportée, affecte l'url absolue de la sesathèque et retourne les méthodes
 * @param {string} newSesathequeBase L'url absolue de la sesathèque (le slash de fin sera ajouté si manquant)
 * @returns {stClient}
 */
function init(newSesathequeBase) {
  if (!newSesathequeBase) throw new Error("Il faut fournir une base absolue de la sesatheque");
  if (!/^https?:\/\/[a-z\-\._]+(:[0-9]+)?(\/.*)?$/.test(newSesathequeBase)) throw new Error("La base " + newSesathequeBase + " n'est pas une racine d'url absolue valide");
  if (typeof name !== "string") throw new Error("Le nom doit être une string");
  if (newSesathequeBase.substr(-1) !== "/") newSesathequeBase += "/";
  base = newSesathequeBase;
  return stClient;
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
    if (error) next(error);else addUrls(ressource, next);
  }
  var url,
      xhrOptions = {};
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
  if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === "object") {
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
var base;

/**
 * Méthodes du client
 * @type {stClient}
 */
var stClient = {
  /**
   * Récupère une ressource sur la bibliothèque en ajax sous forme d'alias
   * @memberOf stClient
   * @param {Integer|string}    id   peut être un oid de la sesatheque ou origine/idOrigine
   * @param {ressourceCallback} next
   */
  getAlias: function getAlias(id, next) {
    if (!next || typeof next !== 'function') next(new Error('Il faut fournir une fonction de rappel'));else if (id) callBibli(id, { format: "alias" }, next);else next(new Error("Il faut fournir un identifiant"));
  },
  /**
   * Récupère une ressource sur la bibliothèque en ajax
   * @memberOf stClient
   * @param {Integer|string}    id       peut être un oid de la sesatheque ou origine/idOrigine
   * @param {string}            [format] alias|compact
   * @param {ressourceCallback} next
   */
  getRessource: function getRessource(id, format, next) {
    var options;
    if (typeof format === "function") {
      next = format;
    } else {
      options = { format: format };
    }
    if (!next || typeof next !== 'function') next(new Error('Il faut fournir une fonction de rappel'));else if (id) callBibli(id, options, next);else next(new Error("Il faut fournir un identifiant"));
  },
  /**
   * Enregistre une ressource sur la bibliotheque
   * @memberOf stClient
   * @param {Ressource}         ressource
   * @param {ressourceCallback} next
   */
  setRessource: function setRessource(ressource, isPartial, next) {
    var options;
    if (typeof isPartial === "function") {
      next = isPartial;
    } else if (isPartial) {
      options = { merge: 1 };
    }
    if (!next || typeof next !== 'function') next(new Error('Il faut fournir une fonction de rappel'));else if (ressource) callBibli(ressource, options, next);else next(new Error("Il faut fournir une ressource"));
  }
};

module.exports = init;
});

;
//# sourceMappingURL=apiClient.bundle.js.map