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

'use strict'
/* global log */
const moment = require('moment')
const util = require('util')

/**
 * Vérifie qu'une valeur est entière dans l'intervalle donné et recadre sinon (avec un message dans le log d'erreur)
 * @memberOf tools
 * @param int La valeur à contrôler
 * @param min Le minimum exigé
 * @param max Le maximum exigé
 * @param label Un label pour le message d'erreur (qui indique ce qui a été recadré)
 * @returns {Integer}
 */
function encadre (int, min, max, label) {
  var value = parseInt(int)
  if (value < min) {
    log.error(label + ' trop petit (' + value + '), on le fixe à ' + min)
    value = min
  }
  if (value > max) {
    log.error(label + ' trop grand (' + value + '), on le fixe à ' + max)
    value = max
  }
  return value
}

/**
 * Garanti que le retour sera du type demandé, mis à defaultValue (lui ne sera pas casté) si falsy
 * @param {*} value
 * @param {string} type string|number|integer|boolean
 * @param {*} defaultValue
 * @return {*}
 */
function ensure (value, type, defaultValue) {
  const needToCast = typeof value !== type // eslint-disable-line valid-typeof
  if (needToCast) {
    switch (type) {
      case 'string':
        value = (value && String(value)) || defaultValue || ''
        break
      case 'number':
        value = (value && Number(value)) || defaultValue || 0
        break
      case 'integer':
        value = (value && Math.round(Number(value))) || defaultValue || 0
        break
      case 'boolean':
        value = Boolean(value)
        break
      default:
        console.error(new Error(`type ${type} non géré`))
    }
  } else if (!value && defaultValue) {
    value = defaultValue
  }
  return value
}

/**
 * Transforme une liste en tableau de mots valides pour des ids ([A-Za-z0-9_\-])
 * @memberOf tools
 * @param {string} list
 * @returns {string[]} la liste des ids récupérés (tous les caractères autres que lettres, chiffres, tiret et underscore ont été virés)
 */
function idListToArray (list) {
  var retour = []
  if (typeof list === 'string') retour = list.match(/([-A-Za-z0-9_]+)/g)
  else log.error(new TypeError('faut me donner un type string'))

  return retour
}

/**
 * Retourne true si l'url contient /api/
 * @memberOf tools
 * @param url
 * @returns {boolean}
 */
function isApi (url) {
  return /^\/api\//.test(url)
}

/**
 * Retourne true si ar1 et ar2 ont autant d'élément tous égaux (comparaison ===)
 * @todo déplacer ça dans sesajstools
 * @param {Array} ar1
 * @param {Array} ar2
 * @return {boolean}
 */
function isSameSimpleArray (ar1, ar2) {
  if (!Array.isArray(ar1) || !Array.isArray(ar2)) throw Error(`Array expected`)
  if (ar1.length !== ar2.length) return false
  return ar1.every((elt, i) => elt === ar2[i])
}

/**
 * Vérif basique que obj est bien une Entity entityName (si entityName n'est pas fourni
 * ça renvoie true si obje est une entity Lassi)
 * @param {Object} obj
 * @param {string} [entityName]
 * @return {boolean}
 */
function isEntity (obj, entityName) {
  if (
    !obj ||
    !obj.definition ||
    !obj.constructor ||
    obj.constructor.name !== 'Entity'
  ) return false
  if (entityName) return obj.definition.name === entityName
  // si on voulait juste savoir si c'était une Entity sans préciser laquelle,
  // avoir un constructor nommé Entity nous suffit
  return true
}

/**
 * Retourne true si l'url concerne un fichier statique
 * (statique i.e. les extensions susceptibles d'exister dans sesatheque, c'est pas exaustif)
 * @memberOf tools
 * @param url
 * @returns {boolean}
 */
function isStatic (url) {
  return /\.(js|css|png|ico|jpg|jpeg|gif)(\?.*)?$/.test(url)
}

/**
 * Retourne true si l'url concerne une url publique (avec /public/ dedans, html ou json)
 * @memberOf tools
 * @param url
 * @returns {boolean}
 */
function isPublic (url) {
  return /\/public\//.test(url)
}
/**
 * Génère le code html d'un lien
 * @memberOf tools
 * @param path Le path (absolu ou relatif)
 * @param texte Le texte à afficher
 * @param {string|Array} [args] Des arguments à ajouter au path (séparateur slash)
 * @returns {string} Le code html du tag a
 */
function link (path, texte, args) {
  if (args) {
    if (Array.isArray(args)) path += args.join('/')
    else path += '/' + args
  }

  return '<a href="' + path + '">' + texte + '</a>'
}

/**
 * Génère le code html d'un lien avec les args en queryString
 * @memberOf tools
 * @param path Le path (absolu ou relatif)
 * @param texte Le texte à afficher
 * @param {Object} [args] Des arguments à ajouter en queryString
 * @returns {string} Le code html du tag a
 */
function linkQs (path, texte, args) {
  if (args) {
    var paires = []
    for (var p in args) {
      if (args.hasOwnProperty(p)) paires.push(p + '=' + encodeURIComponent(args[p]))
    }
    if (paires.length) path += '?' + paires.join('&')
  }

  return '<a href="' + path + '">' + texte + '</a>'
}

/**
 * Remplace les espaces par des underscores et vire les caractères de contrôle d'une chaine (\n compris)
 * @see http://unicode-table.com/en/
 * @memberOf tools
 * @param {string} source La chaîne à nettoyer
 * @returns {string} La chaîne nettoyée
 */
function sanitizeHashKey (source) {
  return source.replace(/ /g, '_').replace(/[\x00-\x20\x7F-\xA0]/, '') // eslint-disable-line no-control-regex
}

/**
 * Vire tous les caractères autres que lettres (non accentuées), chiffres, _ et -
 * @memberOf tools
 * @param source
 * @returns {void|*|{value}|string|XML}
 */
function sanitizeStrict (source) {
  return source.replace(/[^-a-zA-Z0-9_]/, '')
}

/**
 * Incorpore des arguments à un message, façon sprintf
 * pas très intéressant si n arguments, util.format fait la même chose, mais tolère un tableau d'arguments en 2e param
 * @memberOf tools
 * @param {string} message
 * @param {string|Array} args Les arguments, en liste ou en tableau
 * @returns {string}
 */
function strFormat (message, args) {
  var retour
  if (Array.isArray(args)) {
    // faut ajouter message en 1er argument et le passer à util.format
    retour = util.format.apply(null, args.unshift(message))
  } else {
    // pas la peine de bosser pour rien
    if (arguments.length < 2) retour = message
    // on transmet tel quel
    else retour = util.format.apply(null, arguments)
  }

  return retour
}

/**
 * Elimine les tags html d'une string
 * @memberOf tools
 * @param {string} source
 * @returns {string}
 */
function stripTags (source) {
  return source.replace(/(<([^>]+)>)/ig, '')
}

/**
 * Converti un timestamp ou un chaine en objet Date
 * @memberOf tools
 * @param {number|string|Date} value Un timestamp (en ms ou s) ou une chaine ('DD/MM/YYYY' ou ISO_8601)
 * @returns {Date} L'objet Date ou undefined si la conversion a échoué (value invalide)
 */
function toDate (value) {
  if (value instanceof Date) return value
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
function toJour (date) {
  return moment(date).format('DD/MM/YYYY')
}

/**
 * Un assemblage de fonctions utilitaires
 * @service tools
 */
module.exports = {
  encadre,
  ensure,
  idListToArray,
  isApi,
  isEntity,
  isSameSimpleArray,
  isStatic,
  isPublic,
  link,
  linkQs,
  sanitizeHashKey,
  sanitizeStrict,
  strFormat,
  stripTags,
  toDate,
  toJour
}
