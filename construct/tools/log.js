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

'use strict';

/**
 * Nos loggers maison
 * @todo utiliser https://www.npmjs.org/package/winston
 * @todo utiliser https://nodejs.org/api/util.html#util_util_debuglog_section
 */

var fs = require('fs')
var moment = require('moment')
var _ = require('lodash')
var config = require('../../config/index') // jshint ignore:line
var tools = require('./index') // jshint ignore:line

var _lassi = (typeof GLOBAL.lassi === 'undefined') ? console : GLOBAL.lassi

/**
 * une pile pour les streams que l'on créé (pour les fermer au shutdown)
 * @type {stream.Writable[]}
 */
var streamsQuiet = []
var streamsVerbose = []

/**
 * Retourne une writeStream sur le fichier passé en arguments (qui sera ouvert dans le dossier de log défini dans la conf)
 * @param log Nom du log (sans dossier parent)
 * @returns {stream.Writable}
 */
function getLogStream(log, verbose) {
  var file = config.logs.dir +'/' +log
  var options = {'flags': 'a', mode:'0644'}
  var stream
  try {
    stream = fs.createWriteStream(file, options)
    if (stream) {
      if (verbose) {
        streamsVerbose.push(stream)
        stream.write(getPrefix() +'log opened by pid ' +process.pid +'\n')
      } else {
        streamsQuiet.push(stream)
      }
      _lassi.log('app', 'ouverture du log ' +file)
    } else {
      _lassi.log('app', 'ouverture du log ' +file +' KO')
    }
  } catch(error) {
    _lassi.log('app', "ERROR : impossible d'ouvrir " +file)
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

var env = process.env.NODE_ENV || 'dev';


/** 
 * Les messages à exclure
 * (une valeur à true excluera les debug de ce type dans le log de debug) 
 */
var exclusions = {}

/**
 * Fonction qui ne fait rien en prod, redéfinie plus loin pour le dev (pour ecrire dans la console)
 */
var log // jshint ignore:line
// (log étant défini en global dans la conf il râle si on le redéfini)

/**
 * Fonction qui ne fait rien en prod, redéfinie plus loin pour le dev (pour ecrire dans dev.log)
 */
var logDebug

function getPrefix() {
  return '[' + moment().format("YYYY-MM-DD HH:mm:ss.SSS") +'] '
}

/**
 * Formate le message et l'envoie dans un log ou en console (si stream est null)
 * @param message
 * @param objectToDump
 * @param filter
 * @param stream
 */
function out(message, objectToDump, filter, stream, options) {
  if (!filter || !exclusions[filter]) {
    // si erreur on veut toute la pile, qui contient aussi message.toString() en 1er
    if (message instanceof Error) message = message.stack + '\n'
    if (objectToDump) {
      if (objectToDump instanceof Error) message += '\n' +objectToDump.stack + '\n'
      else {
        var dump = tools.stringify(objectToDump)
        var max = options && options.max || 200
        if (dump.length > max) dump = dump.substr(0, max) + '…'
        message += '\n' +dump  + "\n";
      }
    }
    message = getPrefix() +message
    if (!stream) console.log(message)
    else stream.write(message + "\n")
  }
}

if (env !== 'production' && config.logs.debug) {
  // notre stream vers dev.log
  debugOutputStream = getLogStream(config.logs.debug, true)

  /**
   * Écrit dans dev.log, pour raconter sa vie ou envoyer des objets
   * @param message
   * @param objectToDump
   * @param filter
   */
  logDebug = function(message, objectToDump, filter, options) {
    out(message, objectToDump, filter, debugOutputStream, options)
  }

  /**
   * Écrit en console
   * @param message
   * @param objectToDump
   * @param filter
   * @param options
   */
  log = function(message, objectToDump, filter, options) { // jshint ignore:line
    // (log étant défini en global dans la conf jshint il râle si on le redéfini)
    out(message, objectToDump, filter, null, options)
  }

  if (config.logs.debugExclusions) {
    config.logs.debugExclusions.forEach(function (filter) {
      exclusions[filter] = true
    })
  }

  _lassi.log('app', "fonction de log activée avec l'environnement : " +env)

} else {
  logDebug = function() {};
  log = function () {} // jshint ignore:line
  _lassi.log('app', "fonction log désactivée avec l'environnement : " +env)
}

log.debug = logDebug

if (config.logs.perf) {
  perfOutputStream = getLogStream(config.logs.perf)
  log.perf = function (context, strToAdd) {
    if (context.perf) {
      if (context.perf.msg) context.perf.msg += '\t'
      context.perf.msg += strToAdd +' ' +log.getElapsed(context.perf.start)
    }
  }
  log.perf.out = function (context) {
    if (context.perf) {
      log.perf(context, 'end')
      out(context.method +' ' +context.request.originalUrl +' ' +(context.status||'000') +'\t' +context.perf.msg, null, null, perfOutputStream)
    }
  }
} else {
  log.perf = function () {}
}

// on ajoute nos fct comme méthodes de la fct principale exportée

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
 * Ajoute un message (avec éventuellement le dump d'un objet) dans le log d'erreur
 * @param message
 * @param objectToDump
 * @param filter
 */
log.error = function (message, objectToDump, filter) {
  out(message, objectToDump, filter, errorOutputStream)
}

/**
 * Ajoute un message (avec éventuellement le dump d'un objet) dans le log d'erreur de données
 * @param message
 * @param objectToDump
 * @param filter
 */
log.errorData = function (message, objectToDump, filter) {
  out(message, objectToDump, filter, errorDataOutputStream)
}

/**
 * Active un filtre (le créé si besoin)
 */
log.exclude = function (filter) {
  exclusions[filter] = true
}

/**
 * Désactive un filtre
 */
log.include = function (filter) {
  exclusions[filter] = false
}

/**
 * Et on fermera nos streams au shutdown
 */
if (_lassi.on) {
  _lassi.on('shutdown', function () {
    _lassi.log('app', 'shutdown event in log')

    if (streamsQuiet.length) {
      _.each(streamsQuiet, function (stream) {
        stream.end()
      })
    }
    if (streamsVerbose.length) {
      _.each(streamsVerbose, function (stream) {
        stream.end(getPrefix() +'log closed by pid ' +process.pid +' on shutdown\n', this)
      })
    }
  })
}

module.exports = log
