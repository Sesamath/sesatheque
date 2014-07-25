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
 * Retourne une valeur du cache si appelé avec un seul argument
 * ou met une valeur en cache si appelé avec 2 ou 3 arguments
 * @param {String|array} key La clé (si array de string on concatène avec '_')
 * @param value La valeur ou undefined si pas trouvé ou expiré
 * @param ttl La durée de vie en ms (10min par défaut)
 * @returns {*}
 */
module.exports = function (key, value, ttl) {
  var now = (new Date()).getTime()
  var retour
  if (arguments.length === 0) throw new Error("La fonction cache réclame au moins un argument")

  // si c'est le 1er appel on déclenche la purge périodique
  if (!timerId) timerId = setTimeout(purge, purgeDelay)

  // on transforme la clé si besoin
  if (_.isArray(key)) key = key.join('_')

  // get ?
  if (arguments.length === 1) {
    if (expires[key] ) {
      if (expires[key] < now) retour = hashtable[key]
      else {
        // trop vieux, on purge
        delete expires[key]
        delete hashtable[key]
      }
    }

  // ou set ?
  } else {
    ttl = ttl || 600000 // 10min par défaut
    hashtable[key] = value
    expires[key] = now + ttl
    retour = true
  }

  return retour
}
