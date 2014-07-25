'use strict';

var _ = require('underscore')._;

/**
 * Notre hashtable de stockage du cache
 * @type {Object}
 */
var hashtable = {}

/**
 * La liste des ttl
 * @type {Object}
 */
var expires = {}

var purgeDelay = 600000

var timerId

var component = lassi.Component();

component.initialize = function(next) {
    next()
}

/**
 * Passe en revue les clés stockées et efface celles qui ont expiré
 * @private
 */
function purge() {
  var now = (new Date()).getTime()
  _.each(expires, function(ts, key) {
    if (ts < now) {
      delete expires[key]
      delete hashtable[key]
    }
  })
  // on se rappelera nous-même
  timerId = setTimeout(purge, purgeDelay)
}

/**
 * Modifie le délai de passage du ramasse miettes (10 min par défaut)
 * Ça déclenche un passage s'il y en avait un en attente
 * @param delay
 */
component.setPurgeDelay = function (delay) {
  purgeDelay = delay
  if (timerId) {
    clearTimeout(timerId)
    purge()
  }
}

/**
 * Retourne une valeur du cache
 * @param {String|array} key La clé (si array on concatène avec '_')
 * @returns {*} La valeur en cache (ou undefined si pas trouvé ou expiré)
 */
component.get = function (key) {
  var now = (new Date()).getTime()
  var value
  if (arguments.length === 0) throw new Error("La fonction cache.get réclame un argument")

  // on transforme la clé si besoin
  if (_.isArray(key)) key = key.join('_')

  if (expires[key] ) {
    if (expires[key] < now) value = hashtable[key]
    else {
      // trop vieux, on purge tout de suite
      delete expires[key]
      delete hashtable[key]
    }
  }

  return value
}

/**
 * Stocke une valeur en cache
 * @param {String|array} key La clé (si array on concatène avec '_')
 * @param value La valeur à stocker (efface l'entrée en cache si undefined)
 * @param {Number} ttl [optional] La durée de vie en ms (10min par défaut)
 * @returns {undefined}
 */
component.set = function (key, value, ttl) {
  var now = (new Date()).getTime()
  if (arguments.length <2) throw new Error("cache.set réclame au moins deux arguments")

  // si c'est le 1er appel on déclenche la purge périodique
  if (!timerId) timerId = setTimeout(purge, purgeDelay)

  // on transforme la clé si besoin
  if (_.isArray(key)) key = key.join('_')

  ttl = ttl || 600000 // 10min par défaut
  if (value === undefined) {
    delete expires[key]
    delete hashtable[key]
  } else {
    hashtable[key] = value
    expires[key] = now + ttl
  }
}

console.log('component cache '+component.constructor.name)

module.exports = component
