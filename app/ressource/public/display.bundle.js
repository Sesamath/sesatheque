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
require.register("tools/dom", function(exports, require, module) {
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
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var log = require('./log');
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
  var head = wd.getElementsByTagName("head")[0];
  var links = head.getElementsByTagName("link");
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
    var elt = wd.createElement("link");
    elt.rel = "stylesheet";
    elt.type = "text/css";
    elt.href = file;
    head.appendChild(elt);
  }
};

/**
 * Ajoute un élément html de type tag à parent
 * @param {Element} parent
 * @param {string} tag
 * @param {Object=} attrs Les attributs
 * @param {string=} content
 * @returns {Element} L'élément ajouté
 */
dom.addElement = function (parent, tag, attrs, content) {
  var elt = dom.getElement(tag, attrs, content);
  parent.appendChild(elt);

  return elt;
};

/**
 * Ajoute un élément html juste après element
 * @param {Element} element
 * @param {string} tag
 * @param {Object=} attrs Les attributs
 * @param {string=} content
 * @returns {Element} L'élément ajouté
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
 * @param {Element} element
 * @param {string} tag
 * @param {Object=} attrs Les attributs
 * @param {string=} content
 * @returns {Element} L'élément ajouté
 */
dom.addElementBefore = function (element, tag, attrs, content) {
  var newElt = dom.getElement(tag, attrs, content);
  var parent = element.parentNode;
  if (parent) parent.insertBefore(newElt, element);else log.error(new Error("Navigateur incompatible (pas de parentNode), impossible d'insérer l'élément"));

  return newElt;
};

/**
 * Ajoute un élément html comme premier enfant de parent
 * @param {Element} parent
 * @param {string} tag
 * @param {Object=} attrs Les attributs
 * @param {string=} content
 * @returns {Element} L'élément ajouté
 */
dom.addElementFirstChild = function (parent, tag, attrs, content) {
  var newElt = dom.getElement(tag, attrs, content);
  parent.insertBefore(newElt, parent.firstChild);

  return newElt;
};

/**
 * Ajoute un élément html comme frère aîné de elementRef
 * @param {Element} elementRef
 * @param {string} tag
 * @param {Object=} attrs Les attributs
 * @param {string=} content
 * @returns {Element} L'élément ajouté
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
 * @param {Element} elt
 * @param {string} text
 */
dom.addText = function (elt, text) {
  elt.appendChild(wd.createTextNode(text));
};

/**
 * Vide un élément html de tous ses enfants
 *
 * Déclaré par init (dès son chargement)
 * @param {Element} element
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
    if (attrs) for (attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        if (attr === 'class') elt.className = attrs.class;else if (attr === 'style') dom.setStyles(elt, attrs.style);else elt.setAttribute(attr, attrs[attr]);
      }
    }
  } catch (error) {
    log("plantage dans getElement " + tag + " avec les attributs ", attrs, error);
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
 * @param {Element} elt
 * @param {string|object} styles
 */
dom.setStyles = function (elt, styles) {
  try {
    if (elt) {
      if (!elt.style) elt.style = {};
      if (typeof styles === 'string') {
        styles = styles.split(';');
        styles.forEach(function (paire) {
          paire = /([\w]+):(.+)/.exec(paire);
          if (paire && paire.length === 3) {
            var key = paire[1];
            elt.style[key] = paire[2];
          }
        });
      } else if ((typeof styles === "undefined" ? "undefined" : _typeof(styles)) === 'object') {
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
});

;require.register("tools/filters", function(exports, require, module) {
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

"use strict";

/**
 * @file Collection de fonctions permettant de filtrer une variable d'après le type attendu
 */

var filters = {};

/**
 * Retourne le tableau passé en argument ou un tableau vide si l'argument n'était pas un Array
 * @param {Array} arg L'array à controler
 * @returns {Array}
 */
filters.array = function (arg) {
  return arg instanceof Array ? arg : [];
};

/**
 * Retourne le tableau passé en argument ou un tableau vide si l'argument n'était pas un Array
 * Tous les éléments qui ne sont pas des entiers positifs (0 accepté) seront éliminés
 * @param {Array} arg L'array à controler
 * @returns {Array}
 */
filters.arrayInt = function (arg) {
  arg = filters.array(arg);
  // IE < 9 connait pas filter
  if (arg.filter) {
    arg = arg.filter(function (elt) {
      return parseInt(elt, 10) === elt && elt > -1;
    });
  }
  return arg;
};

/**
 * Retourne le tableau passé en argument ou un tableau vide si l'argument n'était pas un Array
 * Tous les éléments qui ne sont pas des entiers positifs seront éliminés
 * @param {Array} arg L'array à controler
 * @returns {Array}
 */
filters.arrayString = function (arg) {
  arg = filters.array(arg);
  // IE < 9 connait pas filter
  if (arg.filter) {
    arg = arg.filter(function (elt) {
      return typeof elt === 'string';
    });
  }
  return arg;
};

/**
 * Retourne l'entier positif fourni ou 0
 * @param {number|string} arg
 * @returns {number}
 */
filters.int = function (arg) {
  var int = 0;
  if (typeof arg === 'string') int = parseInt(arg, 10);else if (typeof arg === 'number') int = Math.floor(arg);
  if (int < 1 || int != arg) int = 0;
  return int;
};

/**
 * Retourne un objet Date (on tente un cast si on nous fourni une string ou un entier) ou undefined
 * @param arg
 * @returns {Date|undefined}
 */
filters.date = function (arg) {
  var retour;
  if (arg instanceof Date) retour = arg;else if (arg && (typeof arg === 'string' || typeof arg === 'number')) retour = new Date(arg);
  return retour;
};

/**
 * Retourne la chaine passée en argument ou une chaine vide
 * si l'argument est undefined ou ne peut pas être casté avec String()
 * @param arg
 * @returns {string}
 */
filters.string = function (arg) {
  var retour = '';
  if (typeof arg === 'string') retour = arg;else if (arg) {
    retour = String(arg);
    if (retour === 'undefined' || retour === '[object Object]') retour = '';
  }
  return retour;
};

module.exports = filters;
});

;require.register("tools/index", function(exports, require, module) {
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
"use strict";

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

var log = require('./log');

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

;require.register("tools/xhr", function(exports, require, module) {
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

;require.register("page/index", function(exports, require, module) {
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

"use strict";
// l'écriture suivante fonctionne aussi, mais sans avoir l'autocomplétion dans l'IDE :-/

var tools = require('../tools');
var dom = require('../tools/dom');
var log = require('../tools/log');
var wd = window.document;

/**
 * En attendant la gestion du load async avec es6, on utilise le bon vieux head.js,
 * on garde ici un mapping vers les modules tiers que l'on utilise
 */
var externalModules = {
  ckeditor: '/vendor/ckeditor/ckeditor',
  ckeditorJquery: '/vendor/ckeditor/adapters/jquery',
  jquery: '/vendor/jquery/jquery-1.11.3.min',
  jquery18: '/vendor/jquery/jquery-1.8.3.min',
  jqueryUi: '/vendor/jqueryUi/1.11.1/jquery-ui.min',
  jqueryUiDialog: '/vendor/jqueryUi/1.11.4.dialogRedmond/jquery-ui.min',
  jsoneditor: '/vendor/jsoneditor/dist/jsoneditor.min.js',
  jstree: '/vendor/jstree/dist/jstree.min.js',
  lodash: '/vendor/lodash/lodash.min',
  mathjax: '/vendor/mathjax/2.5/MathJax.js?config=TeX-AMS-MML_HTMLorMML&amp;delayStartupUntil=configured&amp;dummy',
  mathquill: '/vendor/mathquill-0.9.4/mathquill.min',
  pluginDetect: '/vendor/pluginDetect/javaFlashDetect.min.js',
  swfobject: '/vendor/swfobject/swfobject.2.3'
};

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
    errorMsg = "Une erreur est survenue (voir la console pour les détails)";
  }
  if (errorsContainer) {
    // on ajoute un peu de margin à ce div s'il n'en a pas
    if (errorsContainer.style && !errorsContainer.style.margin) errorsContainer.style.margin = "0.2em";
    var errorBlock = dom.addElement(errorsContainer, 'p', { "class": "error" }, errorMsg);
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
    if (titre && titre.style) titre.style.display = "none";
    log(titre ? "titre masqué" : "demande de masquage mais titre non trouvé");
    var picto = wd.getElementById('pictoFeedback');
    if (picto && picto.style) picto.style.display = "none";
    log(picto ? "picto feedback masqué" : "demande de masquage mais picto feedback non trouvé");
  } catch (e) {
    /* tant pis */
  }
}

/**
 * Complète les options si besoin avec base, container, errorsContainer qui seront créés si besoin,
 * et ajoute aux options "urlResultatCallback", "userOrigine", "userId" si elles n'y sont pas et sont dans l'url
 * @param {initOptions}   options
 * @param {errorCallback} next
 */
function init(options, next) {
  if (!options) options = {};
  log('page.init avec les options', options);
  if (!options.base) options.base = base;
  // (des)active la fct de log si on le demande, l'url est prioritaire sur options
  var verbose = tools.getURLParameter("verbose") || options.verbose;
  if (verbose === "0" || verbose === "false") verbose = false;
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
  var paramGet;
  ["resultatMessageAction", "urlResultatCallback", "userOrigine", "userId"].forEach(function (param) {
    paramGet = tools.getURLParameter(param);
    if (!options[param] && paramGet) options[param] = paramGet;
  });
  paramGet = tools.getURLParameter("showTitle");
  if (paramGet === "0" || paramGet === "false") options.showTitle = false;

  // terminé
  if (next) next();
}

/**
 * Pour charger des modules référencé ici en async, avec headJs
 * @param {Array} moduleNames
 * @param callback
 */
function loadAsync(moduleNames, callback) {
  /*global head*/
  var paths = [],
      errors = [],
      path;
  var loader = head.load || head.js; // les anciennes versions de head utilisaient head.js avec la même signature
  moduleNames.forEach(function (moduleName) {
    path = externalModules[moduleName];
    if (!path && /^https?:\/\//.test(moduleName)) path = moduleName;
    if (path) paths.push(path);else errors.push(moduleName);
  });
  if (errors.length) addError("Impossible de charger le ou les modules inconnus suivants " + errors.join(", "));else if (paths.length) loader(paths, callback);else log.error("appel de loadAsync sans modules");
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
 * @property {boolean}          [showTitle=true]      Passer "0" ou "false" via l'url ou false via options pour cacher le titre
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
});

;require.register("page/refreshAuth", function(exports, require, module) {
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
"use strict";

var dom = require('../tools/dom');
var log = require('../tools/log');
var xhr = require('../tools/xhr');

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
});

;require.register("display/autosize", function(exports, require, module) {
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

"use strict";

//var dom = require('../../tools/dom')

var log = require('../../tools/log');
var $ = window.jQuery; /* jshint jquery:true */

var $blocsH, $blocsW, $target;
var offsetHeight = 0,
    offsetWidth = 0,
    minHeight = 400,
    minWidth = 400;

/**
 * Modifie la taille de l'iframe pour lui donner tout l'espace restant de container
 */
function resize() {
  var occupe = offsetHeight,
      tailleDispo;
  // hauteur
  if ($blocsH) $blocsH.forEach(function ($bloc) {
    occupe += $bloc.outerHeight(true);
  });
  tailleDispo = Math.floor(window.innerHeight - occupe);
  if (tailleDispo < minHeight) tailleDispo = minHeight;
  log('resize height à ' + tailleDispo);
  $target.css("height", tailleDispo + 'px');

  // largeur
  occupe = offsetWidth;
  if ($blocsW) $blocsW.forEach(function ($bloc) {
    occupe += $bloc.outerWidth(true);
  });
  tailleDispo = Math.floor(window.innerWidth - occupe);
  if (tailleDispo < minWidth) tailleDispo = minWidth;
  log('resize width à ' + tailleDispo);
  $target.css("width", tailleDispo + 'px');
}

/**
 * Affecte un comportement de redimensionnement automatique à un élément
 * @service display/autosize
 * @param {string}   targetId L'id html du bloc que l'on veut maximiser automatiquement
 * @param {string[]} hBlocIds Liste des ids de bloc dont il faut déduire la hauteur
 * @param {string[]} wBlocIds Liste des ids de bloc dont il faut déduire la largeur
 */
module.exports = function autosize(targetId, hBlocIds, wBlocIds, options) {
  // on initialise dès que jQuery est prêt
  $(function () {
    $target = $("#" + targetId);
    if (hBlocIds && hBlocIds.length) {
      $blocsH = [];
      hBlocIds.forEach(function (id) {
        var $bloc = $("#" + id);
        if ($bloc) $blocsH.push($bloc);
      });
    }
    if (wBlocIds && wBlocIds.length) {
      $blocsW = [];
      wBlocIds.forEach(function (id) {
        var $bloc = $("#" + id);
        if ($bloc) $blocsW.push($bloc);
      });
    }
    if (options && options.minHeight) minHeight = options.minHeight;
    if (options && options.minWidth) minWidth = options.minWidth;
    if (options && options.offsetHeight) offsetHeight = options.offsetHeight;
    if (options && options.offsetWidth) offsetWidth = options.offsetWidth;
    resize();
    // et à chaque changement de la taille de la fenêtre
    $(window).resize(resize);
  });
};
});

;require.register("display/index", function(exports, require, module) {
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
"use strict";

var page = require('../page');
var log = require('../tools/log');
var dom = require('../tools/dom');
var tools = require('../tools');
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
      var pluginDisplay = require('../plugins/' + pluginName + '/display');
      if (!pluginDisplay) throw new Error("L'affichage des ressources de type " + pluginName + " n'est pas encore implémenté");
      // pour envoyer les résultats, on regarde si on nous fourni une url ou une fct ou un nom de message
      var Resultat, traiteResultat;

      if (options) {
        if (options.resultatCallback && tools.isFunction(options.resultatCallback)) traiteResultat = "function";else if (options.urlResultatCallback && tools.isString(options.urlResultatCallback) && options.urlResultatCallback.substr(0, 4) === 'http') traiteResultat = "ajax"; // jshint ignore:line
        else if (options && options.resultatMessageAction && tools.isString(options.resultatMessageAction)) traiteResultat = "message";
      }
      // un cas particulier, le prof qui teste, on fourni une callback qui fait rien,
      // pour éviter des avertissements sur les ressources qui attendent une callback
      if (traiteResultat === "none") traiteResultat = function traiteResultat() {};
      if (traiteResultat) Resultat = require('../Resultat');

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
        if (!options.base) options.base = "/";else if (options.base.substring(-1) !== "/") options.base += "/";
        options.pluginBase = options.base + "/plugins/" + pluginName + "/";
        // on peut afficher
        pluginDisplay(ressource, options, function (error) {
          startDate = new Date();
          if (error) {
            log("le display a terminé mais renvoyé l'erreur", error);
            page.addError(error);
          } else {
            log("le display a terminé sans erreur");
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
         */
        function sendAjax(resultat, deferSync) {
          // c'est une url, on gère l'envoi
          if (typeof XMLHttpRequest === "undefined") {
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
            feedback({ error: "Impossible d'envoyer le résultat (à " + options.urlResultatCallback + ")" });
          };

          // et on envoie, mais sur le proxy si sync (car on est sur un event unload et l'envoi de la requete options est annulée en cross domain)
          var url;
          if (deferSync) {
            resultat.deferUrl = options.urlResultatCallback;
            url = options.base + 'api/deferPost';
            log("on passe en synchrone vers " + url);
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
          var resultatProp = chunks[1] || "resultat";
          var message = {
            action: action
          };
          message[resultatProp] = resultat;
          // on envoie
          window.top.postMessage(message, "*");
        }

        // MAIN addResultatCallback
        log("resultatCallback display a reçu", result);
        var deferSync = result.deferSync;
        var resultat = new Resultat(result);
        // on impose juste date et durée
        resultat.date = new Date();
        // le plugin peut imposer sa mesure
        if (!resultat.duree && startDate) {
          resultat.duree = Math.floor((new Date().getTime() - startDate.getTime()) / 1000);
        }
        // on regarde si on nous a demandé d'ajouter des paramètres utilisateur au résultat
        ["sesatheque", "userOrigine", "userId"].forEach(function (paramName) {
          var paramValue = tools.getURLParameter(paramName) || options[paramName];
          if (paramValue) resultat[paramName] = paramValue;
        });
        // @todo ajouter des vérifs minimales

        // si on nous a passé une fct on lui envoie le résultat
        if (traiteResultat === "function") {
          log('on envoie ce résultat à la fct qui nous a été passé en param', resultat);
          options.resultatCallback(resultat);
        } else if (traiteResultat === "ajax") {
          log("on va poster ce résultat vers " + traiteResultat, resultat);
          sendAjax(resultat, deferSync);
        } else if (traiteResultat === "message") {
          if (options.resultatMessageAction === "none") {
            log("On a reçu ce résultat (que l'on ne fait pas suivre on est en test)", resultat);
          } else {
            log("postMessage de ce résultat vers " + traiteResultat, resultat);
            sendMessage(resultat);
          }
        }
      }; // fin définition options.resultatCallback
    }
  } // addResultatCallback

  page.init(options, load);
}

module.exports = display;
});

;require.register("display/jstreeConverter", function(exports, require, module) {
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

var log = require('../tools/log');

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
});

;require.register("display/swf", function(exports, require, module) {
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
"use strict";

var page = require('../page');
//var dom = require('../tools/dom')
var log = require('../tools/log');

var swfobject = window.swfobject;

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
  swfobject.embedSWF(swfHref, divId, largeur, hauteur, flashversion, null, flashvars, swfParams, swfAttributes, callbackFn);
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
});

;require.register("plugins/am/display", function(exports, require, module) {
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

var page = require('../../page');
var dom = require('../../tools/dom');
var log = require('../../tools/log');
var swf = require('../../display/swf');

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
});

;require.register("plugins/arbre/display", function(exports, require, module) {
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

"use strict";

var page = require('../../page');
var dom = require('../../tools/dom');
var log = require('../../tools/log');
var jstreeConverter = require('../../display/jstreeConverter');

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
});

;require.register("plugins/ato/display", function(exports, require, module) {
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

var page = require('../../page');
var dom = require('../../tools/dom');
var log = require('../../tools/log');

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
});

;require.register("plugins/calkc/display", function(exports, require, module) {
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
"use strict";

var page = require('../../page');
var dom = require('../../tools/dom');
var log = require('../../tools/log');
var swf = require('../../display/swf');

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
});

;require.register("plugins/coll_doc/display", function(exports, require, module) {
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

var page = require('../../page');
var dom = require('../../tools/dom');
var log = require('../../tools/log');

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
});

;require.register("plugins/ec2/display", function(exports, require, module) {
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

var page = require('../../page');
var tools = require('../../tools');
var dom = require('../../tools/dom');
var log = require('../../tools/log');
var swf = require('../../display/swf');

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
});

;require.register("plugins/ecjs/display", function(exports, require, module) {
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

var page = require('../../page');
var tools = require('../../tools');
var dom = require('../../tools/dom');
var log = require('../../tools/log');

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
      if (typeof require !== "undefined") require = undefined; // jshint ignore:line
      if (typeof define !== "undefined") define = undefined; // jshint ignore:line
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
});

;require.register("plugins/em/display", function(exports, require, module) {
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
"use strict";

var page = require('../../page');
var dom = require('../../tools/dom');
var log = require('../../tools/log');
var swf = require('../../display/swf');

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
});

;require.register("plugins/iep/display", function(exports, require, module) {
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

var page = require('../../page');
var dom = require('../../tools/dom');
var log = require('../../tools/log');

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
          var xhr = require('tools/xhr');
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
});

;require.register("plugins/j3p/display", function(exports, require, module) {
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

var page = require('../../page');
var tools = require('../../tools');
//var dom = require('../../tools/dom')
var log = require('../../tools/log');
var xhr = require('../../tools/xhr');

var urlBaseJ3p = "http://j3p.sesamath.net";

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
    log("lancement du chargement j3p sur " + urlBaseJ3p);
    page.loadAsync([urlBaseJ3p + '/outils/loader.js'], function () {
      var loader = require('j3p/loader');
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
        log("loader j3p avec le graphe", ressource.parametres.g);
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
    //les params minimaux
    if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.g) throw new Error("Ressource incomplète");
    if (!options.container || !options.errorsContainer) throw new Error("Paramètres manquants");

    // le domaine où prendre les js j3p
    if (options.isDev) {
      urlBaseJ3p = 'http://j3p.devsesamath.net';
    }

    var lastResultUrl = tools.getURLParameter("lastResultUrl");
    if (lastResultUrl) {
      log("on va chercher un lastResultat sur " + lastResultUrl);
      xhr.get(lastResultUrl, { responseType: "json" }, function (error, lastResultat) {
        if (error) {
          page.addError("Impossible de récupérer le dernier résultat");
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
});

;require.register("plugins/mathgraph/display", function(exports, require, module) {
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

var page = require('../../page');
var tools = require('../../tools');
var dom = require('../../tools/dom');
var log = require('../../tools/log');

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
  require(dependencies, function () {
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
});

;require.register("plugins/mental/display", function(exports, require, module) {
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

var page = require('../../page');
var tools = require('../../tools');
var dom = require('../../tools/dom');
var log = require('../../tools/log');
var swf = require('../../display/swf');

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
});

;require.register("plugins/url/display", function(exports, require, module) {
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
"use strict";

var page = require('../../page');
var dom = require('../../tools/dom');
var log = require('../../tools/log');
var swf = require('../../display/swf');

var $ = window.jQuery; /*jshint jquery:true*/

/**
 * Ajoute l'iframe (ou un div si c'est un swf directement)
 * @private
 */
function addPage(params, next) {
  log("addPage avec les params", params);
  var url = params.adresse;
  var page = dom.addElement(container, 'div', { id: "page" });
  var args = { src: url, id: "pageContent" };

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
    log("On charge " + url + " dans #page avec", options);
    swf.load(swfContainer, url, options, function () {
      if (!options.hauteur && !options.largeur) autosize();
      // on est appelé quand swfobject a mis l'object dans le dom, mais le swf est pas forcément chargé
      // on regarde la hauteur pour savoir si c'est fait
      var $swfId = $('#' + swfId);
      if ($swfId.innerHeight() > 10) next();else $swfId.on('load', function () {
        isLoaded = true;
        next();
      }); // ne pas passer directement next en cb sinon il sera appelé avec un argument, qui sera interprété comme une erreur
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
      var iframe = dom.addElement(page, 'iframe', args, "Si vous lisez ce texte," + " votre navigateur ne supporte probablement pas les iframes");
      // url source (non cliquable) en footer
      autosize();
      if (iframe.addEventListener) {
        iframe.addEventListener("load", function () {
          isLoaded = true;
          next();
        });
      } else {
        isLoaded = true;
        next();
      }
    }
  dom.addElement(page, 'p', { id: 'urlSrc' }, "source : " + params.adresse);
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
  var $page = $("#page");
  var $pageContent = $("#pageContent");
  var occupe = 0;
  ["#errors", "#warnings", "#titre", "#entete", "#urlSrc"].forEach(function (selector) {
    occupe += $(selector).outerHeight(true);
  });
  var tailleDispo = Math.floor(window.innerHeight - occupe);
  if (tailleDispo < 300) tailleDispo = 300;
  $("#display").css("height", tailleDispo + 'px');
  log('resize iframe à ' + tailleDispo);
  // pour l'iframe de l'url, faut retirer ce que l'on utilise pour consigne & co
  if (!isBasic) tailleDispo -= $('#entete').innerHeight();
  $page.css("height", tailleDispo + 'px');
  $pageContent.css("height", tailleDispo + 'px');
  // et la largeur de l'iframe
  tailleDispo = $(container).innerWidth() - 4; // 2px de marge dans le css
  if (tailleDispo < 300) tailleDispo = 300;
  log('resize largeur à ' + tailleDispo);
  $page.css("width", tailleDispo + 'px');
  $pageContent.css("width", tailleDispo + 'px');
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

var container, errorsContainer, isBasic, ressId, resultatCallback, isLoaded;

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
    //les params minimaux
    if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.adresse) throw new Error("Ressource incomplète");
    ["base", "pluginBase", "container", "errorsContainer"].forEach(function (param) {
      if (!options[param]) throw new Error("Paramètre " + param + " manquant");
    });

    // init de nos var globales
    container = options.container;
    errorsContainer = options.errorsContainer;
    if (typeof options.resultatCallback === 'function') resultatCallback = options.resultatCallback;
    ressId = ressource.oid;

    // raccourcis
    var params = ressource.parametres;
    var url = params.adresse;
    if (!url) throw new Error("Url manquante");
    if (!/^https?:\/\//.test(url)) throw new Error("Url invalide : " + url);

    // init
    dom.addCss(options.pluginBase + 'url.css');

    var hasConsigne = params.question_option && params.question_option !== 'off';
    var hasReponse = params.answer_option && params.answer_option !== 'off';
    var isBasic = !hasConsigne && !hasReponse;
    // ni question ni réponse
    if (isBasic) {
      addPage(params, next);
      if (resultatCallback) {
        // un listener pour envoyer "affiché" comme score (i.e. un score de 1 avec une durée)
        $('body').on('unload', function () {
          if (isLoaded) sendResultat(null, true);
        });
      } // sinon rien à faire
    } else {
        /**
         * Ajout des comportements pour la gestion des panneaux Consigne et Réponse avec jQueryUi
         */
        var dependances = [options.pluginBase + 'urlUi.js', "jqueryUiDialog"];
        var hasCkeditor = params.answer_editor && params.answer_editor.indexOf('ckeditor') === 0;
        var hasMqEditor = params.answer_editor === 'mqEditor';
        var editorName;
        if (hasCkeditor) editorName = 'ckeditor';else if (hasMqEditor) editorName = "mqEditor";
        if (editorName) dependances.push(editorName);
        page.loadAsync(dependances, function () {
          function sendReponse() {
            if (!isResultatSent) {
              var reponse = $(textarea).val();
              sendResultat(reponse, false, function (retour) {
                if (retour && (retour.ok || retour.success)) isResultatSent = true;
              });
            }
          }

          var editor;
          if (editorName) editor = require("editors/" + editorName);
          var urlUi = require('../../plugins/url/displayUi');
          // on ajoute tous nos div même si tous ne serviront pas (car urlUi les cherche dans la page)
          var entete = dom.addElement(container, 'div', { id: 'entete' });
          dom.addElement(entete, 'div', { id: 'lienConsigne' }, 'Consigne');
          dom.addElement(entete, 'div', { id: 'lienReponse' }, 'Réponse');
          dom.addElement(entete, "div", { id: "filariane" });
          dom.addElement(entete, 'div', { id: "information", "class": "invisible" });
          var divConsigne = dom.addElement(entete, 'div', { id: "consigne", "class": "invisible" });
          var divReponse = dom.addElement(entete, 'div', { id: "reponse", "class": "invisible" });
          if (hasConsigne) {
            if (params.consigne) $(divConsigne).html(params.consigne);else log.error("Pas de consigne alors que question_option vaut " + params.question_option);
          }
          if (hasReponse) {
            var form = dom.addElement(divReponse, 'form', { action: "" });
            var textarea = dom.addElement(form, 'textarea', { id: "answer", cols: "50", rows: "10" });
            if (hasCkeditor) {
              /* global CKEDITOR */
              if (CKEDITOR.env.ie && CKEDITOR.env.version < 9) CKEDITOR.tools.enableHtml5Elements(document);
              CKEDITOR.config.height = 150;
              CKEDITOR.config.width = 'auto';
              if (params.answer_editor == 'ckeditorTex') {
                CKEDITOR.config.extraPlugins = 'mathjax';
                CKEDITOR.config.mathJaxLib = "/vendors/mathjax/2.2/MathJax.js?config=TeX-AMS-MML_HTMLorMML";
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
              var boutonReponse = dom.addElement(form, 'button', { id: "envoi" }, "Enregistrer cette réponse");
              // on ajoute l'envoi de la réponse sur le bouton et à la fermeture
              $(boutonReponse).click(sendReponse);
              $('body').on("unload", function () {
                sendReponse(null, true);
              });
              $(textarea).change(function () {
                isResultatSent = false;
              });
            } else if (options.preview) {
              dom.addElement(form, 'p', null, "Réponse attendue mais pas d'envoi possible en prévisualisation");
            } else {
              dom.addElement(form, 'p', { "class": "info", style: { margin: "1em;" } }, "Aucun enregistrement ne sera effectué (car aucune destination n'a été fournie pour l'envoyer, normal en visualisation seule)");
            }
            addPage(params, function () {
              urlUi(ressource, options, function () {
                $("#loading").empty();
                next();
              });
            });
          }
        });
      } // fin question-réponse
  } catch (error) {
    if (next) next(error);else page.addError(error);
  }
};
});

;require.register("plugins/url/displayUi", function(exports, require, module) {
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
"use strict";
/**
 * @file Module js pour gérer l'affichage / masquage de question / réponse / page
 * D'après l'ancien url.js de l'outil labomep
 */

var page = require('../../page');
var dom = require('../../tools/dom');
var log = require('../../tools/log');

var $ = window.jQuery; /*jshint jquery:true*/

/**
 * Retourne une seule fonction qui affectera les comportements de l'interface avec la gestion des étapes pour les ressources url
 * @service plugins/url/displayUi
 * @param {Ressource}      ressource
 * @param {displayOptions} options
 * @param {errorCallback}  next
 */
module.exports = function (ressource, options, next) {
  page.loadAsync(["jqueryUiDialog"], function () {
    // faut attendre que tout soit fini de charger et que jQuery ai fini de manipuler le dom
    $(function () {
      function getLienSuivant() {
        return dom.getElement("img", {
          "class": 'lienSuivant',
          src: options.pluginBase + 'images/forward.png',
          align: 'absmiddle',
          alt: 'suivant',
          onclick: etapes.next
        });
      }

      /**
       * Initialise les fenêtres modales
       */
      function init() {
        // les comportements qui dépendent pas du contexte
        $lienConsigne.click(consigne.toggle);
        $lienReponse.click(reponse.toggle);

        // les fenetres modales
        var informationDialogOptions = {
          title: 'Information',
          autoOpen: false,
          resizable: false,
          position: { my: 'left+10 top+10', at: 'left bottom', of: '#entete' },
          buttons: {
            "OK": function OK() {
              $information.dialog("close");
            }
          }
        };
        $information.dialog(informationDialogOptions);

        var consigneDialogOptions = {
          //position : [30, 50],
          // cf http://api.jqueryui.com/position/
          position: { my: 'left+30 top+50', at: 'left bottom', of: '#entete' },
          width: 450,
          height: 350,
          resizable: true,
          autoOpen: false,
          title: 'Consigne',
          close: function close() {
            $lienConsigne.css('font-weight', 'bold');
          },
          open: function open() {
            if (hasTexConsigne) {
              // @see https://groups.google.com/forum/#!topic/mathjax-users/v6nVeANKihs
              // http://docs.mathjax.org/en/latest/queues.html
              log("open consigne");
              /*global MathJax*/
              MathJax.Hub.Queue(["Typeset", MathJax.Hub, "consigne"]);
            }
            $lienConsigne.css('font-weight', 'normal');
          }
        };
        $consigne.dialog(consigneDialogOptions);

        var reponseDialogOptions = {
          width: hasCkeditor ? 580 : 480,
          height: hasCkeditor ? 400 : 320,
          //position : [$('body').width() - 30 - 472, 50],
          position: { my: 'right-30 top+70', at: 'right bottom', of: '#entete' },
          resizable: true,
          autoOpen: false,
          title: 'Ta réponse',
          ferme: function ferme() {
            $lienReponse.css('font-weight', 'bold');
          },
          ouvre: function ouvre() {
            $lienReponse.css('font-weight', 'normal');
          }
        };
        $reponse.dialog(reponseDialogOptions);
      } // init

      /**
       * Charge les éventuelles dépendances avant d'appeler next
       * @private
       * @param next
       */
      function loadDependencies(next) {
        var dependances = [];
        if (hasTexConsigne && typeof MathJax === "undefined") dependances.push("mathjax");
        if (dependances.length) page.loadAsync(dependances, next);else next();
      }

      /**
       * Construit la liste des étapes d'après les options
       * @private
       */
      function setEtapes() {
        /**
         * Option de l'affichage de la question qui peut prendre les valeurs
         *   "off"    : pas de question
         *   "before" : avant la page
         *   "while"  : pendant la page
         *   "after"  : après la page
         * @type {string}
         */
        var question_option = ressource.parametres.question_option || "off";
        /**
         * Option de l'affichage de la réponse qui peut prendre les valeurs
         *   "off"      : pas de réponse attendue
         *   "question" : pendant l'affichage de la question
         *   "while"    : pendant l'affichage de la page
         *   "after"    : après la page
         * @type {string}
         */
        var answer_option = ressource.parametres.answer_option || "off";
        log("lien suivant dans setEtapes", lienSuivant);

        if (question_option == "off") {
          etapes.liste = [[information, iframe]];
          // pas de question, pour la réponse :
          if (answer_option == "while") {
            etapes.titres = ["Visualisation du document et réponse"];
            information.setContent("Observe ce document et envoie ta réponse.");
            // ajout de la réponse à la 1re étape
            etapes.liste[0].push(reponse);
          } else if (answer_option == "after") {
            etapes.titres = ["Visualisation du document", "Réponse"];
            information.setContent("Observe ce document puis clique sur ", getLienSuivant(), " pour répondre.");
            // ajout de la réponse en 2e étape
            etapes.liste.push([reponse]);
          }
        } else if (question_option == "before") {
          // consigne puis page
          etapes.liste = [[consigne, information], [iframe]];
          if (answer_option == "off") {
            etapes.titres = ["Lecture de la consigne", "Visualisation du document"];
            information.setContent("Commence par lire la consigne, puis clique sur ", getLienSuivant(), " pour voir le document.");
          } else if (answer_option == "while") {
            etapes.titres = ["Lecture de la consigne", "Visualisation du document et réponse"];
            information.setContent("Lis la consigne, clique sur ", getLienSuivant(), " pour voir le document et répondre.");
            etapes.liste[1].push(reponse);
          } else if (answer_option == "after") {
            etapes.titres = ["Lecture de la consigne", "Visualisation du document", "Réponse"];
            information.setContent("Lis la consigne, clique sur ", getLienSuivant(), " pour voir le document, puis encore une fois pour répondre.");
            etapes.liste.push([reponse]);
          } else if (answer_option == "question") {
            etapes.titres = ["Lecture de la consigne et réponse", "Visualisation du document"];
            information.setContent("Réponds à la question, puis clique sur ", getLienSuivant(), " pour voir le document.");
            // réponse avant l'info
            etapes.liste = [[consigne, reponse, information], [iframe]];
          }
        } else if (question_option == "while") {
          etapes.liste = [[consigne, iframe]];
          if (answer_option == "after") {
            etapes.liste[0].push(information);
            information.setContent("Lis la consigne, observe bien le document puis clique sur ", getLienSuivant(), " pour pouvoir répondre.");
            etapes.liste.push([reponse]);
            etapes.titres = ["Réponse", "Visualisation de la consigne et du document"];
          } else if (answer_option == "while" || answer_option == "question") {
            $filariane.hide();
            etapes.liste[0].push(reponse);
            etapes.titres = ["Consigne, visualisation du document et réponse"];
          } else {
            $filariane.hide();
            etapes.titres = ["Consigne et visualisation du document"];
          }
        } else if (question_option == "after") {
          etapes.liste = [[page, information], [consigne]];
          if (answer_option == "off") {
            etapes.titres = ["Visualisation du document", "consigne"];
            information.setContent("Observe bien le document puis clique sur ", getLienSuivant(), " pour lire la consigne.");
          } else if (answer_option == "after") {
            etapes.titres = ["Visualisation du document", "Lecture de la consigne", "Réponse"];
            information.setContent("Observe bien le document puis clique sur ", getLienSuivant(), " pour lire la consigne et encore une fois pour répondre.");
            etapes.liste.push([reponse]);
          } else {
            information.setContent("Observe bien le document puis clique sur ", getLienSuivant(), " pour lire la consigne et répondre.");
            etapes.liste[1].push(reponse);
            etapes.titres = ["Visualisation du document", "Consigne et réponse"];
          }
        }
      } // setEtapes

      /**
       * Réactualise l'affichage avec l'étape etapes.currentIndex
       * @private
       */
      function showEtape() {
        log("showEtape");
        var i;
        // on ferme tout
        reponse.desactiver();
        consigne.desactiver();
        iframe.desactiver();

        // active les elts de l'etape en cours
        var etape = etapes.liste[etapes.currentIndex];
        for (i = 0; i < etape.length; i++) {
          //log("active " +i +' ' +etapes.titres[i], etape[i])
          etape[i].activer();
        }

        // reconstruction du fil d'ariane, titre des étapes passées
        // + titre actuel ≠ + suivant)
        $filariane.empty();
        var c = etapes.currentIndex;
        for (i = 0; i < c; i++) {
          $filariane.append("Étape " + (i + 1) + " : " + etapes.titres[i] + ' >> ');
        }
        // ajout titre courant
        $filariane.append("Étape " + (c + 1) + " : ").append(dom.getElement('span', { "class": 'highlight' }, etapes.titres[c]));
        // titre suivant éventuel
        if (etapes.hasNext()) {
          $filariane.append(getLienSuivant());
          //$(lienSuivant).click(etapes.next)
        }
      } // showEtape

      try {
        if (!ressource || !ressource.parametres || !ressource.parametres.adresse) throw new Error("ressource manquante ou incomplète");
        log('urlUi avec ', ressource.parametres, options);
        /**
         * Editeur à utiliser pour la réponse
         *   textarea : un textarea tout simple
         *   ckeditor : ckeditor en version standard
         *   ckeditorTex : ckeditor avec le plugin mathjax
         * @private
         * @type {string}
         */
        var answer_editor = ressource.parametres.answer_editor || "textarea";

        dom.addCss(options.base + "vendors/jqueryUi/1.11.4.dialogRedmond/jquery-ui.min.css");

        var etapes = {
          currentIndex: 0,
          // chaque elt est une etape : un tableau avec les objets à afficher (parmi consigne, reponse, information, iframe)
          liste: [],
          // les titres de chaque étape
          titres: [],
          hasNext: function hasNext() {
            return etapes.currentIndex < etapes.liste.length - 1;
          },
          next: function next() {
            if (etapes.hasNext()) {
              etapes.currentIndex++;
              showEtape();
            }
          }
        };

        /** Le html du lien suivant */
        var lienSuivant = dom.getElement("img", {
          "class": 'lienSuivant',
          src: options.pluginBaseUrl + 'images/forward.png',
          align: 'absmiddle',
          alt: 'suivant',
          onclick: etapes.next
        });

        /*
         * Nos 4 éléments qui peuvent entrer dans une étape : iframe, information, consigne, reponse
         */

        /* La page en iframe, ou div si swf */
        var iframe = {
          activer: function activer() {
            $page.show();
          },
          desactiver: function desactiver() {
            $page.hide();
          }
        };

        /* objet pour la fenêtre modale information */
        var information = {
          activer: function activer() {
            $information.dialog('open');
          },
          desactiver: function desactiver() {
            if ($information.dialog('isOpen')) $information.dialog('close');
          },
          setContent: function setContent(content) {
            $information.html(content);
            if (arguments.length > 1) {
              for (var i = 1; i < arguments.length; i++) {
                $information.append(arguments[i]);
              }
            }
          }
        };

        /* objet pour la fenêtre modale consigne */
        var consigne = {
          activer: function activer() {
            $consigne.dialog('open');
            $lienConsigne.show();
          },
          desactiver: function desactiver() {
            $consigne.dialog('close');
            $lienConsigne.hide();
          },
          toggle: function toggle() {
            if ($consigne.dialog('isOpen')) $consigne.dialog('close');else $consigne.dialog('open');
          }
        };

        /* objet pour la fenêtre modale réponde */
        var reponse = {
          activer: function activer() {
            $reponse.dialog('open');
            $lienReponse.show();
          },
          desactiver: function desactiver() {
            $reponse.dialog('close');
            $lienReponse.hide();
          },
          toggle: function toggle() {
            if ($reponse.dialog('isOpen')) $reponse.dialog('close');else $reponse.dialog('open');
          }
        };

        var $filariane = $('#filariane');
        var $consigne = $('#consigne');
        var $reponse = $('#reponse');
        var $information = $('#information');
        var $lienConsigne = $('#lienConsigne');
        var $lienReponse = $('#lienReponse');
        var $page = $('#divPage');

        // ce truc renvoie toujours 0 !!! (il ne compte que le visible ?)
        //var hasTexConsigne = ($consigne.filter(".math-tex").length > 0)
        var hasTexConsigne = $consigne.find(".math-tex").length > 0;
        //var hasTexConsigne = $consigne.html().indexOf('class="math-tex"')
        var hasCkeditor = answer_editor !== "textarea";

        loadDependencies(function () {
          init();
          setEtapes();
          log("les etapes", etapes);
          showEtape();
          next();
        });
      } catch (error) {
        if (next) next(error);else page.addError(error);
      }
    }); // $(code)
  }); // loadAsync
};
});

;require.register("Resultat", function(exports, require, module) {
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
});

;
//# sourceMappingURL=display.bundle.js.map/*! head.load - v1.0.3 */
(function(n,t){"use strict";function w(){}function u(n,t){if(n){typeof n=="object"&&(n=[].slice.call(n));for(var i=0,r=n.length;i<r;i++)t.call(n,n[i],i)}}function it(n,i){var r=Object.prototype.toString.call(i).slice(8,-1);return i!==t&&i!==null&&r===n}function s(n){return it("Function",n)}function a(n){return it("Array",n)}function et(n){var i=n.split("/"),t=i[i.length-1],r=t.indexOf("?");return r!==-1?t.substring(0,r):t}function f(n){(n=n||w,n._done)||(n(),n._done=1)}function ot(n,t,r,u){var f=typeof n=="object"?n:{test:n,success:!t?!1:a(t)?t:[t],failure:!r?!1:a(r)?r:[r],callback:u||w},e=!!f.test;return e&&!!f.success?(f.success.push(f.callback),i.load.apply(null,f.success)):e||!f.failure?u():(f.failure.push(f.callback),i.load.apply(null,f.failure)),i}function v(n){var t={},i,r;if(typeof n=="object")for(i in n)!n[i]||(t={name:i,url:n[i]});else t={name:et(n),url:n};return(r=c[t.name],r&&r.url===t.url)?r:(c[t.name]=t,t)}function y(n){n=n||c;for(var t in n)if(n.hasOwnProperty(t)&&n[t].state!==l)return!1;return!0}function st(n){n.state=ft;u(n.onpreload,function(n){n.call()})}function ht(n){n.state===t&&(n.state=nt,n.onpreload=[],rt({url:n.url,type:"cache"},function(){st(n)}))}function ct(){var n=arguments,t=n[n.length-1],r=[].slice.call(n,1),f=r[0];return(s(t)||(t=null),a(n[0]))?(n[0].push(t),i.load.apply(null,n[0]),i):(f?(u(r,function(n){s(n)||!n||ht(v(n))}),b(v(n[0]),s(f)?f:function(){i.load.apply(null,r)})):b(v(n[0])),i)}function lt(){var n=arguments,t=n[n.length-1],r={};return(s(t)||(t=null),a(n[0]))?(n[0].push(t),i.load.apply(null,n[0]),i):(u(n,function(n){n!==t&&(n=v(n),r[n.name]=n)}),u(n,function(n){n!==t&&(n=v(n),b(n,function(){y(r)&&f(t)}))}),i)}function b(n,t){if(t=t||w,n.state===l){t();return}if(n.state===tt){i.ready(n.name,t);return}if(n.state===nt){n.onpreload.push(function(){b(n,t)});return}n.state=tt;rt(n,function(){n.state=l;t();u(h[n.name],function(n){f(n)});o&&y()&&u(h.ALL,function(n){f(n)})})}function at(n){n=n||"";var t=n.split("?")[0].split(".");return t[t.length-1].toLowerCase()}function rt(t,i){function e(t){t=t||n.event;u.onload=u.onreadystatechange=u.onerror=null;i()}function o(f){f=f||n.event;(f.type==="load"||/loaded|complete/.test(u.readyState)&&(!r.documentMode||r.documentMode<9))&&(n.clearTimeout(t.errorTimeout),n.clearTimeout(t.cssTimeout),u.onload=u.onreadystatechange=u.onerror=null,i())}function s(){if(t.state!==l&&t.cssRetries<=20){for(var i=0,f=r.styleSheets.length;i<f;i++)if(r.styleSheets[i].href===u.href){o({type:"load"});return}t.cssRetries++;t.cssTimeout=n.setTimeout(s,250)}}var u,h,f;i=i||w;h=at(t.url);h==="css"?(u=r.createElement("link"),u.type="text/"+(t.type||"css"),u.rel="stylesheet",u.href=t.url,t.cssRetries=0,t.cssTimeout=n.setTimeout(s,500)):(u=r.createElement("script"),u.type="text/"+(t.type||"javascript"),u.src=t.url);u.onload=u.onreadystatechange=o;u.onerror=e;u.async=!1;u.defer=!1;t.errorTimeout=n.setTimeout(function(){e({type:"timeout"})},7e3);f=r.head||r.getElementsByTagName("head")[0];f.insertBefore(u,f.lastChild)}function vt(){for(var t,u=r.getElementsByTagName("script"),n=0,f=u.length;n<f;n++)if(t=u[n].getAttribute("data-headjs-load"),!!t){i.load(t);return}}function yt(n,t){var v,p,e;return n===r?(o?f(t):d.push(t),i):(s(n)&&(t=n,n="ALL"),a(n))?(v={},u(n,function(n){v[n]=c[n];i.ready(n,function(){y(v)&&f(t)})}),i):typeof n!="string"||!s(t)?i:(p=c[n],p&&p.state===l||n==="ALL"&&y()&&o)?(f(t),i):(e=h[n],e?e.push(t):e=h[n]=[t],i)}function e(){if(!r.body){n.clearTimeout(i.readyTimeout);i.readyTimeout=n.setTimeout(e,50);return}o||(o=!0,vt(),u(d,function(n){f(n)}))}function k(){r.addEventListener?(r.removeEventListener("DOMContentLoaded",k,!1),e()):r.readyState==="complete"&&(r.detachEvent("onreadystatechange",k),e())}var r=n.document,d=[],h={},c={},ut="async"in r.createElement("script")||"MozAppearance"in r.documentElement.style||n.opera,o,g=n.head_conf&&n.head_conf.head||"head",i=n[g]=n[g]||function(){i.ready.apply(null,arguments)},nt=1,ft=2,tt=3,l=4,p;if(r.readyState==="complete")e();else if(r.addEventListener)r.addEventListener("DOMContentLoaded",k,!1),n.addEventListener("load",e,!1);else{r.attachEvent("onreadystatechange",k);n.attachEvent("onload",e);p=!1;try{p=!n.frameElement&&r.documentElement}catch(wt){}p&&p.doScroll&&function pt(){if(!o){try{p.doScroll("left")}catch(t){n.clearTimeout(i.readyTimeout);i.readyTimeout=n.setTimeout(pt,50);return}e()}}()}i.load=i.js=ut?lt:ct;i.test=ot;i.ready=yt;i.ready(r,function(){y()&&u(h.ALL,function(n){f(n)});i.feature&&i.feature("domloaded",!0)})})(window);
/*
//# sourceMappingURL=head.load.min.js.map
*//*! jQuery v2.2.0 | (c) jQuery Foundation | jquery.org/license */
!function(a,b){"object"==typeof module&&"object"==typeof module.exports?module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)}:b(a)}("undefined"!=typeof window?window:this,function(a,b){var c=[],d=a.document,e=c.slice,f=c.concat,g=c.push,h=c.indexOf,i={},j=i.toString,k=i.hasOwnProperty,l={},m="2.2.0",n=function(a,b){return new n.fn.init(a,b)},o=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,p=/^-ms-/,q=/-([\da-z])/gi,r=function(a,b){return b.toUpperCase()};n.fn=n.prototype={jquery:m,constructor:n,selector:"",length:0,toArray:function(){return e.call(this)},get:function(a){return null!=a?0>a?this[a+this.length]:this[a]:e.call(this)},pushStack:function(a){var b=n.merge(this.constructor(),a);return b.prevObject=this,b.context=this.context,b},each:function(a){return n.each(this,a)},map:function(a){return this.pushStack(n.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(e.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(0>a?b:0);return this.pushStack(c>=0&&b>c?[this[c]]:[])},end:function(){return this.prevObject||this.constructor()},push:g,sort:c.sort,splice:c.splice},n.extend=n.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||n.isFunction(g)||(g={}),h===i&&(g=this,h--);i>h;h++)if(null!=(a=arguments[h]))for(b in a)c=g[b],d=a[b],g!==d&&(j&&d&&(n.isPlainObject(d)||(e=n.isArray(d)))?(e?(e=!1,f=c&&n.isArray(c)?c:[]):f=c&&n.isPlainObject(c)?c:{},g[b]=n.extend(j,f,d)):void 0!==d&&(g[b]=d));return g},n.extend({expando:"jQuery"+(m+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return"function"===n.type(a)},isArray:Array.isArray,isWindow:function(a){return null!=a&&a===a.window},isNumeric:function(a){var b=a&&a.toString();return!n.isArray(a)&&b-parseFloat(b)+1>=0},isPlainObject:function(a){return"object"!==n.type(a)||a.nodeType||n.isWindow(a)?!1:a.constructor&&!k.call(a.constructor.prototype,"isPrototypeOf")?!1:!0},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?i[j.call(a)]||"object":typeof a},globalEval:function(a){var b,c=eval;a=n.trim(a),a&&(1===a.indexOf("use strict")?(b=d.createElement("script"),b.text=a,d.head.appendChild(b).parentNode.removeChild(b)):c(a))},camelCase:function(a){return a.replace(p,"ms-").replace(q,r)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b){var c,d=0;if(s(a)){for(c=a.length;c>d;d++)if(b.call(a[d],d,a[d])===!1)break}else for(d in a)if(b.call(a[d],d,a[d])===!1)break;return a},trim:function(a){return null==a?"":(a+"").replace(o,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(s(Object(a))?n.merge(c,"string"==typeof a?[a]:a):g.call(c,a)),c},inArray:function(a,b,c){return null==b?-1:h.call(b,a,c)},merge:function(a,b){for(var c=+b.length,d=0,e=a.length;c>d;d++)a[e++]=b[d];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;g>f;f++)d=!b(a[f],f),d!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,e,g=0,h=[];if(s(a))for(d=a.length;d>g;g++)e=b(a[g],g,c),null!=e&&h.push(e);else for(g in a)e=b(a[g],g,c),null!=e&&h.push(e);return f.apply([],h)},guid:1,proxy:function(a,b){var c,d,f;return"string"==typeof b&&(c=a[b],b=a,a=c),n.isFunction(a)?(d=e.call(arguments,2),f=function(){return a.apply(b||this,d.concat(e.call(arguments)))},f.guid=a.guid=a.guid||n.guid++,f):void 0},now:Date.now,support:l}),"function"==typeof Symbol&&(n.fn[Symbol.iterator]=c[Symbol.iterator]),n.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),function(a,b){i["[object "+b+"]"]=b.toLowerCase()});function s(a){var b=!!a&&"length"in a&&a.length,c=n.type(a);return"function"===c||n.isWindow(a)?!1:"array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a}var t=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u="sizzle"+1*new Date,v=a.document,w=0,x=0,y=ga(),z=ga(),A=ga(),B=function(a,b){return a===b&&(l=!0),0},C=1<<31,D={}.hasOwnProperty,E=[],F=E.pop,G=E.push,H=E.push,I=E.slice,J=function(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1},K="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",L="[\\x20\\t\\r\\n\\f]",M="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",N="\\["+L+"*("+M+")(?:"+L+"*([*^$|!~]?=)"+L+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+M+"))|)"+L+"*\\]",O=":("+M+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+N+")*)|.*)\\)|)",P=new RegExp(L+"+","g"),Q=new RegExp("^"+L+"+|((?:^|[^\\\\])(?:\\\\.)*)"+L+"+$","g"),R=new RegExp("^"+L+"*,"+L+"*"),S=new RegExp("^"+L+"*([>+~]|"+L+")"+L+"*"),T=new RegExp("="+L+"*([^\\]'\"]*?)"+L+"*\\]","g"),U=new RegExp(O),V=new RegExp("^"+M+"$"),W={ID:new RegExp("^#("+M+")"),CLASS:new RegExp("^\\.("+M+")"),TAG:new RegExp("^("+M+"|[*])"),ATTR:new RegExp("^"+N),PSEUDO:new RegExp("^"+O),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+L+"*(even|odd|(([+-]|)(\\d*)n|)"+L+"*(?:([+-]|)"+L+"*(\\d+)|))"+L+"*\\)|)","i"),bool:new RegExp("^(?:"+K+")$","i"),needsContext:new RegExp("^"+L+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+L+"*((?:-\\d)?\\d*)"+L+"*\\)|)(?=[^-]|$)","i")},X=/^(?:input|select|textarea|button)$/i,Y=/^h\d$/i,Z=/^[^{]+\{\s*\[native \w/,$=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,_=/[+~]/,aa=/'|\\/g,ba=new RegExp("\\\\([\\da-f]{1,6}"+L+"?|("+L+")|.)","ig"),ca=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:0>d?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)},da=function(){m()};try{H.apply(E=I.call(v.childNodes),v.childNodes),E[v.childNodes.length].nodeType}catch(ea){H={apply:E.length?function(a,b){G.apply(a,I.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function fa(a,b,d,e){var f,h,j,k,l,o,r,s,w=b&&b.ownerDocument,x=b?b.nodeType:9;if(d=d||[],"string"!=typeof a||!a||1!==x&&9!==x&&11!==x)return d;if(!e&&((b?b.ownerDocument||b:v)!==n&&m(b),b=b||n,p)){if(11!==x&&(o=$.exec(a)))if(f=o[1]){if(9===x){if(!(j=b.getElementById(f)))return d;if(j.id===f)return d.push(j),d}else if(w&&(j=w.getElementById(f))&&t(b,j)&&j.id===f)return d.push(j),d}else{if(o[2])return H.apply(d,b.getElementsByTagName(a)),d;if((f=o[3])&&c.getElementsByClassName&&b.getElementsByClassName)return H.apply(d,b.getElementsByClassName(f)),d}if(c.qsa&&!A[a+" "]&&(!q||!q.test(a))){if(1!==x)w=b,s=a;else if("object"!==b.nodeName.toLowerCase()){(k=b.getAttribute("id"))?k=k.replace(aa,"\\$&"):b.setAttribute("id",k=u),r=g(a),h=r.length,l=V.test(k)?"#"+k:"[id='"+k+"']";while(h--)r[h]=l+" "+qa(r[h]);s=r.join(","),w=_.test(a)&&oa(b.parentNode)||b}if(s)try{return H.apply(d,w.querySelectorAll(s)),d}catch(y){}finally{k===u&&b.removeAttribute("id")}}}return i(a.replace(Q,"$1"),b,d,e)}function ga(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function ha(a){return a[u]=!0,a}function ia(a){var b=n.createElement("div");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function ja(a,b){var c=a.split("|"),e=c.length;while(e--)d.attrHandle[c[e]]=b}function ka(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&(~b.sourceIndex||C)-(~a.sourceIndex||C);if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function la(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function ma(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function na(a){return ha(function(b){return b=+b,ha(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function oa(a){return a&&"undefined"!=typeof a.getElementsByTagName&&a}c=fa.support={},f=fa.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?"HTML"!==b.nodeName:!1},m=fa.setDocument=function(a){var b,e,g=a?a.ownerDocument||a:v;return g!==n&&9===g.nodeType&&g.documentElement?(n=g,o=n.documentElement,p=!f(n),(e=n.defaultView)&&e.top!==e&&(e.addEventListener?e.addEventListener("unload",da,!1):e.attachEvent&&e.attachEvent("onunload",da)),c.attributes=ia(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=ia(function(a){return a.appendChild(n.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=Z.test(n.getElementsByClassName),c.getById=ia(function(a){return o.appendChild(a).id=u,!n.getElementsByName||!n.getElementsByName(u).length}),c.getById?(d.find.ID=function(a,b){if("undefined"!=typeof b.getElementById&&p){var c=b.getElementById(a);return c?[c]:[]}},d.filter.ID=function(a){var b=a.replace(ba,ca);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(ba,ca);return function(a){var c="undefined"!=typeof a.getAttributeNode&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return"undefined"!=typeof b.getElementsByTagName?b.getElementsByTagName(a):c.qsa?b.querySelectorAll(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){return"undefined"!=typeof b.getElementsByClassName&&p?b.getElementsByClassName(a):void 0},r=[],q=[],(c.qsa=Z.test(n.querySelectorAll))&&(ia(function(a){o.appendChild(a).innerHTML="<a id='"+u+"'></a><select id='"+u+"-\r\\' msallowcapture=''><option selected=''></option></select>",a.querySelectorAll("[msallowcapture^='']").length&&q.push("[*^$]="+L+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||q.push("\\["+L+"*(?:value|"+K+")"),a.querySelectorAll("[id~="+u+"-]").length||q.push("~="),a.querySelectorAll(":checked").length||q.push(":checked"),a.querySelectorAll("a#"+u+"+*").length||q.push(".#.+[+~]")}),ia(function(a){var b=n.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&q.push("name"+L+"*[*^$|!~]?="),a.querySelectorAll(":enabled").length||q.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),q.push(",.*:")})),(c.matchesSelector=Z.test(s=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.oMatchesSelector||o.msMatchesSelector))&&ia(function(a){c.disconnectedMatch=s.call(a,"div"),s.call(a,"[s!='']:x"),r.push("!=",O)}),q=q.length&&new RegExp(q.join("|")),r=r.length&&new RegExp(r.join("|")),b=Z.test(o.compareDocumentPosition),t=b||Z.test(o.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},B=b?function(a,b){if(a===b)return l=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===n||a.ownerDocument===v&&t(v,a)?-1:b===n||b.ownerDocument===v&&t(v,b)?1:k?J(k,a)-J(k,b):0:4&d?-1:1)}:function(a,b){if(a===b)return l=!0,0;var c,d=0,e=a.parentNode,f=b.parentNode,g=[a],h=[b];if(!e||!f)return a===n?-1:b===n?1:e?-1:f?1:k?J(k,a)-J(k,b):0;if(e===f)return ka(a,b);c=a;while(c=c.parentNode)g.unshift(c);c=b;while(c=c.parentNode)h.unshift(c);while(g[d]===h[d])d++;return d?ka(g[d],h[d]):g[d]===v?-1:h[d]===v?1:0},n):n},fa.matches=function(a,b){return fa(a,null,null,b)},fa.matchesSelector=function(a,b){if((a.ownerDocument||a)!==n&&m(a),b=b.replace(T,"='$1']"),c.matchesSelector&&p&&!A[b+" "]&&(!r||!r.test(b))&&(!q||!q.test(b)))try{var d=s.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return fa(b,n,null,[a]).length>0},fa.contains=function(a,b){return(a.ownerDocument||a)!==n&&m(a),t(a,b)},fa.attr=function(a,b){(a.ownerDocument||a)!==n&&m(a);var e=d.attrHandle[b.toLowerCase()],f=e&&D.call(d.attrHandle,b.toLowerCase())?e(a,b,!p):void 0;return void 0!==f?f:c.attributes||!p?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},fa.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},fa.uniqueSort=function(a){var b,d=[],e=0,f=0;if(l=!c.detectDuplicates,k=!c.sortStable&&a.slice(0),a.sort(B),l){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return k=null,a},e=fa.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=fa.selectors={cacheLength:50,createPseudo:ha,match:W,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(ba,ca),a[3]=(a[3]||a[4]||a[5]||"").replace(ba,ca),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||fa.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&fa.error(a[0]),a},PSEUDO:function(a){var b,c=!a[6]&&a[2];return W.CHILD.test(a[0])?null:(a[3]?a[2]=a[4]||a[5]||"":c&&U.test(c)&&(b=g(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(ba,ca).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=y[a+" "];return b||(b=new RegExp("(^|"+L+")"+a+"("+L+"|$)"))&&y(a,function(a){return b.test("string"==typeof a.className&&a.className||"undefined"!=typeof a.getAttribute&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=fa.attr(d,a);return null==e?"!="===b:b?(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e.replace(P," ")+" ").indexOf(c)>-1:"|="===b?e===c||e.slice(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h,t=!1;if(q){if(f){while(p){m=b;while(m=m[p])if(h?m.nodeName.toLowerCase()===r:1===m.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){m=q,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n&&j[2],m=n&&q.childNodes[n];while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if(1===m.nodeType&&++t&&m===b){k[a]=[w,n,t];break}}else if(s&&(m=b,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n),t===!1)while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if((h?m.nodeName.toLowerCase()===r:1===m.nodeType)&&++t&&(s&&(l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),k[a]=[w,t]),m===b))break;return t-=e,t===d||t%d===0&&t/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||fa.error("unsupported pseudo: "+a);return e[u]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?ha(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=J(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:ha(function(a){var b=[],c=[],d=h(a.replace(Q,"$1"));return d[u]?ha(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),b[0]=null,!c.pop()}}),has:ha(function(a){return function(b){return fa(a,b).length>0}}),contains:ha(function(a){return a=a.replace(ba,ca),function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:ha(function(a){return V.test(a||"")||fa.error("unsupported lang: "+a),a=a.replace(ba,ca).toLowerCase(),function(b){var c;do if(c=p?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===o},focus:function(a){return a===n.activeElement&&(!n.hasFocus||n.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return Y.test(a.nodeName)},input:function(a){return X.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:na(function(){return[0]}),last:na(function(a,b){return[b-1]}),eq:na(function(a,b,c){return[0>c?c+b:c]}),even:na(function(a,b){for(var c=0;b>c;c+=2)a.push(c);return a}),odd:na(function(a,b){for(var c=1;b>c;c+=2)a.push(c);return a}),lt:na(function(a,b,c){for(var d=0>c?c+b:c;--d>=0;)a.push(d);return a}),gt:na(function(a,b,c){for(var d=0>c?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=la(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=ma(b);function pa(){}pa.prototype=d.filters=d.pseudos,d.setFilters=new pa,g=fa.tokenize=function(a,b){var c,e,f,g,h,i,j,k=z[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){(!c||(e=R.exec(h)))&&(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=S.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(Q," ")}),h=h.slice(c.length));for(g in d.filter)!(e=W[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?fa.error(a):z(a,i).slice(0)};function qa(a){for(var b=0,c=a.length,d="";c>b;b++)d+=a[b].value;return d}function ra(a,b,c){var d=b.dir,e=c&&"parentNode"===d,f=x++;return b.first?function(b,c,f){while(b=b[d])if(1===b.nodeType||e)return a(b,c,f)}:function(b,c,g){var h,i,j,k=[w,f];if(g){while(b=b[d])if((1===b.nodeType||e)&&a(b,c,g))return!0}else while(b=b[d])if(1===b.nodeType||e){if(j=b[u]||(b[u]={}),i=j[b.uniqueID]||(j[b.uniqueID]={}),(h=i[d])&&h[0]===w&&h[1]===f)return k[2]=h[2];if(i[d]=k,k[2]=a(b,c,g))return!0}}}function sa(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function ta(a,b,c){for(var d=0,e=b.length;e>d;d++)fa(a,b[d],c);return c}function ua(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;i>h;h++)(f=a[h])&&(!c||c(f,d,e))&&(g.push(f),j&&b.push(h));return g}function va(a,b,c,d,e,f){return d&&!d[u]&&(d=va(d)),e&&!e[u]&&(e=va(e,f)),ha(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||ta(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:ua(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=ua(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?J(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=ua(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):H.apply(g,r)})}function wa(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],h=g||d.relative[" "],i=g?1:0,k=ra(function(a){return a===b},h,!0),l=ra(function(a){return J(b,a)>-1},h,!0),m=[function(a,c,d){var e=!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d));return b=null,e}];f>i;i++)if(c=d.relative[a[i].type])m=[ra(sa(m),c)];else{if(c=d.filter[a[i].type].apply(null,a[i].matches),c[u]){for(e=++i;f>e;e++)if(d.relative[a[e].type])break;return va(i>1&&sa(m),i>1&&qa(a.slice(0,i-1).concat({value:" "===a[i-2].type?"*":""})).replace(Q,"$1"),c,e>i&&wa(a.slice(i,e)),f>e&&wa(a=a.slice(e)),f>e&&qa(a))}m.push(c)}return sa(m)}function xa(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,h,i,k){var l,o,q,r=0,s="0",t=f&&[],u=[],v=j,x=f||e&&d.find.TAG("*",k),y=w+=null==v?1:Math.random()||.1,z=x.length;for(k&&(j=g===n||g||k);s!==z&&null!=(l=x[s]);s++){if(e&&l){o=0,g||l.ownerDocument===n||(m(l),h=!p);while(q=a[o++])if(q(l,g||n,h)){i.push(l);break}k&&(w=y)}c&&((l=!q&&l)&&r--,f&&t.push(l))}if(r+=s,c&&s!==r){o=0;while(q=b[o++])q(t,u,g,h);if(f){if(r>0)while(s--)t[s]||u[s]||(u[s]=F.call(i));u=ua(u)}H.apply(i,u),k&&!f&&u.length>0&&r+b.length>1&&fa.uniqueSort(i)}return k&&(w=y,j=v),t};return c?ha(f):f}return h=fa.compile=function(a,b){var c,d=[],e=[],f=A[a+" "];if(!f){b||(b=g(a)),c=b.length;while(c--)f=wa(b[c]),f[u]?d.push(f):e.push(f);f=A(a,xa(e,d)),f.selector=a}return f},i=fa.select=function(a,b,e,f){var i,j,k,l,m,n="function"==typeof a&&a,o=!f&&g(a=n.selector||a);if(e=e||[],1===o.length){if(j=o[0]=o[0].slice(0),j.length>2&&"ID"===(k=j[0]).type&&c.getById&&9===b.nodeType&&p&&d.relative[j[1].type]){if(b=(d.find.ID(k.matches[0].replace(ba,ca),b)||[])[0],!b)return e;n&&(b=b.parentNode),a=a.slice(j.shift().value.length)}i=W.needsContext.test(a)?0:j.length;while(i--){if(k=j[i],d.relative[l=k.type])break;if((m=d.find[l])&&(f=m(k.matches[0].replace(ba,ca),_.test(j[0].type)&&oa(b.parentNode)||b))){if(j.splice(i,1),a=f.length&&qa(j),!a)return H.apply(e,f),e;break}}}return(n||h(a,o))(f,b,!p,e,!b||_.test(a)&&oa(b.parentNode)||b),e},c.sortStable=u.split("").sort(B).join("")===u,c.detectDuplicates=!!l,m(),c.sortDetached=ia(function(a){return 1&a.compareDocumentPosition(n.createElement("div"))}),ia(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||ja("type|href|height|width",function(a,b,c){return c?void 0:a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&ia(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||ja("value",function(a,b,c){return c||"input"!==a.nodeName.toLowerCase()?void 0:a.defaultValue}),ia(function(a){return null==a.getAttribute("disabled")})||ja(K,function(a,b,c){var d;return c?void 0:a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),fa}(a);n.find=t,n.expr=t.selectors,n.expr[":"]=n.expr.pseudos,n.uniqueSort=n.unique=t.uniqueSort,n.text=t.getText,n.isXMLDoc=t.isXML,n.contains=t.contains;var u=function(a,b,c){var d=[],e=void 0!==c;while((a=a[b])&&9!==a.nodeType)if(1===a.nodeType){if(e&&n(a).is(c))break;d.push(a)}return d},v=function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c},w=n.expr.match.needsContext,x=/^<([\w-]+)\s*\/?>(?:<\/\1>|)$/,y=/^.[^:#\[\.,]*$/;function z(a,b,c){if(n.isFunction(b))return n.grep(a,function(a,d){return!!b.call(a,d,a)!==c});if(b.nodeType)return n.grep(a,function(a){return a===b!==c});if("string"==typeof b){if(y.test(b))return n.filter(b,a,c);b=n.filter(b,a)}return n.grep(a,function(a){return h.call(b,a)>-1!==c})}n.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?n.find.matchesSelector(d,a)?[d]:[]:n.find.matches(a,n.grep(b,function(a){return 1===a.nodeType}))},n.fn.extend({find:function(a){var b,c=this.length,d=[],e=this;if("string"!=typeof a)return this.pushStack(n(a).filter(function(){for(b=0;c>b;b++)if(n.contains(e[b],this))return!0}));for(b=0;c>b;b++)n.find(a,e[b],d);return d=this.pushStack(c>1?n.unique(d):d),d.selector=this.selector?this.selector+" "+a:a,d},filter:function(a){return this.pushStack(z(this,a||[],!1))},not:function(a){return this.pushStack(z(this,a||[],!0))},is:function(a){return!!z(this,"string"==typeof a&&w.test(a)?n(a):a||[],!1).length}});var A,B=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,C=n.fn.init=function(a,b,c){var e,f;if(!a)return this;if(c=c||A,"string"==typeof a){if(e="<"===a[0]&&">"===a[a.length-1]&&a.length>=3?[null,a,null]:B.exec(a),!e||!e[1]&&b)return!b||b.jquery?(b||c).find(a):this.constructor(b).find(a);if(e[1]){if(b=b instanceof n?b[0]:b,n.merge(this,n.parseHTML(e[1],b&&b.nodeType?b.ownerDocument||b:d,!0)),x.test(e[1])&&n.isPlainObject(b))for(e in b)n.isFunction(this[e])?this[e](b[e]):this.attr(e,b[e]);return this}return f=d.getElementById(e[2]),f&&f.parentNode&&(this.length=1,this[0]=f),this.context=d,this.selector=a,this}return a.nodeType?(this.context=this[0]=a,this.length=1,this):n.isFunction(a)?void 0!==c.ready?c.ready(a):a(n):(void 0!==a.selector&&(this.selector=a.selector,this.context=a.context),n.makeArray(a,this))};C.prototype=n.fn,A=n(d);var D=/^(?:parents|prev(?:Until|All))/,E={children:!0,contents:!0,next:!0,prev:!0};n.fn.extend({has:function(a){var b=n(a,this),c=b.length;return this.filter(function(){for(var a=0;c>a;a++)if(n.contains(this,b[a]))return!0})},closest:function(a,b){for(var c,d=0,e=this.length,f=[],g=w.test(a)||"string"!=typeof a?n(a,b||this.context):0;e>d;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&n.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?n.uniqueSort(f):f)},index:function(a){return a?"string"==typeof a?h.call(n(a),this[0]):h.call(this,a.jquery?a[0]:a):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(n.uniqueSort(n.merge(this.get(),n(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function F(a,b){while((a=a[b])&&1!==a.nodeType);return a}n.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return u(a,"parentNode")},parentsUntil:function(a,b,c){return u(a,"parentNode",c)},next:function(a){return F(a,"nextSibling")},prev:function(a){return F(a,"previousSibling")},nextAll:function(a){return u(a,"nextSibling")},prevAll:function(a){return u(a,"previousSibling")},nextUntil:function(a,b,c){return u(a,"nextSibling",c)},prevUntil:function(a,b,c){return u(a,"previousSibling",c)},siblings:function(a){return v((a.parentNode||{}).firstChild,a)},children:function(a){return v(a.firstChild)},contents:function(a){return a.contentDocument||n.merge([],a.childNodes)}},function(a,b){n.fn[a]=function(c,d){var e=n.map(this,b,c);return"Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=n.filter(d,e)),this.length>1&&(E[a]||n.uniqueSort(e),D.test(a)&&e.reverse()),this.pushStack(e)}});var G=/\S+/g;function H(a){var b={};return n.each(a.match(G)||[],function(a,c){b[c]=!0}),b}n.Callbacks=function(a){a="string"==typeof a?H(a):n.extend({},a);var b,c,d,e,f=[],g=[],h=-1,i=function(){for(e=a.once,d=b=!0;g.length;h=-1){c=g.shift();while(++h<f.length)f[h].apply(c[0],c[1])===!1&&a.stopOnFalse&&(h=f.length,c=!1)}a.memory||(c=!1),b=!1,e&&(f=c?[]:"")},j={add:function(){return f&&(c&&!b&&(h=f.length-1,g.push(c)),function d(b){n.each(b,function(b,c){n.isFunction(c)?a.unique&&j.has(c)||f.push(c):c&&c.length&&"string"!==n.type(c)&&d(c)})}(arguments),c&&!b&&i()),this},remove:function(){return n.each(arguments,function(a,b){var c;while((c=n.inArray(b,f,c))>-1)f.splice(c,1),h>=c&&h--}),this},has:function(a){return a?n.inArray(a,f)>-1:f.length>0},empty:function(){return f&&(f=[]),this},disable:function(){return e=g=[],f=c="",this},disabled:function(){return!f},lock:function(){return e=g=[],c||(f=c=""),this},locked:function(){return!!e},fireWith:function(a,c){return e||(c=c||[],c=[a,c.slice?c.slice():c],g.push(c),b||i()),this},fire:function(){return j.fireWith(this,arguments),this},fired:function(){return!!d}};return j},n.extend({Deferred:function(a){var b=[["resolve","done",n.Callbacks("once memory"),"resolved"],["reject","fail",n.Callbacks("once memory"),"rejected"],["notify","progress",n.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return n.Deferred(function(c){n.each(b,function(b,f){var g=n.isFunction(a[b])&&a[b];e[f[1]](function(){var a=g&&g.apply(this,arguments);a&&n.isFunction(a.promise)?a.promise().progress(c.notify).done(c.resolve).fail(c.reject):c[f[0]+"With"](this===d?c.promise():this,g?[a]:arguments)})}),a=null}).promise()},promise:function(a){return null!=a?n.extend(a,d):d}},e={};return d.pipe=d.then,n.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h},b[1^a][2].disable,b[2][2].lock),e[f[0]]=function(){return e[f[0]+"With"](this===e?d:this,arguments),this},e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e},when:function(a){var b=0,c=e.call(arguments),d=c.length,f=1!==d||a&&n.isFunction(a.promise)?d:0,g=1===f?a:n.Deferred(),h=function(a,b,c){return function(d){b[a]=this,c[a]=arguments.length>1?e.call(arguments):d,c===i?g.notifyWith(b,c):--f||g.resolveWith(b,c)}},i,j,k;if(d>1)for(i=new Array(d),j=new Array(d),k=new Array(d);d>b;b++)c[b]&&n.isFunction(c[b].promise)?c[b].promise().progress(h(b,j,i)).done(h(b,k,c)).fail(g.reject):--f;return f||g.resolveWith(k,c),g.promise()}});var I;n.fn.ready=function(a){return n.ready.promise().done(a),this},n.extend({isReady:!1,readyWait:1,holdReady:function(a){a?n.readyWait++:n.ready(!0)},ready:function(a){(a===!0?--n.readyWait:n.isReady)||(n.isReady=!0,a!==!0&&--n.readyWait>0||(I.resolveWith(d,[n]),n.fn.triggerHandler&&(n(d).triggerHandler("ready"),n(d).off("ready"))))}});function J(){d.removeEventListener("DOMContentLoaded",J),a.removeEventListener("load",J),n.ready()}n.ready.promise=function(b){return I||(I=n.Deferred(),"complete"===d.readyState||"loading"!==d.readyState&&!d.documentElement.doScroll?a.setTimeout(n.ready):(d.addEventListener("DOMContentLoaded",J),a.addEventListener("load",J))),I.promise(b)},n.ready.promise();var K=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===n.type(c)){e=!0;for(h in c)K(a,b,h,c[h],!0,f,g)}else if(void 0!==d&&(e=!0,n.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(n(a),c)})),b))for(;i>h;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f},L=function(a){return 1===a.nodeType||9===a.nodeType||!+a.nodeType};function M(){this.expando=n.expando+M.uid++}M.uid=1,M.prototype={register:function(a,b){var c=b||{};return a.nodeType?a[this.expando]=c:Object.defineProperty(a,this.expando,{value:c,writable:!0,configurable:!0}),a[this.expando]},cache:function(a){if(!L(a))return{};var b=a[this.expando];return b||(b={},L(a)&&(a.nodeType?a[this.expando]=b:Object.defineProperty(a,this.expando,{value:b,configurable:!0}))),b},set:function(a,b,c){var d,e=this.cache(a);if("string"==typeof b)e[b]=c;else for(d in b)e[d]=b[d];return e},get:function(a,b){return void 0===b?this.cache(a):a[this.expando]&&a[this.expando][b]},access:function(a,b,c){var d;return void 0===b||b&&"string"==typeof b&&void 0===c?(d=this.get(a,b),void 0!==d?d:this.get(a,n.camelCase(b))):(this.set(a,b,c),void 0!==c?c:b)},remove:function(a,b){var c,d,e,f=a[this.expando];if(void 0!==f){if(void 0===b)this.register(a);else{n.isArray(b)?d=b.concat(b.map(n.camelCase)):(e=n.camelCase(b),b in f?d=[b,e]:(d=e,d=d in f?[d]:d.match(G)||[])),c=d.length;while(c--)delete f[d[c]]}(void 0===b||n.isEmptyObject(f))&&(a.nodeType?a[this.expando]=void 0:delete a[this.expando])}},hasData:function(a){var b=a[this.expando];return void 0!==b&&!n.isEmptyObject(b)}};var N=new M,O=new M,P=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,Q=/[A-Z]/g;function R(a,b,c){var d;if(void 0===c&&1===a.nodeType)if(d="data-"+b.replace(Q,"-$&").toLowerCase(),c=a.getAttribute(d),"string"==typeof c){try{c="true"===c?!0:"false"===c?!1:"null"===c?null:+c+""===c?+c:P.test(c)?n.parseJSON(c):c}catch(e){}O.set(a,b,c);
}else c=void 0;return c}n.extend({hasData:function(a){return O.hasData(a)||N.hasData(a)},data:function(a,b,c){return O.access(a,b,c)},removeData:function(a,b){O.remove(a,b)},_data:function(a,b,c){return N.access(a,b,c)},_removeData:function(a,b){N.remove(a,b)}}),n.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=O.get(f),1===f.nodeType&&!N.get(f,"hasDataAttrs"))){c=g.length;while(c--)g[c]&&(d=g[c].name,0===d.indexOf("data-")&&(d=n.camelCase(d.slice(5)),R(f,d,e[d])));N.set(f,"hasDataAttrs",!0)}return e}return"object"==typeof a?this.each(function(){O.set(this,a)}):K(this,function(b){var c,d;if(f&&void 0===b){if(c=O.get(f,a)||O.get(f,a.replace(Q,"-$&").toLowerCase()),void 0!==c)return c;if(d=n.camelCase(a),c=O.get(f,d),void 0!==c)return c;if(c=R(f,d,void 0),void 0!==c)return c}else d=n.camelCase(a),this.each(function(){var c=O.get(this,d);O.set(this,d,b),a.indexOf("-")>-1&&void 0!==c&&O.set(this,a,b)})},null,b,arguments.length>1,null,!0)},removeData:function(a){return this.each(function(){O.remove(this,a)})}}),n.extend({queue:function(a,b,c){var d;return a?(b=(b||"fx")+"queue",d=N.get(a,b),c&&(!d||n.isArray(c)?d=N.access(a,b,n.makeArray(c)):d.push(c)),d||[]):void 0},dequeue:function(a,b){b=b||"fx";var c=n.queue(a,b),d=c.length,e=c.shift(),f=n._queueHooks(a,b),g=function(){n.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return N.get(a,c)||N.access(a,c,{empty:n.Callbacks("once memory").add(function(){N.remove(a,[b+"queue",c])})})}}),n.fn.extend({queue:function(a,b){var c=2;return"string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?n.queue(this[0],a):void 0===b?this:this.each(function(){var c=n.queue(this,a,b);n._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&n.dequeue(this,a)})},dequeue:function(a){return this.each(function(){n.dequeue(this,a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=n.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f])};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)c=N.get(f[g],a+"queueHooks"),c&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}});var S=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,T=new RegExp("^(?:([+-])=|)("+S+")([a-z%]*)$","i"),U=["Top","Right","Bottom","Left"],V=function(a,b){return a=b||a,"none"===n.css(a,"display")||!n.contains(a.ownerDocument,a)};function W(a,b,c,d){var e,f=1,g=20,h=d?function(){return d.cur()}:function(){return n.css(a,b,"")},i=h(),j=c&&c[3]||(n.cssNumber[b]?"":"px"),k=(n.cssNumber[b]||"px"!==j&&+i)&&T.exec(n.css(a,b));if(k&&k[3]!==j){j=j||k[3],c=c||[],k=+i||1;do f=f||".5",k/=f,n.style(a,b,k+j);while(f!==(f=h()/i)&&1!==f&&--g)}return c&&(k=+k||+i||0,e=c[1]?k+(c[1]+1)*c[2]:+c[2],d&&(d.unit=j,d.start=k,d.end=e)),e}var X=/^(?:checkbox|radio)$/i,Y=/<([\w:-]+)/,Z=/^$|\/(?:java|ecma)script/i,$={option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};$.optgroup=$.option,$.tbody=$.tfoot=$.colgroup=$.caption=$.thead,$.th=$.td;function _(a,b){var c="undefined"!=typeof a.getElementsByTagName?a.getElementsByTagName(b||"*"):"undefined"!=typeof a.querySelectorAll?a.querySelectorAll(b||"*"):[];return void 0===b||b&&n.nodeName(a,b)?n.merge([a],c):c}function aa(a,b){for(var c=0,d=a.length;d>c;c++)N.set(a[c],"globalEval",!b||N.get(b[c],"globalEval"))}var ba=/<|&#?\w+;/;function ca(a,b,c,d,e){for(var f,g,h,i,j,k,l=b.createDocumentFragment(),m=[],o=0,p=a.length;p>o;o++)if(f=a[o],f||0===f)if("object"===n.type(f))n.merge(m,f.nodeType?[f]:f);else if(ba.test(f)){g=g||l.appendChild(b.createElement("div")),h=(Y.exec(f)||["",""])[1].toLowerCase(),i=$[h]||$._default,g.innerHTML=i[1]+n.htmlPrefilter(f)+i[2],k=i[0];while(k--)g=g.lastChild;n.merge(m,g.childNodes),g=l.firstChild,g.textContent=""}else m.push(b.createTextNode(f));l.textContent="",o=0;while(f=m[o++])if(d&&n.inArray(f,d)>-1)e&&e.push(f);else if(j=n.contains(f.ownerDocument,f),g=_(l.appendChild(f),"script"),j&&aa(g),c){k=0;while(f=g[k++])Z.test(f.type||"")&&c.push(f)}return l}!function(){var a=d.createDocumentFragment(),b=a.appendChild(d.createElement("div")),c=d.createElement("input");c.setAttribute("type","radio"),c.setAttribute("checked","checked"),c.setAttribute("name","t"),b.appendChild(c),l.checkClone=b.cloneNode(!0).cloneNode(!0).lastChild.checked,b.innerHTML="<textarea>x</textarea>",l.noCloneChecked=!!b.cloneNode(!0).lastChild.defaultValue}();var da=/^key/,ea=/^(?:mouse|pointer|contextmenu|drag|drop)|click/,fa=/^([^.]*)(?:\.(.+)|)/;function ga(){return!0}function ha(){return!1}function ia(){try{return d.activeElement}catch(a){}}function ja(a,b,c,d,e,f){var g,h;if("object"==typeof b){"string"!=typeof c&&(d=d||c,c=void 0);for(h in b)ja(a,h,c,d,b[h],f);return a}if(null==d&&null==e?(e=c,d=c=void 0):null==e&&("string"==typeof c?(e=d,d=void 0):(e=d,d=c,c=void 0)),e===!1)e=ha;else if(!e)return this;return 1===f&&(g=e,e=function(a){return n().off(a),g.apply(this,arguments)},e.guid=g.guid||(g.guid=n.guid++)),a.each(function(){n.event.add(this,b,e,d,c)})}n.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=N.get(a);if(r){c.handler&&(f=c,c=f.handler,e=f.selector),c.guid||(c.guid=n.guid++),(i=r.events)||(i=r.events={}),(g=r.handle)||(g=r.handle=function(b){return"undefined"!=typeof n&&n.event.triggered!==b.type?n.event.dispatch.apply(a,arguments):void 0}),b=(b||"").match(G)||[""],j=b.length;while(j--)h=fa.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o&&(l=n.event.special[o]||{},o=(e?l.delegateType:l.bindType)||o,l=n.event.special[o]||{},k=n.extend({type:o,origType:q,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&n.expr.match.needsContext.test(e),namespace:p.join(".")},f),(m=i[o])||(m=i[o]=[],m.delegateCount=0,l.setup&&l.setup.call(a,d,p,g)!==!1||a.addEventListener&&a.addEventListener(o,g)),l.add&&(l.add.call(a,k),k.handler.guid||(k.handler.guid=c.guid)),e?m.splice(m.delegateCount++,0,k):m.push(k),n.event.global[o]=!0)}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=N.hasData(a)&&N.get(a);if(r&&(i=r.events)){b=(b||"").match(G)||[""],j=b.length;while(j--)if(h=fa.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o){l=n.event.special[o]||{},o=(d?l.delegateType:l.bindType)||o,m=i[o]||[],h=h[2]&&new RegExp("(^|\\.)"+p.join("\\.(?:.*\\.|)")+"(\\.|$)"),g=f=m.length;while(f--)k=m[f],!e&&q!==k.origType||c&&c.guid!==k.guid||h&&!h.test(k.namespace)||d&&d!==k.selector&&("**"!==d||!k.selector)||(m.splice(f,1),k.selector&&m.delegateCount--,l.remove&&l.remove.call(a,k));g&&!m.length&&(l.teardown&&l.teardown.call(a,p,r.handle)!==!1||n.removeEvent(a,o,r.handle),delete i[o])}else for(o in i)n.event.remove(a,o+b[j],c,d,!0);n.isEmptyObject(i)&&N.remove(a,"handle events")}},dispatch:function(a){a=n.event.fix(a);var b,c,d,f,g,h=[],i=e.call(arguments),j=(N.get(this,"events")||{})[a.type]||[],k=n.event.special[a.type]||{};if(i[0]=a,a.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,a)!==!1){h=n.event.handlers.call(this,a,j),b=0;while((f=h[b++])&&!a.isPropagationStopped()){a.currentTarget=f.elem,c=0;while((g=f.handlers[c++])&&!a.isImmediatePropagationStopped())(!a.rnamespace||a.rnamespace.test(g.namespace))&&(a.handleObj=g,a.data=g.data,d=((n.event.special[g.origType]||{}).handle||g.handler).apply(f.elem,i),void 0!==d&&(a.result=d)===!1&&(a.preventDefault(),a.stopPropagation()))}return k.postDispatch&&k.postDispatch.call(this,a),a.result}},handlers:function(a,b){var c,d,e,f,g=[],h=b.delegateCount,i=a.target;if(h&&i.nodeType&&("click"!==a.type||isNaN(a.button)||a.button<1))for(;i!==this;i=i.parentNode||this)if(1===i.nodeType&&(i.disabled!==!0||"click"!==a.type)){for(d=[],c=0;h>c;c++)f=b[c],e=f.selector+" ",void 0===d[e]&&(d[e]=f.needsContext?n(e,this).index(i)>-1:n.find(e,this,null,[i]).length),d[e]&&d.push(f);d.length&&g.push({elem:i,handlers:d})}return h<b.length&&g.push({elem:this,handlers:b.slice(h)}),g},props:"altKey bubbles cancelable ctrlKey currentTarget detail eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return null==a.which&&(a.which=null!=b.charCode?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,b){var c,e,f,g=b.button;return null==a.pageX&&null!=b.clientX&&(c=a.target.ownerDocument||d,e=c.documentElement,f=c.body,a.pageX=b.clientX+(e&&e.scrollLeft||f&&f.scrollLeft||0)-(e&&e.clientLeft||f&&f.clientLeft||0),a.pageY=b.clientY+(e&&e.scrollTop||f&&f.scrollTop||0)-(e&&e.clientTop||f&&f.clientTop||0)),a.which||void 0===g||(a.which=1&g?1:2&g?3:4&g?2:0),a}},fix:function(a){if(a[n.expando])return a;var b,c,e,f=a.type,g=a,h=this.fixHooks[f];h||(this.fixHooks[f]=h=ea.test(f)?this.mouseHooks:da.test(f)?this.keyHooks:{}),e=h.props?this.props.concat(h.props):this.props,a=new n.Event(g),b=e.length;while(b--)c=e[b],a[c]=g[c];return a.target||(a.target=d),3===a.target.nodeType&&(a.target=a.target.parentNode),h.filter?h.filter(a,g):a},special:{load:{noBubble:!0},focus:{trigger:function(){return this!==ia()&&this.focus?(this.focus(),!1):void 0},delegateType:"focusin"},blur:{trigger:function(){return this===ia()&&this.blur?(this.blur(),!1):void 0},delegateType:"focusout"},click:{trigger:function(){return"checkbox"===this.type&&this.click&&n.nodeName(this,"input")?(this.click(),!1):void 0},_default:function(a){return n.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&a.originalEvent&&(a.originalEvent.returnValue=a.result)}}}},n.removeEvent=function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c)},n.Event=function(a,b){return this instanceof n.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&a.returnValue===!1?ga:ha):this.type=a,b&&n.extend(this,b),this.timeStamp=a&&a.timeStamp||n.now(),void(this[n.expando]=!0)):new n.Event(a,b)},n.Event.prototype={constructor:n.Event,isDefaultPrevented:ha,isPropagationStopped:ha,isImmediatePropagationStopped:ha,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=ga,a&&a.preventDefault()},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=ga,a&&a.stopPropagation()},stopImmediatePropagation:function(){var a=this.originalEvent;this.isImmediatePropagationStopped=ga,a&&a.stopImmediatePropagation(),this.stopPropagation()}},n.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(a,b){n.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return(!e||e!==d&&!n.contains(d,e))&&(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),n.fn.extend({on:function(a,b,c,d){return ja(this,a,b,c,d)},one:function(a,b,c,d){return ja(this,a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,n(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return(b===!1||"function"==typeof b)&&(c=b,b=void 0),c===!1&&(c=ha),this.each(function(){n.event.remove(this,a,c,b)})}});var ka=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/gi,la=/<script|<style|<link/i,ma=/checked\s*(?:[^=]|=\s*.checked.)/i,na=/^true\/(.*)/,oa=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;function pa(a,b){return n.nodeName(a,"table")&&n.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a:a}function qa(a){return a.type=(null!==a.getAttribute("type"))+"/"+a.type,a}function ra(a){var b=na.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function sa(a,b){var c,d,e,f,g,h,i,j;if(1===b.nodeType){if(N.hasData(a)&&(f=N.access(a),g=N.set(b,f),j=f.events)){delete g.handle,g.events={};for(e in j)for(c=0,d=j[e].length;d>c;c++)n.event.add(b,e,j[e][c])}O.hasData(a)&&(h=O.access(a),i=n.extend({},h),O.set(b,i))}}function ta(a,b){var c=b.nodeName.toLowerCase();"input"===c&&X.test(a.type)?b.checked=a.checked:("input"===c||"textarea"===c)&&(b.defaultValue=a.defaultValue)}function ua(a,b,c,d){b=f.apply([],b);var e,g,h,i,j,k,m=0,o=a.length,p=o-1,q=b[0],r=n.isFunction(q);if(r||o>1&&"string"==typeof q&&!l.checkClone&&ma.test(q))return a.each(function(e){var f=a.eq(e);r&&(b[0]=q.call(this,e,f.html())),ua(f,b,c,d)});if(o&&(e=ca(b,a[0].ownerDocument,!1,a,d),g=e.firstChild,1===e.childNodes.length&&(e=g),g||d)){for(h=n.map(_(e,"script"),qa),i=h.length;o>m;m++)j=e,m!==p&&(j=n.clone(j,!0,!0),i&&n.merge(h,_(j,"script"))),c.call(a[m],j,m);if(i)for(k=h[h.length-1].ownerDocument,n.map(h,ra),m=0;i>m;m++)j=h[m],Z.test(j.type||"")&&!N.access(j,"globalEval")&&n.contains(k,j)&&(j.src?n._evalUrl&&n._evalUrl(j.src):n.globalEval(j.textContent.replace(oa,"")))}return a}function va(a,b,c){for(var d,e=b?n.filter(b,a):a,f=0;null!=(d=e[f]);f++)c||1!==d.nodeType||n.cleanData(_(d)),d.parentNode&&(c&&n.contains(d.ownerDocument,d)&&aa(_(d,"script")),d.parentNode.removeChild(d));return a}n.extend({htmlPrefilter:function(a){return a.replace(ka,"<$1></$2>")},clone:function(a,b,c){var d,e,f,g,h=a.cloneNode(!0),i=n.contains(a.ownerDocument,a);if(!(l.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||n.isXMLDoc(a)))for(g=_(h),f=_(a),d=0,e=f.length;e>d;d++)ta(f[d],g[d]);if(b)if(c)for(f=f||_(a),g=g||_(h),d=0,e=f.length;e>d;d++)sa(f[d],g[d]);else sa(a,h);return g=_(h,"script"),g.length>0&&aa(g,!i&&_(a,"script")),h},cleanData:function(a){for(var b,c,d,e=n.event.special,f=0;void 0!==(c=a[f]);f++)if(L(c)){if(b=c[N.expando]){if(b.events)for(d in b.events)e[d]?n.event.remove(c,d):n.removeEvent(c,d,b.handle);c[N.expando]=void 0}c[O.expando]&&(c[O.expando]=void 0)}}}),n.fn.extend({domManip:ua,detach:function(a){return va(this,a,!0)},remove:function(a){return va(this,a)},text:function(a){return K(this,function(a){return void 0===a?n.text(this):this.empty().each(function(){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&(this.textContent=a)})},null,a,arguments.length)},append:function(){return ua(this,arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=pa(this,a);b.appendChild(a)}})},prepend:function(){return ua(this,arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=pa(this,a);b.insertBefore(a,b.firstChild)}})},before:function(){return ua(this,arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return ua(this,arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},empty:function(){for(var a,b=0;null!=(a=this[b]);b++)1===a.nodeType&&(n.cleanData(_(a,!1)),a.textContent="");return this},clone:function(a,b){return a=null==a?!1:a,b=null==b?a:b,this.map(function(){return n.clone(this,a,b)})},html:function(a){return K(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a&&1===b.nodeType)return b.innerHTML;if("string"==typeof a&&!la.test(a)&&!$[(Y.exec(a)||["",""])[1].toLowerCase()]){a=n.htmlPrefilter(a);try{for(;d>c;c++)b=this[c]||{},1===b.nodeType&&(n.cleanData(_(b,!1)),b.innerHTML=a);b=0}catch(e){}}b&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(){var a=[];return ua(this,arguments,function(b){var c=this.parentNode;n.inArray(this,a)<0&&(n.cleanData(_(this)),c&&c.replaceChild(b,this))},a)}}),n.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){n.fn[a]=function(a){for(var c,d=[],e=n(a),f=e.length-1,h=0;f>=h;h++)c=h===f?this:this.clone(!0),n(e[h])[b](c),g.apply(d,c.get());return this.pushStack(d)}});var wa,xa={HTML:"block",BODY:"block"};function ya(a,b){var c=n(b.createElement(a)).appendTo(b.body),d=n.css(c[0],"display");return c.detach(),d}function za(a){var b=d,c=xa[a];return c||(c=ya(a,b),"none"!==c&&c||(wa=(wa||n("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement),b=wa[0].contentDocument,b.write(),b.close(),c=ya(a,b),wa.detach()),xa[a]=c),c}var Aa=/^margin/,Ba=new RegExp("^("+S+")(?!px)[a-z%]+$","i"),Ca=function(b){var c=b.ownerDocument.defaultView;return c.opener||(c=a),c.getComputedStyle(b)},Da=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e},Ea=d.documentElement;!function(){var b,c,e,f,g=d.createElement("div"),h=d.createElement("div");if(h.style){h.style.backgroundClip="content-box",h.cloneNode(!0).style.backgroundClip="",l.clearCloneStyle="content-box"===h.style.backgroundClip,g.style.cssText="border:0;width:8px;height:0;top:0;left:-9999px;padding:0;margin-top:1px;position:absolute",g.appendChild(h);function i(){h.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:relative;display:block;margin:auto;border:1px;padding:1px;top:1%;width:50%",h.innerHTML="",Ea.appendChild(g);var d=a.getComputedStyle(h);b="1%"!==d.top,f="2px"===d.marginLeft,c="4px"===d.width,h.style.marginRight="50%",e="4px"===d.marginRight,Ea.removeChild(g)}n.extend(l,{pixelPosition:function(){return i(),b},boxSizingReliable:function(){return null==c&&i(),c},pixelMarginRight:function(){return null==c&&i(),e},reliableMarginLeft:function(){return null==c&&i(),f},reliableMarginRight:function(){var b,c=h.appendChild(d.createElement("div"));return c.style.cssText=h.style.cssText="-webkit-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0",c.style.marginRight=c.style.width="0",h.style.width="1px",Ea.appendChild(g),b=!parseFloat(a.getComputedStyle(c).marginRight),Ea.removeChild(g),h.removeChild(c),b}})}}();function Fa(a,b,c){var d,e,f,g,h=a.style;return c=c||Ca(a),c&&(g=c.getPropertyValue(b)||c[b],""!==g||n.contains(a.ownerDocument,a)||(g=n.style(a,b)),!l.pixelMarginRight()&&Ba.test(g)&&Aa.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f)),void 0!==g?g+"":g}function Ga(a,b){return{get:function(){return a()?void delete this.get:(this.get=b).apply(this,arguments)}}}var Ha=/^(none|table(?!-c[ea]).+)/,Ia={position:"absolute",visibility:"hidden",display:"block"},Ja={letterSpacing:"0",fontWeight:"400"},Ka=["Webkit","O","Moz","ms"],La=d.createElement("div").style;function Ma(a){if(a in La)return a;var b=a[0].toUpperCase()+a.slice(1),c=Ka.length;while(c--)if(a=Ka[c]+b,a in La)return a}function Na(a,b,c){var d=T.exec(b);return d?Math.max(0,d[2]-(c||0))+(d[3]||"px"):b}function Oa(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;4>f;f+=2)"margin"===c&&(g+=n.css(a,c+U[f],!0,e)),d?("content"===c&&(g-=n.css(a,"padding"+U[f],!0,e)),"margin"!==c&&(g-=n.css(a,"border"+U[f]+"Width",!0,e))):(g+=n.css(a,"padding"+U[f],!0,e),"padding"!==c&&(g+=n.css(a,"border"+U[f]+"Width",!0,e)));return g}function Pa(b,c,e){var f=!0,g="width"===c?b.offsetWidth:b.offsetHeight,h=Ca(b),i="border-box"===n.css(b,"boxSizing",!1,h);if(d.msFullscreenElement&&a.top!==a&&b.getClientRects().length&&(g=Math.round(100*b.getBoundingClientRect()[c])),0>=g||null==g){if(g=Fa(b,c,h),(0>g||null==g)&&(g=b.style[c]),Ba.test(g))return g;f=i&&(l.boxSizingReliable()||g===b.style[c]),g=parseFloat(g)||0}return g+Oa(b,c,e||(i?"border":"content"),f,h)+"px"}function Qa(a,b){for(var c,d,e,f=[],g=0,h=a.length;h>g;g++)d=a[g],d.style&&(f[g]=N.get(d,"olddisplay"),c=d.style.display,b?(f[g]||"none"!==c||(d.style.display=""),""===d.style.display&&V(d)&&(f[g]=N.access(d,"olddisplay",za(d.nodeName)))):(e=V(d),"none"===c&&e||N.set(d,"olddisplay",e?c:n.css(d,"display"))));for(g=0;h>g;g++)d=a[g],d.style&&(b&&"none"!==d.style.display&&""!==d.style.display||(d.style.display=b?f[g]||"":"none"));return a}n.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=Fa(a,"opacity");return""===c?"1":c}}}},cssNumber:{animationIterationCount:!0,columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":"cssFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=n.camelCase(b),i=a.style;return b=n.cssProps[h]||(n.cssProps[h]=Ma(h)||h),g=n.cssHooks[b]||n.cssHooks[h],void 0===c?g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b]:(f=typeof c,"string"===f&&(e=T.exec(c))&&e[1]&&(c=W(a,b,e),f="number"),null!=c&&c===c&&("number"===f&&(c+=e&&e[3]||(n.cssNumber[h]?"":"px")),l.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),g&&"set"in g&&void 0===(c=g.set(a,c,d))||(i[b]=c)),void 0)}},css:function(a,b,c,d){var e,f,g,h=n.camelCase(b);return b=n.cssProps[h]||(n.cssProps[h]=Ma(h)||h),g=n.cssHooks[b]||n.cssHooks[h],g&&"get"in g&&(e=g.get(a,!0,c)),void 0===e&&(e=Fa(a,b,d)),"normal"===e&&b in Ja&&(e=Ja[b]),""===c||c?(f=parseFloat(e),c===!0||isFinite(f)?f||0:e):e}}),n.each(["height","width"],function(a,b){n.cssHooks[b]={get:function(a,c,d){return c?Ha.test(n.css(a,"display"))&&0===a.offsetWidth?Da(a,Ia,function(){return Pa(a,b,d)}):Pa(a,b,d):void 0},set:function(a,c,d){var e,f=d&&Ca(a),g=d&&Oa(a,b,d,"border-box"===n.css(a,"boxSizing",!1,f),f);return g&&(e=T.exec(c))&&"px"!==(e[3]||"px")&&(a.style[b]=c,c=n.css(a,b)),Na(a,c,g)}}}),n.cssHooks.marginLeft=Ga(l.reliableMarginLeft,function(a,b){return b?(parseFloat(Fa(a,"marginLeft"))||a.getBoundingClientRect().left-Da(a,{marginLeft:0},function(){return a.getBoundingClientRect().left}))+"px":void 0}),n.cssHooks.marginRight=Ga(l.reliableMarginRight,function(a,b){return b?Da(a,{display:"inline-block"},Fa,[a,"marginRight"]):void 0}),n.each({margin:"",padding:"",border:"Width"},function(a,b){n.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];4>d;d++)e[a+U[d]+b]=f[d]||f[d-2]||f[0];return e}},Aa.test(a)||(n.cssHooks[a+b].set=Na)}),n.fn.extend({css:function(a,b){return K(this,function(a,b,c){var d,e,f={},g=0;if(n.isArray(b)){for(d=Ca(a),e=b.length;e>g;g++)f[b[g]]=n.css(a,b[g],!1,d);return f}return void 0!==c?n.style(a,b,c):n.css(a,b)},a,b,arguments.length>1)},show:function(){return Qa(this,!0)},hide:function(){return Qa(this)},toggle:function(a){return"boolean"==typeof a?a?this.show():this.hide():this.each(function(){V(this)?n(this).show():n(this).hide()})}});function Ra(a,b,c,d,e){return new Ra.prototype.init(a,b,c,d,e)}n.Tween=Ra,Ra.prototype={constructor:Ra,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||n.easing._default,this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(n.cssNumber[c]?"":"px")},cur:function(){var a=Ra.propHooks[this.prop];return a&&a.get?a.get(this):Ra.propHooks._default.get(this)},run:function(a){var b,c=Ra.propHooks[this.prop];return this.options.duration?this.pos=b=n.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):this.pos=b=a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):Ra.propHooks._default.set(this),this}},Ra.prototype.init.prototype=Ra.prototype,Ra.propHooks={_default:{get:function(a){var b;return 1!==a.elem.nodeType||null!=a.elem[a.prop]&&null==a.elem.style[a.prop]?a.elem[a.prop]:(b=n.css(a.elem,a.prop,""),b&&"auto"!==b?b:0)},set:function(a){n.fx.step[a.prop]?n.fx.step[a.prop](a):1!==a.elem.nodeType||null==a.elem.style[n.cssProps[a.prop]]&&!n.cssHooks[a.prop]?a.elem[a.prop]=a.now:n.style(a.elem,a.prop,a.now+a.unit)}}},Ra.propHooks.scrollTop=Ra.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},n.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2},_default:"swing"},n.fx=Ra.prototype.init,n.fx.step={};var Sa,Ta,Ua=/^(?:toggle|show|hide)$/,Va=/queueHooks$/;function Wa(){return a.setTimeout(function(){Sa=void 0}),Sa=n.now()}function Xa(a,b){var c,d=0,e={height:a};for(b=b?1:0;4>d;d+=2-b)c=U[d],e["margin"+c]=e["padding"+c]=a;return b&&(e.opacity=e.width=a),e}function Ya(a,b,c){for(var d,e=(_a.tweeners[b]||[]).concat(_a.tweeners["*"]),f=0,g=e.length;g>f;f++)if(d=e[f].call(c,b,a))return d}function Za(a,b,c){var d,e,f,g,h,i,j,k,l=this,m={},o=a.style,p=a.nodeType&&V(a),q=N.get(a,"fxshow");c.queue||(h=n._queueHooks(a,"fx"),null==h.unqueued&&(h.unqueued=0,i=h.empty.fire,h.empty.fire=function(){h.unqueued||i()}),h.unqueued++,l.always(function(){l.always(function(){h.unqueued--,n.queue(a,"fx").length||h.empty.fire()})})),1===a.nodeType&&("height"in b||"width"in b)&&(c.overflow=[o.overflow,o.overflowX,o.overflowY],j=n.css(a,"display"),k="none"===j?N.get(a,"olddisplay")||za(a.nodeName):j,"inline"===k&&"none"===n.css(a,"float")&&(o.display="inline-block")),c.overflow&&(o.overflow="hidden",l.always(function(){o.overflow=c.overflow[0],o.overflowX=c.overflow[1],o.overflowY=c.overflow[2]}));for(d in b)if(e=b[d],Ua.exec(e)){if(delete b[d],f=f||"toggle"===e,e===(p?"hide":"show")){if("show"!==e||!q||void 0===q[d])continue;p=!0}m[d]=q&&q[d]||n.style(a,d)}else j=void 0;if(n.isEmptyObject(m))"inline"===("none"===j?za(a.nodeName):j)&&(o.display=j);else{q?"hidden"in q&&(p=q.hidden):q=N.access(a,"fxshow",{}),f&&(q.hidden=!p),p?n(a).show():l.done(function(){n(a).hide()}),l.done(function(){var b;N.remove(a,"fxshow");for(b in m)n.style(a,b,m[b])});for(d in m)g=Ya(p?q[d]:0,d,l),d in q||(q[d]=g.start,p&&(g.end=g.start,g.start="width"===d||"height"===d?1:0))}}function $a(a,b){var c,d,e,f,g;for(c in a)if(d=n.camelCase(c),e=b[d],f=a[c],n.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=n.cssHooks[d],g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}function _a(a,b,c){var d,e,f=0,g=_a.prefilters.length,h=n.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=Sa||Wa(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;i>g;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),1>f&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:n.extend({},b),opts:n.extend(!0,{specialEasing:{},easing:n.easing._default},c),originalProperties:b,originalOptions:c,startTime:Sa||Wa(),duration:c.duration,tweens:[],createTween:function(b,c){var d=n.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;d>c;c++)j.tweens[c].run(1);return b?(h.notifyWith(a,[j,1,0]),h.resolveWith(a,[j,b])):h.rejectWith(a,[j,b]),this}}),k=j.props;for($a(k,j.opts.specialEasing);g>f;f++)if(d=_a.prefilters[f].call(j,a,k,j.opts))return n.isFunction(d.stop)&&(n._queueHooks(j.elem,j.opts.queue).stop=n.proxy(d.stop,d)),d;return n.map(k,Ya,j),n.isFunction(j.opts.start)&&j.opts.start.call(a,j),n.fx.timer(n.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}n.Animation=n.extend(_a,{tweeners:{"*":[function(a,b){var c=this.createTween(a,b);return W(c.elem,a,T.exec(b),c),c}]},tweener:function(a,b){n.isFunction(a)?(b=a,a=["*"]):a=a.match(G);for(var c,d=0,e=a.length;e>d;d++)c=a[d],_a.tweeners[c]=_a.tweeners[c]||[],_a.tweeners[c].unshift(b)},prefilters:[Za],prefilter:function(a,b){b?_a.prefilters.unshift(a):_a.prefilters.push(a)}}),n.speed=function(a,b,c){var d=a&&"object"==typeof a?n.extend({},a):{complete:c||!c&&b||n.isFunction(a)&&a,duration:a,easing:c&&b||b&&!n.isFunction(b)&&b};return d.duration=n.fx.off?0:"number"==typeof d.duration?d.duration:d.duration in n.fx.speeds?n.fx.speeds[d.duration]:n.fx.speeds._default,(null==d.queue||d.queue===!0)&&(d.queue="fx"),d.old=d.complete,d.complete=function(){n.isFunction(d.old)&&d.old.call(this),d.queue&&n.dequeue(this,d.queue)},d},n.fn.extend({fadeTo:function(a,b,c,d){return this.filter(V).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=n.isEmptyObject(a),f=n.speed(b,c,d),g=function(){var b=_a(this,n.extend({},a),f);(e||N.get(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c)};return"string"!=typeof a&&(c=b,b=a,a=void 0),b&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=n.timers,g=N.get(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&Va.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));(b||!c)&&n.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=N.get(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=n.timers,g=d?d.length:0;for(c.finish=!0,n.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;g>b;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),n.each(["toggle","show","hide"],function(a,b){var c=n.fn[b];n.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(Xa(b,!0),a,d,e)}}),n.each({slideDown:Xa("show"),slideUp:Xa("hide"),slideToggle:Xa("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){n.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),n.timers=[],n.fx.tick=function(){var a,b=0,c=n.timers;for(Sa=n.now();b<c.length;b++)a=c[b],a()||c[b]!==a||c.splice(b--,1);c.length||n.fx.stop(),Sa=void 0},n.fx.timer=function(a){n.timers.push(a),a()?n.fx.start():n.timers.pop()},n.fx.interval=13,n.fx.start=function(){Ta||(Ta=a.setInterval(n.fx.tick,n.fx.interval))},n.fx.stop=function(){a.clearInterval(Ta),Ta=null},n.fx.speeds={slow:600,fast:200,_default:400},n.fn.delay=function(b,c){return b=n.fx?n.fx.speeds[b]||b:b,c=c||"fx",this.queue(c,function(c,d){var e=a.setTimeout(c,b);d.stop=function(){a.clearTimeout(e)}})},function(){var a=d.createElement("input"),b=d.createElement("select"),c=b.appendChild(d.createElement("option"));a.type="checkbox",l.checkOn=""!==a.value,l.optSelected=c.selected,b.disabled=!0,l.optDisabled=!c.disabled,a=d.createElement("input"),a.value="t",a.type="radio",l.radioValue="t"===a.value}();var ab,bb=n.expr.attrHandle;n.fn.extend({attr:function(a,b){return K(this,n.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){n.removeAttr(this,a)})}}),n.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(3!==f&&8!==f&&2!==f)return"undefined"==typeof a.getAttribute?n.prop(a,b,c):(1===f&&n.isXMLDoc(a)||(b=b.toLowerCase(),e=n.attrHooks[b]||(n.expr.match.bool.test(b)?ab:void 0)),void 0!==c?null===c?void n.removeAttr(a,b):e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:(a.setAttribute(b,c+""),c):e&&"get"in e&&null!==(d=e.get(a,b))?d:(d=n.find.attr(a,b),null==d?void 0:d))},attrHooks:{type:{set:function(a,b){if(!l.radioValue&&"radio"===b&&n.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}},removeAttr:function(a,b){var c,d,e=0,f=b&&b.match(G);if(f&&1===a.nodeType)while(c=f[e++])d=n.propFix[c]||c,n.expr.match.bool.test(c)&&(a[d]=!1),a.removeAttribute(c)}}),ab={set:function(a,b,c){return b===!1?n.removeAttr(a,c):a.setAttribute(c,c),c}},n.each(n.expr.match.bool.source.match(/\w+/g),function(a,b){var c=bb[b]||n.find.attr;bb[b]=function(a,b,d){var e,f;return d||(f=bb[b],bb[b]=e,e=null!=c(a,b,d)?b.toLowerCase():null,bb[b]=f),e}});var cb=/^(?:input|select|textarea|button)$/i,db=/^(?:a|area)$/i;n.fn.extend({prop:function(a,b){return K(this,n.prop,a,b,arguments.length>1)},removeProp:function(a){return this.each(function(){delete this[n.propFix[a]||a]})}}),n.extend({prop:function(a,b,c){var d,e,f=a.nodeType;if(3!==f&&8!==f&&2!==f)return 1===f&&n.isXMLDoc(a)||(b=n.propFix[b]||b,e=n.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b];
},propHooks:{tabIndex:{get:function(a){var b=n.find.attr(a,"tabindex");return b?parseInt(b,10):cb.test(a.nodeName)||db.test(a.nodeName)&&a.href?0:-1}}},propFix:{"for":"htmlFor","class":"className"}}),l.optSelected||(n.propHooks.selected={get:function(a){var b=a.parentNode;return b&&b.parentNode&&b.parentNode.selectedIndex,null}}),n.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){n.propFix[this.toLowerCase()]=this});var eb=/[\t\r\n\f]/g;function fb(a){return a.getAttribute&&a.getAttribute("class")||""}n.fn.extend({addClass:function(a){var b,c,d,e,f,g,h,i=0;if(n.isFunction(a))return this.each(function(b){n(this).addClass(a.call(this,b,fb(this)))});if("string"==typeof a&&a){b=a.match(G)||[];while(c=this[i++])if(e=fb(c),d=1===c.nodeType&&(" "+e+" ").replace(eb," ")){g=0;while(f=b[g++])d.indexOf(" "+f+" ")<0&&(d+=f+" ");h=n.trim(d),e!==h&&c.setAttribute("class",h)}}return this},removeClass:function(a){var b,c,d,e,f,g,h,i=0;if(n.isFunction(a))return this.each(function(b){n(this).removeClass(a.call(this,b,fb(this)))});if(!arguments.length)return this.attr("class","");if("string"==typeof a&&a){b=a.match(G)||[];while(c=this[i++])if(e=fb(c),d=1===c.nodeType&&(" "+e+" ").replace(eb," ")){g=0;while(f=b[g++])while(d.indexOf(" "+f+" ")>-1)d=d.replace(" "+f+" "," ");h=n.trim(d),e!==h&&c.setAttribute("class",h)}}return this},toggleClass:function(a,b){var c=typeof a;return"boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):n.isFunction(a)?this.each(function(c){n(this).toggleClass(a.call(this,c,fb(this),b),b)}):this.each(function(){var b,d,e,f;if("string"===c){d=0,e=n(this),f=a.match(G)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b)}else(void 0===a||"boolean"===c)&&(b=fb(this),b&&N.set(this,"__className__",b),this.setAttribute&&this.setAttribute("class",b||a===!1?"":N.get(this,"__className__")||""))})},hasClass:function(a){var b,c,d=0;b=" "+a+" ";while(c=this[d++])if(1===c.nodeType&&(" "+fb(c)+" ").replace(eb," ").indexOf(b)>-1)return!0;return!1}});var gb=/\r/g;n.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=n.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,n(this).val()):a,null==e?e="":"number"==typeof e?e+="":n.isArray(e)&&(e=n.map(e,function(a){return null==a?"":a+""})),b=n.valHooks[this.type]||n.valHooks[this.nodeName.toLowerCase()],b&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e))});if(e)return b=n.valHooks[e.type]||n.valHooks[e.nodeName.toLowerCase()],b&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(gb,""):null==c?"":c)}}}),n.extend({valHooks:{option:{get:function(a){return n.trim(a.value)}},select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type||0>e,g=f?null:[],h=f?e+1:d.length,i=0>e?h:f?e:0;h>i;i++)if(c=d[i],(c.selected||i===e)&&(l.optDisabled?!c.disabled:null===c.getAttribute("disabled"))&&(!c.parentNode.disabled||!n.nodeName(c.parentNode,"optgroup"))){if(b=n(c).val(),f)return b;g.push(b)}return g},set:function(a,b){var c,d,e=a.options,f=n.makeArray(b),g=e.length;while(g--)d=e[g],(d.selected=n.inArray(n.valHooks.option.get(d),f)>-1)&&(c=!0);return c||(a.selectedIndex=-1),f}}}}),n.each(["radio","checkbox"],function(){n.valHooks[this]={set:function(a,b){return n.isArray(b)?a.checked=n.inArray(n(a).val(),b)>-1:void 0}},l.checkOn||(n.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value})});var hb=/^(?:focusinfocus|focusoutblur)$/;n.extend(n.event,{trigger:function(b,c,e,f){var g,h,i,j,l,m,o,p=[e||d],q=k.call(b,"type")?b.type:b,r=k.call(b,"namespace")?b.namespace.split("."):[];if(h=i=e=e||d,3!==e.nodeType&&8!==e.nodeType&&!hb.test(q+n.event.triggered)&&(q.indexOf(".")>-1&&(r=q.split("."),q=r.shift(),r.sort()),l=q.indexOf(":")<0&&"on"+q,b=b[n.expando]?b:new n.Event(q,"object"==typeof b&&b),b.isTrigger=f?2:3,b.namespace=r.join("."),b.rnamespace=b.namespace?new RegExp("(^|\\.)"+r.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=e),c=null==c?[b]:n.makeArray(c,[b]),o=n.event.special[q]||{},f||!o.trigger||o.trigger.apply(e,c)!==!1)){if(!f&&!o.noBubble&&!n.isWindow(e)){for(j=o.delegateType||q,hb.test(j+q)||(h=h.parentNode);h;h=h.parentNode)p.push(h),i=h;i===(e.ownerDocument||d)&&p.push(i.defaultView||i.parentWindow||a)}g=0;while((h=p[g++])&&!b.isPropagationStopped())b.type=g>1?j:o.bindType||q,m=(N.get(h,"events")||{})[b.type]&&N.get(h,"handle"),m&&m.apply(h,c),m=l&&h[l],m&&m.apply&&L(h)&&(b.result=m.apply(h,c),b.result===!1&&b.preventDefault());return b.type=q,f||b.isDefaultPrevented()||o._default&&o._default.apply(p.pop(),c)!==!1||!L(e)||l&&n.isFunction(e[q])&&!n.isWindow(e)&&(i=e[l],i&&(e[l]=null),n.event.triggered=q,e[q](),n.event.triggered=void 0,i&&(e[l]=i)),b.result}},simulate:function(a,b,c){var d=n.extend(new n.Event,c,{type:a,isSimulated:!0});n.event.trigger(d,null,b),d.isDefaultPrevented()&&c.preventDefault()}}),n.fn.extend({trigger:function(a,b){return this.each(function(){n.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];return c?n.event.trigger(a,b,c,!0):void 0}}),n.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){n.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),n.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}}),l.focusin="onfocusin"in a,l.focusin||n.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){n.event.simulate(b,a.target,n.event.fix(a))};n.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=N.access(d,b);e||d.addEventListener(a,c,!0),N.access(d,b,(e||0)+1)},teardown:function(){var d=this.ownerDocument||this,e=N.access(d,b)-1;e?N.access(d,b,e):(d.removeEventListener(a,c,!0),N.remove(d,b))}}});var ib=a.location,jb=n.now(),kb=/\?/;n.parseJSON=function(a){return JSON.parse(a+"")},n.parseXML=function(b){var c;if(!b||"string"!=typeof b)return null;try{c=(new a.DOMParser).parseFromString(b,"text/xml")}catch(d){c=void 0}return(!c||c.getElementsByTagName("parsererror").length)&&n.error("Invalid XML: "+b),c};var lb=/#.*$/,mb=/([?&])_=[^&]*/,nb=/^(.*?):[ \t]*([^\r\n]*)$/gm,ob=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,pb=/^(?:GET|HEAD)$/,qb=/^\/\//,rb={},sb={},tb="*/".concat("*"),ub=d.createElement("a");ub.href=ib.href;function vb(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(G)||[];if(n.isFunction(c))while(d=f[e++])"+"===d[0]?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function wb(a,b,c,d){var e={},f=a===sb;function g(h){var i;return e[h]=!0,n.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function xb(a,b){var c,d,e=n.ajaxSettings.flatOptions||{};for(c in b)void 0!==b[c]&&((e[c]?a:d||(d={}))[c]=b[c]);return d&&n.extend(!0,a,d),a}function yb(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===d&&(d=a.mimeType||b.getResponseHeader("Content-Type"));if(d)for(e in h)if(h[e]&&h[e].test(d)){i.unshift(e);break}if(i[0]in c)f=i[0];else{for(e in c){if(!i[0]||a.converters[e+" "+i[0]]){f=e;break}g||(g=e)}f=f||g}return f?(f!==i[0]&&i.unshift(f),c[f]):void 0}function zb(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(g=j[i+" "+f]||j["* "+f],!g)for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){g===!0?g=j[e]:j[e]!==!0&&(f=h[0],k.unshift(h[1]));break}if(g!==!0)if(g&&a["throws"])b=g(b);else try{b=g(b)}catch(l){return{state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return{state:"success",data:b}}n.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:ib.href,type:"GET",isLocal:ob.test(ib.protocol),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":tb,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/\bxml\b/,html:/\bhtml/,json:/\bjson\b/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":n.parseJSON,"text xml":n.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?xb(xb(a,n.ajaxSettings),b):xb(n.ajaxSettings,a)},ajaxPrefilter:vb(rb),ajaxTransport:vb(sb),ajax:function(b,c){"object"==typeof b&&(c=b,b=void 0),c=c||{};var e,f,g,h,i,j,k,l,m=n.ajaxSetup({},c),o=m.context||m,p=m.context&&(o.nodeType||o.jquery)?n(o):n.event,q=n.Deferred(),r=n.Callbacks("once memory"),s=m.statusCode||{},t={},u={},v=0,w="canceled",x={readyState:0,getResponseHeader:function(a){var b;if(2===v){if(!h){h={};while(b=nb.exec(g))h[b[1].toLowerCase()]=b[2]}b=h[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return 2===v?g:null},setRequestHeader:function(a,b){var c=a.toLowerCase();return v||(a=u[c]=u[c]||a,t[a]=b),this},overrideMimeType:function(a){return v||(m.mimeType=a),this},statusCode:function(a){var b;if(a)if(2>v)for(b in a)s[b]=[s[b],a[b]];else x.always(a[x.status]);return this},abort:function(a){var b=a||w;return e&&e.abort(b),z(0,b),this}};if(q.promise(x).complete=r.add,x.success=x.done,x.error=x.fail,m.url=((b||m.url||ib.href)+"").replace(lb,"").replace(qb,ib.protocol+"//"),m.type=c.method||c.type||m.method||m.type,m.dataTypes=n.trim(m.dataType||"*").toLowerCase().match(G)||[""],null==m.crossDomain){j=d.createElement("a");try{j.href=m.url,j.href=j.href,m.crossDomain=ub.protocol+"//"+ub.host!=j.protocol+"//"+j.host}catch(y){m.crossDomain=!0}}if(m.data&&m.processData&&"string"!=typeof m.data&&(m.data=n.param(m.data,m.traditional)),wb(rb,m,c,x),2===v)return x;k=n.event&&m.global,k&&0===n.active++&&n.event.trigger("ajaxStart"),m.type=m.type.toUpperCase(),m.hasContent=!pb.test(m.type),f=m.url,m.hasContent||(m.data&&(f=m.url+=(kb.test(f)?"&":"?")+m.data,delete m.data),m.cache===!1&&(m.url=mb.test(f)?f.replace(mb,"$1_="+jb++):f+(kb.test(f)?"&":"?")+"_="+jb++)),m.ifModified&&(n.lastModified[f]&&x.setRequestHeader("If-Modified-Since",n.lastModified[f]),n.etag[f]&&x.setRequestHeader("If-None-Match",n.etag[f])),(m.data&&m.hasContent&&m.contentType!==!1||c.contentType)&&x.setRequestHeader("Content-Type",m.contentType),x.setRequestHeader("Accept",m.dataTypes[0]&&m.accepts[m.dataTypes[0]]?m.accepts[m.dataTypes[0]]+("*"!==m.dataTypes[0]?", "+tb+"; q=0.01":""):m.accepts["*"]);for(l in m.headers)x.setRequestHeader(l,m.headers[l]);if(m.beforeSend&&(m.beforeSend.call(o,x,m)===!1||2===v))return x.abort();w="abort";for(l in{success:1,error:1,complete:1})x[l](m[l]);if(e=wb(sb,m,c,x)){if(x.readyState=1,k&&p.trigger("ajaxSend",[x,m]),2===v)return x;m.async&&m.timeout>0&&(i=a.setTimeout(function(){x.abort("timeout")},m.timeout));try{v=1,e.send(t,z)}catch(y){if(!(2>v))throw y;z(-1,y)}}else z(-1,"No Transport");function z(b,c,d,h){var j,l,t,u,w,y=c;2!==v&&(v=2,i&&a.clearTimeout(i),e=void 0,g=h||"",x.readyState=b>0?4:0,j=b>=200&&300>b||304===b,d&&(u=yb(m,x,d)),u=zb(m,u,x,j),j?(m.ifModified&&(w=x.getResponseHeader("Last-Modified"),w&&(n.lastModified[f]=w),w=x.getResponseHeader("etag"),w&&(n.etag[f]=w)),204===b||"HEAD"===m.type?y="nocontent":304===b?y="notmodified":(y=u.state,l=u.data,t=u.error,j=!t)):(t=y,(b||!y)&&(y="error",0>b&&(b=0))),x.status=b,x.statusText=(c||y)+"",j?q.resolveWith(o,[l,y,x]):q.rejectWith(o,[x,y,t]),x.statusCode(s),s=void 0,k&&p.trigger(j?"ajaxSuccess":"ajaxError",[x,m,j?l:t]),r.fireWith(o,[x,y]),k&&(p.trigger("ajaxComplete",[x,m]),--n.active||n.event.trigger("ajaxStop")))}return x},getJSON:function(a,b,c){return n.get(a,b,c,"json")},getScript:function(a,b){return n.get(a,void 0,b,"script")}}),n.each(["get","post"],function(a,b){n[b]=function(a,c,d,e){return n.isFunction(c)&&(e=e||d,d=c,c=void 0),n.ajax(n.extend({url:a,type:b,dataType:e,data:c,success:d},n.isPlainObject(a)&&a))}}),n._evalUrl=function(a){return n.ajax({url:a,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})},n.fn.extend({wrapAll:function(a){var b;return n.isFunction(a)?this.each(function(b){n(this).wrapAll(a.call(this,b))}):(this[0]&&(b=n(a,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstElementChild)a=a.firstElementChild;return a}).append(this)),this)},wrapInner:function(a){return n.isFunction(a)?this.each(function(b){n(this).wrapInner(a.call(this,b))}):this.each(function(){var b=n(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=n.isFunction(a);return this.each(function(c){n(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){n.nodeName(this,"body")||n(this).replaceWith(this.childNodes)}).end()}}),n.expr.filters.hidden=function(a){return!n.expr.filters.visible(a)},n.expr.filters.visible=function(a){return a.offsetWidth>0||a.offsetHeight>0||a.getClientRects().length>0};var Ab=/%20/g,Bb=/\[\]$/,Cb=/\r?\n/g,Db=/^(?:submit|button|image|reset|file)$/i,Eb=/^(?:input|select|textarea|keygen)/i;function Fb(a,b,c,d){var e;if(n.isArray(b))n.each(b,function(b,e){c||Bb.test(a)?d(a,e):Fb(a+"["+("object"==typeof e&&null!=e?b:"")+"]",e,c,d)});else if(c||"object"!==n.type(b))d(a,b);else for(e in b)Fb(a+"["+e+"]",b[e],c,d)}n.param=function(a,b){var c,d=[],e=function(a,b){b=n.isFunction(b)?b():null==b?"":b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};if(void 0===b&&(b=n.ajaxSettings&&n.ajaxSettings.traditional),n.isArray(a)||a.jquery&&!n.isPlainObject(a))n.each(a,function(){e(this.name,this.value)});else for(c in a)Fb(c,a[c],b,e);return d.join("&").replace(Ab,"+")},n.fn.extend({serialize:function(){return n.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=n.prop(this,"elements");return a?n.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!n(this).is(":disabled")&&Eb.test(this.nodeName)&&!Db.test(a)&&(this.checked||!X.test(a))}).map(function(a,b){var c=n(this).val();return null==c?null:n.isArray(c)?n.map(c,function(a){return{name:b.name,value:a.replace(Cb,"\r\n")}}):{name:b.name,value:c.replace(Cb,"\r\n")}}).get()}}),n.ajaxSettings.xhr=function(){try{return new a.XMLHttpRequest}catch(b){}};var Gb={0:200,1223:204},Hb=n.ajaxSettings.xhr();l.cors=!!Hb&&"withCredentials"in Hb,l.ajax=Hb=!!Hb,n.ajaxTransport(function(b){var c,d;return l.cors||Hb&&!b.crossDomain?{send:function(e,f){var g,h=b.xhr();if(h.open(b.type,b.url,b.async,b.username,b.password),b.xhrFields)for(g in b.xhrFields)h[g]=b.xhrFields[g];b.mimeType&&h.overrideMimeType&&h.overrideMimeType(b.mimeType),b.crossDomain||e["X-Requested-With"]||(e["X-Requested-With"]="XMLHttpRequest");for(g in e)h.setRequestHeader(g,e[g]);c=function(a){return function(){c&&(c=d=h.onload=h.onerror=h.onabort=h.onreadystatechange=null,"abort"===a?h.abort():"error"===a?"number"!=typeof h.status?f(0,"error"):f(h.status,h.statusText):f(Gb[h.status]||h.status,h.statusText,"text"!==(h.responseType||"text")||"string"!=typeof h.responseText?{binary:h.response}:{text:h.responseText},h.getAllResponseHeaders()))}},h.onload=c(),d=h.onerror=c("error"),void 0!==h.onabort?h.onabort=d:h.onreadystatechange=function(){4===h.readyState&&a.setTimeout(function(){c&&d()})},c=c("abort");try{h.send(b.hasContent&&b.data||null)}catch(i){if(c)throw i}},abort:function(){c&&c()}}:void 0}),n.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/\b(?:java|ecma)script\b/},converters:{"text script":function(a){return n.globalEval(a),a}}}),n.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET")}),n.ajaxTransport("script",function(a){if(a.crossDomain){var b,c;return{send:function(e,f){b=n("<script>").prop({charset:a.scriptCharset,src:a.url}).on("load error",c=function(a){b.remove(),c=null,a&&f("error"===a.type?404:200,a.type)}),d.head.appendChild(b[0])},abort:function(){c&&c()}}}});var Ib=[],Jb=/(=)\?(?=&|$)|\?\?/;n.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=Ib.pop()||n.expando+"_"+jb++;return this[a]=!0,a}}),n.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=b.jsonp!==!1&&(Jb.test(b.url)?"url":"string"==typeof b.data&&0===(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&Jb.test(b.data)&&"data");return h||"jsonp"===b.dataTypes[0]?(e=b.jsonpCallback=n.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(Jb,"$1"+e):b.jsonp!==!1&&(b.url+=(kb.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||n.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments},d.always(function(){void 0===f?n(a).removeProp(e):a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,Ib.push(e)),g&&n.isFunction(f)&&f(g[0]),g=f=void 0}),"script"):void 0}),l.createHTMLDocument=function(){var a=d.implementation.createHTMLDocument("").body;return a.innerHTML="<form></form><form></form>",2===a.childNodes.length}(),n.parseHTML=function(a,b,c){if(!a||"string"!=typeof a)return null;"boolean"==typeof b&&(c=b,b=!1),b=b||(l.createHTMLDocument?d.implementation.createHTMLDocument(""):d);var e=x.exec(a),f=!c&&[];return e?[b.createElement(e[1])]:(e=ca([a],b,f),f&&f.length&&n(f).remove(),n.merge([],e.childNodes))};var Kb=n.fn.load;n.fn.load=function(a,b,c){if("string"!=typeof a&&Kb)return Kb.apply(this,arguments);var d,e,f,g=this,h=a.indexOf(" ");return h>-1&&(d=n.trim(a.slice(h)),a=a.slice(0,h)),n.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(e="POST"),g.length>0&&n.ajax({url:a,type:e||"GET",dataType:"html",data:b}).done(function(a){f=arguments,g.html(d?n("<div>").append(n.parseHTML(a)).find(d):a)}).always(c&&function(a,b){g.each(function(){c.apply(g,f||[a.responseText,b,a])})}),this},n.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){n.fn[b]=function(a){return this.on(b,a)}}),n.expr.filters.animated=function(a){return n.grep(n.timers,function(b){return a===b.elem}).length};function Lb(a){return n.isWindow(a)?a:9===a.nodeType&&a.defaultView}n.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=n.css(a,"position"),l=n(a),m={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=n.css(a,"top"),i=n.css(a,"left"),j=("absolute"===k||"fixed"===k)&&(f+i).indexOf("auto")>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),n.isFunction(b)&&(b=b.call(a,c,n.extend({},h))),null!=b.top&&(m.top=b.top-h.top+g),null!=b.left&&(m.left=b.left-h.left+e),"using"in b?b.using.call(a,m):l.css(m)}},n.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){n.offset.setOffset(this,a,b)});var b,c,d=this[0],e={top:0,left:0},f=d&&d.ownerDocument;if(f)return b=f.documentElement,n.contains(b,d)?(e=d.getBoundingClientRect(),c=Lb(f),{top:e.top+c.pageYOffset-b.clientTop,left:e.left+c.pageXOffset-b.clientLeft}):e},position:function(){if(this[0]){var a,b,c=this[0],d={top:0,left:0};return"fixed"===n.css(c,"position")?b=c.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),n.nodeName(a[0],"html")||(d=a.offset()),d.top+=n.css(a[0],"borderTopWidth",!0)-a.scrollTop(),d.left+=n.css(a[0],"borderLeftWidth",!0)-a.scrollLeft()),{top:b.top-d.top-n.css(c,"marginTop",!0),left:b.left-d.left-n.css(c,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent;while(a&&"static"===n.css(a,"position"))a=a.offsetParent;return a||Ea})}}),n.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,b){var c="pageYOffset"===b;n.fn[a]=function(d){return K(this,function(a,d,e){var f=Lb(a);return void 0===e?f?f[b]:a[d]:void(f?f.scrollTo(c?f.pageXOffset:e,c?e:f.pageYOffset):a[d]=e)},a,d,arguments.length)}}),n.each(["top","left"],function(a,b){n.cssHooks[b]=Ga(l.pixelPosition,function(a,c){return c?(c=Fa(a,b),Ba.test(c)?n(a).position()[b]+"px":c):void 0})}),n.each({Height:"height",Width:"width"},function(a,b){n.each({padding:"inner"+a,content:b,"":"outer"+a},function(c,d){n.fn[d]=function(d,e){var f=arguments.length&&(c||"boolean"!=typeof d),g=c||(d===!0||e===!0?"margin":"border");return K(this,function(b,c,d){var e;return n.isWindow(b)?b.document.documentElement["client"+a]:9===b.nodeType?(e=b.documentElement,Math.max(b.body["scroll"+a],e["scroll"+a],b.body["offset"+a],e["offset"+a],e["client"+a])):void 0===d?n.css(b,c,g):n.style(b,c,d,g)},b,f?d:void 0,f,null)}})}),n.fn.extend({bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)},size:function(){return this.length}}),n.fn.andSelf=n.fn.addBack,"function"==typeof define&&define.amd&&define("jquery",[],function(){return n});var Mb=a.jQuery,Nb=a.$;return n.noConflict=function(b){return a.$===n&&(a.$=Nb),b&&a.jQuery===n&&(a.jQuery=Mb),n},b||(a.jQuery=a.$=n),n});
var swfobject=function(){function e(){if(!J&&document.getElementsByTagName("body")[0]){try{var e,t=m("span");t.style.display="none",e=P.getElementsByTagName("body")[0].appendChild(t),e.parentNode.removeChild(e),e=null,t=null}catch(n){return}J=!0;for(var i=D.length,a=0;i>a;a++)D[a]()}}function t(e){J?e():D[D.length]=e}function n(e){if(typeof U.addEventListener!==L)U.addEventListener("load",e,!1);else if(typeof P.addEventListener!==L)P.addEventListener("load",e,!1);else if(typeof U.attachEvent!==L)w(U,"onload",e);else if("function"==typeof U.onload){var t=U.onload;U.onload=function(){t(),e()}}else U.onload=e}function i(){var e=P.getElementsByTagName("body")[0],t=m(O);t.setAttribute("style","visibility: hidden;"),t.setAttribute("type",F);var n=e.appendChild(t);if(n){var i=0;!function r(){if(typeof n.GetVariable!==L)try{var o=n.GetVariable("$version");o&&(o=o.split(" ")[1].split(","),Q.pv=[g(o[0]),g(o[1]),g(o[2])])}catch(s){Q.pv=[8,0,0]}else if(10>i)return i++,void setTimeout(r,10);e.removeChild(t),n=null,a()}()}else a()}function a(){var e=H.length;if(e>0)for(var t=0;e>t;t++){var n=H[t].id,i=H[t].callbackFn,a={success:!1,id:n};if(Q.pv[0]>0){var d=h(n);if(d)if(!b(H[t].swfVersion)||Q.wk&&Q.wk<312)if(H[t].expressInstall&&o()){var c={};c.data=H[t].expressInstall,c.width=d.getAttribute("width")||"0",c.height=d.getAttribute("height")||"0",d.getAttribute("class")&&(c.styleclass=d.getAttribute("class")),d.getAttribute("align")&&(c.align=d.getAttribute("align"));for(var f={},u=d.getElementsByTagName("param"),p=u.length,v=0;p>v;v++)"movie"!==u[v].getAttribute("name").toLowerCase()&&(f[u[v].getAttribute("name")]=u[v].getAttribute("value"));s(c,f,n,i)}else l(d),i&&i(a);else C(n,!0),i&&(a.success=!0,a.ref=r(n),a.id=n,i(a))}else if(C(n,!0),i){var y=r(n);y&&typeof y.SetVariable!==L&&(a.success=!0,a.ref=y,a.id=y.id),i(a)}}}function r(e){var t=null,n=h(e);return n&&"OBJECT"===n.nodeName.toUpperCase()&&(t=typeof n.SetVariable!==L?n:n.getElementsByTagName(O)[0]||n),t}function o(){return!X&&b("6.0.65")&&(Q.win||Q.mac)&&!(Q.wk&&Q.wk<312)}function s(e,t,n,i){var a=h(n);if(n=y(n),X=!0,N=i||null,k={success:!1,id:n},a){"OBJECT"===a.nodeName.toUpperCase()?(S=d(a),T=null):(S=a,T=n),e.id=$,(typeof e.width===L||!/%$/.test(e.width)&&g(e.width)<310)&&(e.width="310"),(typeof e.height===L||!/%$/.test(e.height)&&g(e.height)<137)&&(e.height="137");var r=Q.ie?"ActiveX":"PlugIn",o="MMredirectURL="+encodeURIComponent(U.location.toString().replace(/&/g,"%26"))+"&MMplayerType="+r+"&MMdoctitle="+encodeURIComponent(P.title.slice(0,47)+" - Flash Player Installation");if(typeof t.flashvars!==L?t.flashvars+="&"+o:t.flashvars=o,Q.ie&&4!=a.readyState){var s=m("div");n+="SWFObjectNew",s.setAttribute("id",n),a.parentNode.insertBefore(s,a),a.style.display="none",p(a)}f(e,t,n)}}function l(e){if(Q.ie&&4!=e.readyState){e.style.display="none";var t=m("div");e.parentNode.insertBefore(t,e),t.parentNode.replaceChild(d(e),t),p(e)}else e.parentNode.replaceChild(d(e),e)}function d(e){var t=m("div");if(Q.win&&Q.ie)t.innerHTML=e.innerHTML;else{var n=e.getElementsByTagName(O)[0];if(n){var i=n.childNodes;if(i)for(var a=i.length,r=0;a>r;r++)1==i[r].nodeType&&"PARAM"===i[r].nodeName||8==i[r].nodeType||t.appendChild(i[r].cloneNode(!0))}}return t}function c(e,t){var n=m("div");return n.innerHTML="<object classid='clsid:D27CDB6E-AE6D-11cf-96B8-444553540000'><param name='movie' value='"+e+"'>"+t+"</object>",n.firstChild}function f(e,t,n){var i,a=h(n);if(n=y(n),Q.wk&&Q.wk<312)return i;if(a){var r,o,s,l=m(Q.ie?"div":O);typeof e.id===L&&(e.id=n);for(s in t)t.hasOwnProperty(s)&&"movie"!==s.toLowerCase()&&u(l,s,t[s]);Q.ie&&(l=c(e.data,l.innerHTML));for(r in e)e.hasOwnProperty(r)&&(o=r.toLowerCase(),"styleclass"===o?l.setAttribute("class",e[r]):"classid"!==o&&"data"!==o&&l.setAttribute(r,e[r]));Q.ie?W[W.length]=e.id:(l.setAttribute("type",F),l.setAttribute("data",e.data)),a.parentNode.replaceChild(l,a),i=l}return i}function u(e,t,n){var i=m("param");i.setAttribute("name",t),i.setAttribute("value",n),e.appendChild(i)}function p(e){var t=h(e);t&&"OBJECT"===t.nodeName.toUpperCase()&&(Q.ie?(t.style.display="none",function n(){if(4==t.readyState){for(var e in t)"function"==typeof t[e]&&(t[e]=null);t.parentNode.removeChild(t)}else setTimeout(n,10)}()):t.parentNode.removeChild(t))}function v(e){return e&&e.nodeType&&1===e.nodeType}function y(e){return v(e)?e.id:e}function h(e){if(v(e))return e;var t=null;try{t=P.getElementById(e)}catch(n){}return t}function m(e){return P.createElement(e)}function g(e){return parseInt(e,10)}function w(e,t,n){e.attachEvent(t,n),G[G.length]=[e,t,n]}function b(e){e+="";var t=Q.pv,n=e.split(".");return n[0]=g(n[0]),n[1]=g(n[1])||0,n[2]=g(n[2])||0,t[0]>n[0]||t[0]==n[0]&&t[1]>n[1]||t[0]==n[0]&&t[1]==n[1]&&t[2]>=n[2]?!0:!1}function E(e,t,n,i){var a=P.getElementsByTagName("head")[0];if(a){var r="string"==typeof n?n:"screen";if(i&&(B=null,I=null),!B||I!=r){var o=m("style");o.setAttribute("type","text/css"),o.setAttribute("media",r),B=a.appendChild(o),Q.ie&&typeof P.styleSheets!==L&&P.styleSheets.length>0&&(B=P.styleSheets[P.styleSheets.length-1]),I=r}B&&(typeof B.addRule!==L?B.addRule(e,t):typeof P.createTextNode!==L&&B.appendChild(P.createTextNode(e+" {"+t+"}")))}}function C(e,t){if(z){var n=t?"visible":"hidden",i=h(e);J&&i?i.style.visibility=n:"string"==typeof e&&E("#"+e,"visibility:"+n)}}function A(e){var t=/[\\\"<>\.;]/,n=null!==t.exec(e);return n&&typeof encodeURIComponent!==L?encodeURIComponent(e):e}var S,T,N,k,B,I,L="undefined",O="object",j="Shockwave Flash",x="ShockwaveFlash.ShockwaveFlash",F="application/x-shockwave-flash",$="SWFObjectExprInst",M="onreadystatechange",U=window,P=document,R=navigator,V=!1,D=[],H=[],W=[],G=[],J=!1,X=!1,z=!0,Z=!1,Q=function(){var e=typeof P.getElementById!==L&&typeof P.getElementsByTagName!==L&&typeof P.createElement!==L,t=R.userAgent.toLowerCase(),n=R.platform.toLowerCase(),i=n?/win/.test(n):/win/.test(t),a=n?/mac/.test(n):/mac/.test(t),r=/webkit/.test(t)?parseFloat(t.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):!1,o="Microsoft Internet Explorer"===R.appName,s=[0,0,0],l=null;if(typeof R.plugins!==L&&typeof R.plugins[j]===O)l=R.plugins[j].description,l&&typeof R.mimeTypes!==L&&R.mimeTypes[F]&&R.mimeTypes[F].enabledPlugin&&(V=!0,o=!1,l=l.replace(/^.*\s+(\S+\s+\S+$)/,"$1"),s[0]=g(l.replace(/^(.*)\..*$/,"$1")),s[1]=g(l.replace(/^.*\.(.*)\s.*$/,"$1")),s[2]=/[a-zA-Z]/.test(l)?g(l.replace(/^.*[a-zA-Z]+(.*)$/,"$1")):0);else if(typeof U.ActiveXObject!==L)try{var d=new ActiveXObject(x);d&&(l=d.GetVariable("$version"),l&&(o=!0,l=l.split(" ")[1].split(","),s=[g(l[0]),g(l[1]),g(l[2])]))}catch(c){}return{w3:e,pv:s,wk:r,ie:o,win:i,mac:a}}();(function(){Q.w3&&((typeof P.readyState!==L&&("complete"===P.readyState||"interactive"===P.readyState)||typeof P.readyState===L&&(P.getElementsByTagName("body")[0]||P.body))&&e(),J||(typeof P.addEventListener!==L&&P.addEventListener("DOMContentLoaded",e,!1),Q.ie&&(P.attachEvent(M,function t(){"complete"===P.readyState&&(P.detachEvent(M,t),e())}),U==top&&!function n(){if(!J){try{P.documentElement.doScroll("left")}catch(t){return void setTimeout(n,0)}e()}}()),Q.wk&&!function i(){return J?void 0:/loaded|complete/.test(P.readyState)?void e():void setTimeout(i,0)}()))})();D[0]=function(){V?i():a()};(function(){Q.ie&&window.attachEvent("onunload",function(){for(var e=G.length,t=0;e>t;t++)G[t][0].detachEvent(G[t][1],G[t][2]);for(var n=W.length,i=0;n>i;i++)p(W[i]);for(var a in Q)Q[a]=null;Q=null;for(var r in swfobject)swfobject[r]=null;swfobject=null})})();return{registerObject:function(e,t,n,i){if(Q.w3&&e&&t){var a={};a.id=e,a.swfVersion=t,a.expressInstall=n,a.callbackFn=i,H[H.length]=a,C(e,!1)}else i&&i({success:!1,id:e})},getObjectById:function(e){return Q.w3?r(e):void 0},embedSWF:function(e,n,i,a,r,l,d,c,u,p){var v=y(n),h={success:!1,id:v};Q.w3&&!(Q.wk&&Q.wk<312)&&e&&n&&i&&a&&r?(C(v,!1),t(function(){i+="",a+="";var t={};if(u&&typeof u===O)for(var y in u)t[y]=u[y];t.data=e,t.width=i,t.height=a;var m={};if(c&&typeof c===O)for(var g in c)m[g]=c[g];if(d&&typeof d===O)for(var w in d)if(d.hasOwnProperty(w)){var E=Z?encodeURIComponent(w):w,A=Z?encodeURIComponent(d[w]):d[w];typeof m.flashvars!==L?m.flashvars+="&"+E+"="+A:m.flashvars=E+"="+A}if(b(r)){var S=f(t,m,n);t.id==v&&C(v,!0),h.success=!0,h.ref=S,h.id=S.id}else{if(l&&o())return t.data=l,void s(t,m,n,p);C(v,!0)}p&&p(h)})):p&&p(h)},switchOffAutoHideShow:function(){z=!1},enableUriEncoding:function(e){Z=typeof e===L?!0:e},ua:Q,getFlashPlayerVersion:function(){return{major:Q.pv[0],minor:Q.pv[1],release:Q.pv[2]}},hasFlashPlayerVersion:b,createSWF:function(e,t,n){return Q.w3?f(e,t,n):void 0},showExpressInstall:function(e,t,n,i){Q.w3&&o()&&s(e,t,n,i)},removeSWF:function(e){Q.w3&&p(e)},createCSS:function(e,t,n,i){Q.w3&&E(e,t,n,i)},addDomLoadEvent:t,addLoadEvent:n,getQueryParamValue:function(e){var t=P.location.search||P.location.hash;if(t){if(/\?/.test(t)&&(t=t.split("?")[1]),!e)return A(t);for(var n=t.split("&"),i=0;i<n.length;i++)if(n[i].substring(0,n[i].indexOf("="))==e)return A(n[i].substring(n[i].indexOf("=")+1))}return""},expressInstallCallback:function(){if(X){var e=h($);e&&S&&(e.parentNode.replaceChild(S,e),T&&(C(T,!0),Q.ie&&(S.style.display="block")),N&&N(k)),X=!1}},version:"2.3"}}();
