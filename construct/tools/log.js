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
var config = require('../../config/index') // jshint ignore:line
var tools = require('./index') // jshint ignore:line

// les streams vers nos logs, celui de dev est ouvert plus loin si on est en dev
var debugOutputStream
// ces logs dans tous les cas
/** un log d'erreur actif en prod */
var errorOutputStream = fs.createWriteStream(config.logs.error, {'flags': 'a'});
/** un log spécifique pour les erreurs liées à des datas incohérentes */
var errorDataOutputStream = fs.createWriteStream(config.logs.errorData, {'flags': 'a'});
/** un log pour mesure de performances */
var perfOutputStream

var env = process.env.NODE_ENV || 'development';

if (typeof lassi === 'undefined') var lassi = false

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
        if ((!options || !options.noTrim) && dump.length > 200) dump = dump.substr(0, 200) + '…'
        message += '\n' +dump  + "\n";
      }
    }
    message = '[' + moment().format("YYYY-MM-DD HH:mm:ss.SSS") +'] ' +message
    if (!stream) console.log(message)
    else stream.write(message + "\n")
  }
}

if (env !== 'production' && config.logs.debug) {
  // notre stream vers development.log
  debugOutputStream = fs.createWriteStream(config.logs.debug, {'flags': 'a'})

  /**
   * Écrit dans development.log, pour raconter sa vie ou envoyer des objets
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
   */
  log = function(message, objectToDump, filter) { // jshint ignore:line
    // (log étant défini en global dans la conf jshint il râle si on le redéfini)
    out(message, objectToDump, filter)
    /* console.log(message)
    console.log(objectToDump)*/
  }

  if (config.logs.debugExclusions) {
    config.logs.debugExclusions.forEach(function (filter) {
      exclusions[filter] = true
    })
  }

  if (lassi) lassi.log('app', "fonction de log activée avec l'environnement : " +env)

} else {
  logDebug = function() {};
  log = function () {} // jshint ignore:line
  if (lassi) lassi.log('app', "fonction log désactivée avec l'environnement : " +env)
}

log.debug = logDebug

if (config.logs.perf) {
  if (lassi) lassi.log('app', 'log des perfs dans ' +config.logs.perf)
  perfOutputStream = fs.createWriteStream(config.logs.perf, {'flags': 'a'})
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
 * @param {number} start Passer le top de départ (ou 0 pour récupérer un top de départ)
 */
log.getElapsed = function (start) {
  start = start || 0

  return (new Date()).getTime() -start
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

module.exports = log
