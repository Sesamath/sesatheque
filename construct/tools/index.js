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

'use strict'

var _ = require('lodash')
var moment = require('moment')
var util = require('util')

/**
 * Un assemblage de fonctions utilitaires
 * @service tools
 */
var tools = {}

/**
 * Clone un objet en conservant son prototype
 * @memberOf tools
 * @param object
 * @returns {Object}
 */
tools.clone = function(object) {
  var copy = object
  if (object instanceof Array) {
    copy = object.slice()
  } else if (object instanceof Date) {
    copy = new Date(object)
  } else if (object instanceof RegExp) {
    copy = new RegExp(object)
  } else if (object instanceof Object) {
    copy = Object.create(Object.getPrototypeOf(object));
    tools.update(copy, object);
  }
  return copy;
}

/**
 * Renvoie les propriétés d'un objet en virant le prototype et les méthodes (avec stringify & parse)
 * @param {object} object
 * @returns {object}
 */
tools.cloneData = function(object) {
  return tools.parse(tools.stringify(object))
}

/**
 * Vérifie qu'une valeur est entière dans l'intervalle donné et recadre sinon (avec un message dans le log d'erreur)
 * @memberOf tools
 * @param int La valeur à contrôler
 * @param min Le minimum exigé
 * @param max Le maximum exigé
 * @param label Un label pour le message d'erreur (qui indique ce qui a été recadré)
 * @returns {Integer}
 */
tools.encadre = function (int, min, max, label) {
  var value = parseInt(int)
  if (value < min) {
    log.error(label +" trop petit (" +value +"), on le fixe à " +min)
    value = min
  }
  if (value > max) {
    log.error(label +" trop grand (" +value +"), on le fixe à " +max)
    value = max
  }
  return value
}

/**
 * Compare les data des objets (via stringify)
 * @param obj1
 * @param obj2
 * @returns {boolean}
 */
tools.isEqual = function (obj1, obj2) {
  return tools.stringify(obj1) === tools.stringify(obj2)
}

/**
 * Renvoie une copie de tab où toutes les chaînes représentant des entiers sont des entiers (récursivement)
 * @memberOf tools
 * @param {Array} tab Le tableau à analyser
 * @returns {Array} Le tableau copié et éventuellement modifié
 */
tools.integerify = function (tab) {
  var i, tabCopy = []
  if (tab instanceof Array) {
    tab.forEach(function (value) {
      if (_.isArray(value)) tabCopy.push(tools.integerify(value))
      else if (typeof value === 'string' || typeof value === 'number') {
        i = parseInt(value, 10)
        if (value == i) tabCopy.push(i)
        else tabCopy.push(value)
      } else {
        tabCopy.push(value)
      }
    })
  }

  return tabCopy
}

/**
 * Retourne true si l'url est sur l'api
 * @memberOf tools
 * @param url
 * @returns {boolean}
 */
tools.isApi = function (url) {
  return /^\/api\//.exec(url)
}

/**
 * Retourne true si l'url concerne un fichier statique
 * (statique i.e. les extensions susceptibles d'exister dans sesatheque, c'est pas exaustif)
 * @memberOf tools
 * @param url
 * @returns {boolean}
 */
tools.isStatic = function (url) {
  return /\.(js|css|png|ico|jpg|jpeg|gif)(\?.*)?$/.exec(url)
}

/**
 * Retourne true si l'url concerne une url publique (avec /public/ dedans, html ou json)
 * @memberOf tools
 * @param url
 * @returns {boolean}
 */
tools.isPublic = function (url) {
  return /\/public\//.exec(url)
}
/**
 * Génère le code html d'un lien
 * @memberOf tools
 * @param path Le path (absolu ou relatif)
 * @param texte Le texte à afficher
 * @param {string|array} [args] Des arguments à ajouter au path (séparateur slash)
 * @returns {string} Le code html du tag a
 */
tools.link = function (path, texte, args) {
  if (args) {
    if (_.isArray(args)) path += args.join('/')
    else path += '/' +args
  }

  return '<a href="' +path +'">' +texte +'</a>'
}

/**
 * Génère le code html d'un lien avec les args en queryString
 * @memberOf tools
 * @param path Le path (absolu ou relatif)
 * @param texte Le texte à afficher
 * @param {Object} [args] Des arguments à ajouter en queryString
 * @returns {string} Le code html du tag a
 */
tools.linkQs = function (path, texte, args) {
  if (args) {
    var paires = []
    for (var p in args) {
      if (args.hasOwnProperty(p)) paires.push(p +'=' +encodeURIComponent(args[p]))
    }
    if (paires.length) path += '?' +paires.join('&')
  }

  return '<a href="' +path +'">' +texte +'</a>'
}

/**
 * Fusionne les nouvelles valeurs avec les propriétés de l'objet (en profondeur)
 * (concatène si les deux propriétés sont des tableaux, en virant d'éventuels doublons,
 * fusionne si c'est deux objets et écrase les anciennes valeurs sinon)
 * @memberOf tools
 * @param {Object} object L'objet source
 * @param {Object} newValues Les valeurs à fusionner
 * @param {boolean} [strict=false] passer true pour lancer une exception si les arguments ne sont pas 2 Object ou 2 Array
 */
tools.merge = function(object, newValues, strict) {
  function mergeArray(arDest, arSrc) {
    var s, d, found
    for (s = 0; s < arSrc.length; s++) {
      found = false
      for (d = 0; d < arDest.length; d++) {
        if (_.isEqual(arSrc[s], arDest[d])) {
          found = true
          break
        }
      }
      if (!found) arDest.push(arSrc[s])
    }
  }
  function mergeObj(obj, values) {
    _.each(values, function(value, key) {
      // 2 tableaux à merger
      if (_.isArray(value) && _.isArray(obj[key])) mergeArray(obj[key], value)
      // 2 objets
      else if (_.isObject(value) && _.isObject(obj[key])) mergeObj(obj[key], value)
      // sinon on écrase
      else obj[key] = value
    })
  }

  if (object instanceof Array && newValues instanceof Array) mergeArray(object, newValues)
  else if (object instanceof Object && newValues instanceof Object) mergeObj(object, newValues)
  else if (strict) log.error(new Error('tools.merge réclame 2 Object ou 2 Array'))
}

/**
 * Idem JSON.parse mais renvoie undefined en cas de plantage
 * @memberOf tools
 * @param jsonString La string à parser
 * @return {Object}
 */
tools.parse = function (jsonString) {
  var obj
  if (typeof jsonString === "string") {
    try {
      obj = JSON.parse(jsonString)
    } catch (e) {
      log.error(e)
    }
  }
  return obj
}

/**
 * Vire les espaces et les caractères de contrôle d'une chaine
 * @see http://unicode-table.com/en/
 * @memberOf tools
 * @param {string} source La chaîne à nettoyer
 * @returns {string} La chaîne nettoyée
 */
tools.sanitizeHashKey = function(source) {
  return source.replace(/[\x00-\x20\x7F-\xA0]/, '');
}

/**
 * Vire tous les caractères autres que lettres (non accentuées), chiffres, _ et -
 * @param source
 * @returns {void|*|{value}|string|XML}
 */
tools.sanitizeStrict = function (source) {
  return source.replace(/[^a-zA-Z0-9_\-]/, '');
}

/**
 * Incorpore des arguments à un message, façon sprintf
 * pas très intéressant si n arguments, util.format fait la même chose, mais tolère un tableau d'arguments en 2e param
 * @param {string} message
 * @param {string|Array} args Les arguments, en liste ou en tableau
 * @returns {string}
 */
tools.strFormat = function (message, args) {
  var retour
  if (_.isArray(args)) {
    // faut ajouter message en 1er argument et le passer à util.format
    retour = util.format.apply(null, args.unshift(message));
  } else {
    // pas la peine de bosser pour rien
    if (arguments.length < 2) retour = message
    // on transmet tel quel
    else retour = util.format.apply(null, arguments);
  }

  return retour
}

/**
 * Idem JSON.stringify mais sans planter, en cas de ref circulaire sur une propriété on renvoie quand même les autres
 * (avec le message d'erreur de JSON.stringify sur la propriété à pb)
 * @memberOf tools
 * @param obj
 * @param {number} [indent] Le nb d'espaces d'indentation
 * @returns {string}
 */
tools.stringify = function(obj, indent) {
  var buffer;

  if (obj) {
    // ça peut planter en cas de ref circulaire
    try {
      buffer = indent ? JSON.stringify(obj, null, indent):JSON.stringify(obj);
    } catch (error) {
      // on tente une construction à la static pour chacun des 1ers niveaux
      var pile = [];
      _.each(obj, function(value, key) {
        buffer = '"' + key + '":'
        try {
          buffer += indent ? JSON.stringify(value, null, indent):JSON.stringify(value);
        } catch (error) {
          buffer += '"stringifyError : ' + error.toString() +'"';
        }
        pile.push(buffer)
      });
      buffer = '{' +pile.join(',\n') +'}';
    }
  }
  return buffer;
}

/**
 * Elimine les tags html d'une string
 * @memberOf tools
 * @param {string} source
 * @returns {string}
 */
tools.stripTags = function (source) {
  return source.replace(/(<([^>]+)>)/ig,"");
}

/**
 * Converti un timestamp ou un chaine en objet Date
 * @memberOf tools
 * @param {number|string} value Un timestamp (en ms ou s) ou une chaine ('DD/MM/YYYY' ou ISO_8601)
 * @returns {Date} L'objet Date ou undefined si la conversion a échoué (value invalide)
 */
tools.toDate = function (value) {
  var buffer
  if (value > 0) {
    // c'est un timestamp
    var ts = parseInt(value, 10)
    if (ts < 11001001001) ts = ts * 1000 // c'était des s, on passe en ms
    // 11001001001 est arbitraire, correspond à 1970 en ms et 2318 en s)
    buffer = new Date(ts)
  } else {
    buffer = moment(value, ['DD/MM/YYYY', moment.ISO_8601], true)
    if (buffer.isValid()) buffer = buffer.utc().toDate()
    else buffer = undefined
  }

  return buffer
}

/**
 * Formate un objet Date en DD/MM/YYYY
 * @memberOf tools
 * @param {Date} date
 * @returns {string} Le jour au format DD/MM/YYYY
 */
tools.toJour = function (date) {
  return moment(date).format('DD/MM/YYYY')
}

/**
 * Update object en y ajoutant toutes les propriétés de addition
 * @memberOf tools
 * @param object
 * @param addition
 */
tools.update = function(object, addition) {
  Object.getOwnPropertyNames(addition).forEach(function(property) {
    Object.defineProperty(
        object,
        property,
        Object.getOwnPropertyDescriptor(addition, property)
    );
  });
}

/**
 * Update object en y ajoutant toutes les propriétés de default qui n'existait pas dans object
 * (Attention, c'est récursif sur toutes les propriétés qui sont des objets)
 * @memberOf tools
 * @param object
 * @param defaultValues
 */
tools.complete = function(object, defaultValues) {
  function completeObj(obj, values) {
    _.each(values, function(value, key) {
      if (!obj[key]) obj[key] = value
      else if (_.isObject(obj[key]) && _.isObject(value)) completeObj(obj[key], value)
    })
  }
  if (object instanceof Object && defaultValues instanceof Object) completeObj(object, defaultValues)
}

module.exports = tools
