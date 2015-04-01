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

var tools = {}

/**
 * Update object en y ajoutant toutes les propriétés de addition
 * @param object
 * @param addition
 * @returns {object}
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
 * Fusionne les nouvelles valeurs avec les propriétés de l'objet (en profondeur)
 * (concatène si les deux propriétés sont des tableaux, en virant d'éventuels doublons,
 * fusionne si c'est deux objets et écrase les anciennes valeurs sinon)
 * @param {Object} object L'objet source
 * @param {Object} newValues Les valeurs à fusionner
 */
tools.merge = function(object, newValues) {
  function mergeArray(arDest, arSrc) {
    var s, d;
    for (s = 0; s < arSrc.length; s++) {
      for (d = 0; d < arDest.length; d++) {
        if (_.equals(arSrc[s], arDest[d])) break;
        else if (d === arDest.length - 1) arDest.push(arSrc[s]);
      }
    }
  }
  function mergeObj(obj, values) {
    if (values instanceof Object) _.each(values, function(value, key) {
      if (_.isArray(value) && _.isArray(obj[key])) mergeArray(obj[key], value);
      else if (_.isObject(value) && _.isObject(obj[key])) mergeObj(obj[key], value);
      else obj[key] = value;
    })
  }
  mergeObj(object, newValues);
}

/**
 * Clone un objet
 * @param object
 * @returns {object}
 */
tools.clone = function(object) {
  var copy = Object.create(Object.getPrototypeOf(object));
  tools.update(copy, object);

  return copy;
}

/**
 * Elimine les tags d'une string
 * @param {string} source
 * @returns {string}
 */
tools.stripTags = function (source) {
  return source.replace(/(<([^>]+)>)/ig,"");
}

/**
 * Vire les espaces et les caractères de contrôle d'une chaine
 * @see http://unicode-table.com/en/
 * @param {string} source La chaîne à nettoyer
 * @returns {string} La chaîne nettoyée
 */
tools.sanitizeHashKey = function(source) {
  return source.replace(/[\x00-\x20\x7F-\xA0]/, '');
}

/**
 * Idem JSON.stringify mais en cas de ref circulaire sur une propriété on renvoie quand même les autres
 * (avec le message d'erreur de JSON.stringify sur la propriété à pb)
 * @param obj
 * @param {number} indent Le nb d'espaces d'indentation
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
 * Vérifie qu'une valeur est entière dans l'intervalle donné et recadre sinon (avec un message dans le log d'erreur)
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
 * Génère le code html d'un lien
 * @param route La route (après "ressources/", cf config.routes)
 * @param texte Le texte à afficher
 * @param {string|array} [args] Des arguments à ajouter à la route (séparateur slash)
 * @returns {string} Le code html du tag a
 */
tools.link = function (route, texte, args) {
  if (args) {
    if (_.isArray(args)) route += '/' +args.join('/')
    else route += '/' +args
  }

  return '<a href="' +route +'">' +texte +'</a>'
}

module.exports = tools
