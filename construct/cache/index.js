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

/** Le délai de passage du ramasse miettes en s (peut être précisé dans la conf du cacheComponent, 10min par défaut) */
var purgeDelay = 600

/** Le ttl par défaut, en s (peut être précisé dans la conf du cacheComponent, 10min par défaut) */
var defaultTTL = 600

var timerId

var cacheComponent = lassi.Component();

var logCache

cacheComponent.initialize = function(next) {
  // l'export de notre config/index.js
  var config = this.application.settings

  // notre fct de log des entrées / sorties du cache
  if (config.logs && config.logs.cacheEntries) {
    logCache = function (msg, obj) {
      log.dev(msg, obj)
    }
  } else {
    logCache = function (){}
  }

  if (config.components && config.components.cache && config.components.cache.ttl) {
    cacheComponent.setDefaultTTL(config.components.cache.defaultTTL)
    log('ttl du cache fixé à ' +defaultTTL)
  }

  if (config.components && config.components.cache && config.components.cache.purgeDelay) {
    cacheComponent.setPurgeDelay(config.components.cache.purgeDelay +'s')
    log('délai de passage du ramasse miette du cache fixé à ' +purgeDelay +'s')
  }

  next()
}

/**
 * Passe en revue les clés stockées et efface celles qui ont expiré
 * @private
 */
function purge() {
  logCache( 'start purge cache')
  var now = (new Date()).getTime()
  _.each(expires, function(ts, key) {
    if (ts < now) {
      delete expires[key]
      delete hashtable[key]
      logCache( key +' expired & purge')
    }
  })
  // on se rappelera nous-même
  timerId = setTimeout(purge, purgeDelay * 1000)
}

/**
 * Modifie le délai de passage du ramasse miettes (10 min par défaut)
 * Ça déclenche un passage s'il y en avait un en attente
 * @param delay en s, sera recadré dans l'intervalle 60-3600 s'il en sort
 */
cacheComponent.setPurgeDelay = function (delay) {
  purgeDelay = encadre(delay, 60, 3600, 'délai de passage du ramasse miettes du cache')
  if (timerId) {
    clearTimeout(timerId)
    purge()
  }
}

/**
 * Affecte la valeur par défaut du ttl (ça lancera une purge, sauf si elle est déjà en cours)
 * @param ttl
 */
cacheComponent.setDefaultTTL = function (ttl) {
  defaultTTL = encadre(ttl, 5, 3600, 'ttl par défaut')
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
cacheComponent.get = function (key) {
  var now = (new Date()).getTime()
  var value
  if (arguments.length === 0) throw new Error("La fonction cache.get réclame un argument")

  // on transforme la clé si besoin
  if (_.isArray(key)) key = key.join('_')

  if (expires[key]) {
    if (expires[key] > now) {
      value = hashtable[key]
      logCache( 'cache ' +key +' ok')
    } else {
      // trop vieux, on purge tout de suite
      logCache( 'cache ' +key +' too old => removed')
      delete expires[key]
      delete hashtable[key]
    }
  } else logCache(key +' pas en cache')
  /* logCache( 'cache.get ' +key +(expires[key] ?
      ' exists ' +(expires[key] < now ? 'too old': 'ok'):" doesn't exists"), value) */

  return value
}

/**
 * Stocke une valeur en cache
 * @param {String|array} key La clé (si array on concatène avec '_')
 * @param value La valeur à stocker (efface l'entrée en cache si undefined)
 * @param {Number} ttl [optional] La durée de vie en s (600s par défaut)
 * @returns {undefined}
 */
cacheComponent.set = function (key, value, ttl) {
  var now = (new Date()).getTime() // en milisecondes
  if (arguments.length <2) throw new Error("cache.set réclame au moins deux arguments")

  // si c'est le 1er appel on déclenche la purge périodique
  if (!timerId) timerId = setTimeout(purge, purgeDelay)

  // on transforme la clé si besoin
  if (_.isArray(key)) key = key.join('_')

  ttl = ttl || defaultTTL
  if (value === undefined) {
    logCache( 'cache ' +key +' removed')
    delete expires[key]
    delete hashtable[key]
  } else {
    logCache( 'cache ' +key +' set')
    hashtable[key] = value
    expires[key] = now + (ttl*1000)
    //logCache( 'cache.set ' +key +' (' +ttl +') ', value)
  }
}

module.exports = cacheComponent

/**
 * Vérifie qu'une valeur est entière dans l'intervalle donné et recadre sinon (avec un message dans le log d'erreur)
 * @param int La valeur à contrôler
 * @param min Le minimum exigé
 * @param max Le maximum exigé
 * @param label Un label pour le message d'erreur (qui indique ce qui a été recadré)
 * @returns {Integer}
 */
function encadre(int, min, max, label) {
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