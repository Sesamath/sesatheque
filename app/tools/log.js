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

/**
 * module log avec ses nos loggers maison
 * @todo utiliser https://www.npmjs.org/package/winston
 * @todo utiliser https://nodejs.org/api/util.html#util_util_debuglog_section
 */

var fs = require('fs')
var moment = require('moment')
var _ = require('lodash')
var config = require('../config') // jshint ignore:line
var tools = require('./index') // jshint ignore:line
var applog = require('an-log')(config.application.name)

var _lassi = (typeof GLOBAL.lassi === 'undefined') ? console : GLOBAL.lassi

/**
 * une pile pour les streams que l'on créé (pour les fermer au shutdown)
 * @private
 * @type {stream.Writable[]}
 */
var streamsQuiet = []
var streamsVerbose = []

/**
 * Retourne une writeStream sur le fichier passé en arguments (qui sera ouvert dans le dossier de log défini dans la conf)
 * @private
 * @param {string}  log       Nom du log (sans dossier parent)
 * @param {boolean} [verbose] Annonce l'ouverture et la fermeture du fichier dans le fichier
 * @returns {stream.Writable}
 */
function getLogStream (log, verbose) {
  var file = config.logs.dir + '/' + log
  var options = {'flags': 'a', mode: '0644'}
  var stream
  try {
    stream = fs.createWriteStream(file, options)
    if (stream) {
      if (verbose) {
        streamsVerbose.push(stream)
        stream.write(getPrefix() + 'log opened by pid ' + process.pid + '\n')
      } else {
        streamsQuiet.push(stream)
      }
      applog('app', 'ouverture du log ' + file)
    } else {
      applog('app', 'ouverture du log ' + file + ' KO')
    }
  } catch (error) {
    applog('app', "ERROR : impossible d'ouvrir " + file)
  }

  return stream
}

// les streams vers nos logs, celui de dev est ouvert plus loin si on est en dev
var debugOutputStream
// ces logs dans tous les cas
/** un log d'erreur actif en prod */
var errorOutputStream = getLogStream(config.logs.error, true)
/** un log spécifique pour les erreurs liées à des datas incohérentes */
var errorDataOutputStream = getLogStream(config.logs.errorData, true)
/** un log pour mesure de performances */
var perfOutputStream

var env = process.env.NODE_ENV || 'dev'

/**
 * Les messages à exclure
 * (une valeur à true excluera les debug de ce type dans le log de debug)
 * @private
 */
var exclusions = {}

/**
 * Retourne le préfixe avec la date courante entre crochet
 * @private
 * @returns {string}
 */
function getPrefix () {
  return '[' + moment().format('YYYY-MM-DD HH:mm:ss.SSS') + '] '
}

/**
 * Formate le message et l'envoie dans un log ou en console (si stream est null)
 * @private
 * @param {string|object} message
 * @param {Object}        [objectToDump] Un objet éventuel (qui sera rendu en json avec indentation de n si options.indent=n)
 * @param {string}        filter         Un nom de filtre pour exclusion éventuelle
 * @param {writeStream}   stream         stream vers le fichier de log
 * @param {Object}        [options]      Passer une propriété
 *                                          indent pour indenter objectToDump du nombre d'espaces demandés,
 *                                          max pour modifier la limite de la sortie (200 par défaut)
 */
function out (message, objectToDump, filter, stream, options) {
  if (!options) options = {}
  if (!filter || !exclusions[filter]) {
    // si erreur on veut toute la pile, qui contient aussi message.toString() en 1er
    if (message instanceof Error) message = message.stack + '\n'
    if (objectToDump) {
      if (objectToDump instanceof Error) message += '\n' + objectToDump.stack + '\n'
      else {
        var dump = tools.stringify(objectToDump, options.indent)
        var max = options && options.max || 200
        if (dump.length > max) dump = dump.substr(0, max) + '…'
        message += '\n' + dump + '\n'
      }
    }
    message = getPrefix() + message
    if (stream) stream.write(message + '\n')
    else console.log(message)
  }
}
// log
if (env === 'prod') {
  GLOBAL.log = function () { } // jshint ignore:line
  applog('app', "fonction log désactivée avec l'environnement : " + env)
} else {
  /**
   * Méthode qui écrit en console si l'on est pas en prod (ne fait rien en prod)
   * @service log
   * @type {function}
   * @param {string|object} message
   * @param {Object}        [objectToDump] Un objet éventuel qui sera rendu en json avec indentation
   * @param {string}        filter         Un nom de filtre pour exclusion éventuelle
   * @param {Object}         [options]     Passer une propriété
   *                                         indent pour indenter objectToDump du nombre d'espaces demandés,
   *                                         max pour modifier la limite de la sortie (200 par défaut)
   */
  GLOBAL.log = function (message, objectToDump, filter, options) { // jshint ignore:line
    // (log étant défini en global dans la conf jshint il râle si on le redéfini)
    out(message, objectToDump, filter, null, options)
  }
  applog('app', "fonction de log activée avec l'environnement : " + env)
}

// log.debug
if (config.logs.debug) {
  // notre stream vers debug.log
  debugOutputStream = getLogStream(config.logs.debug, true)

  /**
   * Écrit dans le fichier config.logs.debug s'il est précisé (ne fait rien sinon)
   * @memberOf log
   * @param message
   * @param objectToDump
   * @param filter
   * @param options
   */
  log.debug = function (message, objectToDump, filter, options) {
    out(message, objectToDump, filter, debugOutputStream, options)
  }

  if (config.logs.debugExclusions) {
    config.logs.debugExclusions.forEach(function (filter) {
      exclusions[filter] = true
    })
  }

  applog('app', 'fonction log.debug activée vers ' + config.logs.debug + ", avec l'environnement : " + env)
} else {
  log.debug = function () {}
  applog('app', "fonction log.debug désactivée avec l'environnement : " + env)
}

// log.perf
if (config.logs.perf) {
  perfOutputStream = getLogStream(config.logs.perf)
  out('start log (démarrage appli)', null, null, perfOutputStream)
  /**
   * Ajoute une chaine avec un timer (depuis la réception de la requete) au message de perf courant
   * S'active dans la conf (config.logs.perf), sinon ne fait rien
   * @memberOf log
   * @param response
   * @param strToAdd
   * @param {boolean} [noTimer=false] passer true pour ne pas ajouter la mesure de temps
   */
  log.perf = function (response, strToAdd, noTimer) {
    var timer = !noTimer
    if (response.perf && response.perf.msg) {
      response.perf.msg += '\t' + strToAdd
      if (timer) response.perf.msg += ' ' + log.getElapsed(response.perf.start)
    }
  }
  /**
   * Clos la mesure de perf pour cette requête et écrit dans le log
   * @param {Object} response L'objet response d'express, on traitera response.perf.msg si response.perf existe
   */
  log.perf.out = function (response) {
    if (response.perf) {
      log.perf(response, 'end')
      out((response.statusCode || '000') + '\t' + response.perf.msg, null, null, perfOutputStream)
    }
  }
} else {
  log.perf = function () {}
}

/*
if (config.logs.sql) {
  // pour que ça sorte qqchose, ajouter à node_modules/lassi/classes/entities/EntityQuery.js la ligne
  // if (typeof log !== 'undefined' && log.sql) log.sql(query.toString(), query.args);
  // juste avant l'appel de database.query
  var sqlOutputStream = getLogStream(config.logs.sql)
  log.sql = function (queryString, args) {
    for (var i = 0; i < args.length; i++) {
      queryString = queryString.replace('?', "'' +args[i] +''")
    }
    out(queryString, null, null, sqlOutputStream)
  }
}
*/

// Et les autres méthodes toujours valides

/**
 * Retourne le nb de ms écoulées depuis start
 * @param {number} [start=0] Passer un top de départ (timestamp en ms)
 */
log.getElapsed = function (start) {
  var ts = (new Date()).getTime()
  if (start) ts -= start

  return ts
}

/**
 * Ajoute un message (avec éventuellement le dump d'un objet) dans le log d'erreur (config.logs.error), en dev comme en prod
 * @memberOf log
 * @param message
 * @param objectToDump
 * @param filter
 */
log.error = function (message, objectToDump, filter) {
  out(message, objectToDump, filter, errorOutputStream)
}

/**
 * Ajoute un message (avec éventuellement le dump d'un objet) dans le log d'erreur de données (config.logs.errorData)
 * @memberOf log
 * @param message
 * @param objectToDump
 * @param filter
 */
log.errorData = function (message, objectToDump, filter) {
  out(message, objectToDump, filter, errorDataOutputStream)
}

/**
 * Active un filtre (le créé si besoin)
 * @memberOf log
 * @param {string} filter Le filtre à appliquer (pour exclure les messages qui le contiennent)
 */
log.exclude = function (filter) {
  exclusions[filter] = true
}

/**
 * Désactive un filtre
 * @memberOf log
 * @param {string} filter Le filtre à enlever (les messages qui le contiennent redeviennent actifs)
 */
log.include = function (filter) {
  exclusions[filter] = false
}

// Et on fermera nos streams au shutdown
if (_lassi.on) {
  _lassi.on('shutdown', function () {
    applog('app', 'shutdown event in log')

    if (streamsQuiet.length) {
      _.each(streamsQuiet, function (stream) {
        stream.end()
      })
    }
    if (streamsVerbose.length) {
      _.each(streamsVerbose, function (stream) {
        stream.end(getPrefix() + 'log closed by pid ' + process.pid + ' on shutdown\n', this)
      })
    }
  })
}

module.exports = log
