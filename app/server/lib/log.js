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

const fs = require('fs')
const moment = require('moment')
const config = require('../config')
const sjt = require('sesajstools')

/**
 * Retourne une writeStream sur le fichier passé en arguments (qui sera ouvert dans le dossier de log défini dans la conf)
 * @private
 * @param {string}  log       Nom du log (sans dossier parent)
 * @param {boolean} [verbose] Annonce l'ouverture et la fermeture du fichier dans le fichier
 * @returns {stream.Writable}
 */
function getLogStream (log, verbose) {
  const file = `${logDir}/${log}`
  const options = {'flags': 'a', mode: '0644'}
  let stream
  try {
    stream = fs.createWriteStream(file, options)
    if (stream) {
      if (verbose) {
        streamsVerbose.push(stream)
        stream.write(getPrefix() + 'log opened by pid ' + process.pid + '\n')
      } else {
        streamsQuiet.push(stream)
      }
    } else {
      console.error(Error(`impossible d’ouvrir le log ${file}`))
    }
  } catch (error) {
    console.error(`impossible d’ouvrir le log ${file}`, error)
  }

  return stream
}

/**
 * Formate le message et l'envoie dans un log ou en console (si stream est null)
 * @private
 * @param {string|Error} message
 * @param {Object}       [objectToDump] Un objet éventuel (qui sera rendu en json avec indentation de n si options.indent=n)
 * @param {string}       filter         Un nom de filtre pour exclusion éventuelle
 * @param {writeStream}  stream         stream vers le fichier de log
 * @param {Object}       [options]      Passer une propriété
 *                                        indent pour indenter objectToDump du nombre d'espaces demandés,
 *                                        max pour modifier la limite de la sortie (200 par défaut)
 */
function out (message, objectToDump, filter, stream, options) {
  if (!options) options = {}
  if (!filter || !exclusions[filter]) {
    let msg // le message qu'on enverra en console
    // si erreur on veut toute la pile, qui contient aussi message.toString() en 1er
    if (message instanceof Error) {
      if (message.logged) return // déjà traité précédemment
      message.logged = true
      msg = message.stack + '\n'
    } else if (typeof message === 'string') {
      msg = message
    } else {
      // y'a eu un pb avant l'appel de cette fct, on génère une erreur pour récupérer la pile d'appel
      try {
        throw new Error('erreur inconnue passé à log')
      } catch (error) {
        msg = error.stack + '\n'
      }
    }
    if (objectToDump) {
      if (objectToDump instanceof Error) {
        msg += '\n' + objectToDump.stack + '\n'
      } else if (typeof objectToDump === 'function') {
        msg += '\n' + objectToDump.toString() + '\n'
      } else {
        let dump = sjt.stringify(objectToDump, options.indent)
        if (dump) {
          const max = (options && options.max) || 200
          if (dump.length > max) dump = dump.substr(0, max) + '…'
          msg += '\n' + dump + '\n'
        } else {
          console.error('pb dans log, objectToDump existe mais donne undefined', objectToDump)
        }
      }
    }
    msg = getPrefix() + msg
    if (stream) stream.write(msg + '\n')
    else console.log(msg)
  }
}

/**
 * Retourne le préfixe avec la date courante entre crochet
 * @private
 * @returns {string}
 */
const getPrefix = () => `[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] `

let disabled = false

// si le dossier de log n'existe pas on le crée
const logDir = config.logs.dir
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, 0o775)

/**
 * une pile pour les streams que l'on créé (pour les fermer au shutdown)
 * @private
 * @type {stream.Writable[]}
 */
const streamsQuiet = []
const streamsVerbose = []

// les streams vers nos logs, celui de dev est ouvert plus loin si on est en dev
let debugOutputStream
// ces logs dans tous les cas
/** un log d'erreur actif en prod */
const errorOutputStream = getLogStream(config.logs.error, true)
/** un log spécifique pour les erreurs liées à des datas incohérentes */
const errorDataOutputStream = getLogStream(config.logs.dataError, true)
/** un log pour mesure de performances */
let perfOutputStream

/**
 * Les messages à exclure
 * (une valeur à true excluera les debug de ce type dans le log de debug)
 * @private
 */
const exclusions = {}

/**
 * Méthode qui écrit en console si l'on est pas en prod (ne fait rien en prod)
 * @service log
 * @type {function}
 * @param {string|object} message
 * @param {Object}        [objectToDump] Un objet éventuel qui sera rendu en json avec indentation
 * @param {string}        [filter]       Un nom de filtre pour exclusion éventuelle
 * @param {Object}        [options]      Passer les propriétés facultatives
 *                                         indent pour indenter objectToDump du nombre d'espaces demandés,
 *                                         max pour modifier la limite de la sortie (200 par défaut)
 */
function log (message, objectToDump, filter, options) {
  if (disabled) return
  // (log étant défini en global dans la conf jshint il râle si on le redéfini)
  if (arguments.length === 3 && typeof filter === 'object') {
    options = filter
    filter = 'info'
  }
  out(message, objectToDump, filter, null, options)
}

/**
 * Ajoute un message (avec éventuellement le dump d'un objet) dans le log d'erreur de données (config.logs.dataError)
 * @memberOf log
 * @param message
 * @param objectToDump
 * @param filter
 */
log.dataError = function dataError (message, objectToDump, filter) {
  // on peut être utilisé comme callback
  if (arguments.length === 0) return
  // pour les dataError, on met un max élevé s'il est pas précisé
  if (!filter) filter = {}
  if (!filter.max) filter.max = 50000
  out(message, objectToDump, filter, errorDataOutputStream, {max: 2000})
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
   * @param [filter]
   * @param options
   */
  log.debug = function debug (message, objectToDump, filter, options) {
    if (arguments.length === 3 && typeof filter === 'object') {
      options = filter
      filter = 'info'
    }
    out(message, objectToDump, filter, debugOutputStream, options)
  }

  if (config.logs.debugExclusions) {
    config.logs.debugExclusions.forEach(function (filter) {
      exclusions[filter] = true
    })
  }
} else {
  log.debug = function () {}
}

/**
 * Rend log() muet
 */
log.disable = () => { disabled = true }
/**
 * Rend log() bavard
 */
log.enable = () => { disabled = false }

/**
 * Active un filtre (le créé si besoin)
 * @memberOf log
 * @param {string} filter Le filtre à appliquer (pour exclure les messages qui le contiennent)
 */
log.exclude = (filter) => { exclusions[filter] = true }

/**
 * Ajoute un message (avec éventuellement le dump d'un objet) dans le log d'erreur (config.logs.error)
 * @name error
 * @memberOf log
 * @param message
 * @param objectToDump
 * @param filter
 */
log.error = function logError (message, objectToDump, filter) {
  // on peut être utilisé comme callback
  if (arguments.length === 0) return
  if (typeof message === 'string' || message instanceof Error) {
    out(message, objectToDump, filter, errorOutputStream, {max: 2000})
  } else {
    // bizarre, on génère une vraie erreur avec sa trace
    out(new Error(`log.error appelé sans message ni erreur, avec un type ${typeof message} :`), message, filter, errorOutputStream, {max: 2000})
    if (objectToDump) out('l’objet passé initialement', objectToDump, filter, errorOutputStream, {max: 2000})
  }
}

/**
 * log.error si error, rien sinon
 * @memberOf log
 * @param {Error|string} [error]
 */
log.ifError = (error) => error && log.error(error)

/**
 * Désactive un filtre
 * @memberOf log
 * @param {string} filter Le filtre à enlever (les messages qui le contiennent redeviennent actifs)
 */
log.include = (filter) => { exclusions[filter] = false }

// log.perf
if (config.logs.perf) {
  const getElapsed = (start = 0) => Date.now() - start
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
    const timer = !noTimer
    if (response.perf && response.perf.msg) {
      response.perf.msg += '\t' + strToAdd
      if (timer) response.perf.msg += ' ' + getElapsed(response.perf.start) + 'ms'
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
  const sqlOutputStream = getLogStream(config.logs.sql)
  log.sql = function (queryString, args) {
    for (let i = 0; i < args.length; i++) {
      queryString = queryString.replace('?', "'' +args[i] +''")
    }
    out(queryString, null, null, sqlOutputStream)
  }
}
*/

// Et on fermera nos streams au shutdown
if (global.lassi) {
  global.lassi.on('shutdown', function () {
    streamsQuiet.forEach(stream => stream.end())
    if (streamsVerbose.length) {
      const msg = `${getPrefix()} log closed by pid ${process.pid} on shutdown\n`
      streamsVerbose.forEach(stream => stream.end(msg))
    }
  })
}

module.exports = log
