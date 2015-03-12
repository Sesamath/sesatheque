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

/**
 * Nos loggers maison
 * @todo utiliser https://www.npmjs.org/package/winston
 */
'use strict';

var fs = require('fs');
var moment = require('moment');
var config = require('../../config/index'); // jshint ignore:line
var tools = require('./index'); // jshint ignore:line
//var _ = require('underscore')._

// les streams vers nos logs, celui de dev est ouvert plus loin si on est en dev
var devOutputStream
// ces logs dans tous les cas
/** un log d'erreur actif en prod */
var errorOutputStream = fs.createWriteStream(config.logs.error, {'flags': 'a'});
/** un log spécifique pour les erreurs liées à des datas incohérentes */
var errorDataOutputStream = fs.createWriteStream(config.logs.errorData, {'flags': 'a'});

var env = process.env.NODE_ENV || 'development';


/** Nos filtres possibles, qui seront ajoutés si besoin par setFilter */
var filters = {}

/**
 * Fonction qui ne fait rien en prod, redéfinie plus loin pour le dev (pour ecrire dans la console)
 */
var logger // jshint ignore:line

/**
 * Fonction qui ne fait rien en prod, redéfinie plus loin pour le dev (pour ecrire dans dev.log)
 */
var logDev

/**
 * Retourne le nb de ms écoulées depuis start
 * @param {number} start Passer le top de départ (ou 0 pour récupérer un top de départ)
 */
function getElapsed(start) {
  return (new Date()).getTime() -start
}

/**
 * Active un filtre (le créé si besoin)
 */
function setFilterOn(filter) {
  filters[filter] = true;
}

/**
 * Désactive un filtre (le créé si besoin)
 */
function setFilterOff(filter) {
  filters[filter] = false;
}

function getDatePrefix() {
  return '[' + moment().format("YYYY-MM-DD HH:mm:ss.SSS") +'] '
}

function addToLog(message, stream) {
  stream.write(message + "\n");
}

function logError(message, filter) {
  // pour ce log on veut toute la pile d'appel
  if (message instanceof Error) message = message.stack
  if (!filter || filters[filter]) {
    addToLog(message, errorOutputStream);
  }
}

function logErrorData(message, filter) {
  if (!filter || filters[filter]) {
    out(message, null)
    addToLog(message, errorDataOutputStream);
  }
}

/**
 * Formate le message et l'envoie dans un log ou en console (si stream est null)
 * @param message
 * @param objectToDump
 * @param filter
 * @param stream
 */
function out(message, objectToDump, filter, stream) {
  if (!filter || filters[filter]) {
    if (message instanceof Error) message = message.toString() +'\n' +message.stack // on veut toute la pile
    else {
      message += "\n";
      if (objectToDump) {
        if (objectToDump instanceof Error) message += '\n' +objectToDump.toString() +objectToDump.stack + '\n'
        else message += '\n' + tools.stringify(objectToDump) + "\n";
      }
    }
    message = getDatePrefix() +message
    if (!stream) console.log(message)
    else addToLog(message, stream);
  }
}

if (env === 'dev') {
  // notre stream vers development.log
  devOutputStream = fs.createWriteStream(config.logs.dev, {'flags': 'a'})

  /**
   * Écrit dans development.log, pour raconter sa vie ou envoyer des objets
   * @param message
   * @param objectToDump
   * @param filter
   */
  logDev = function(message, objectToDump, filter) {
    out(message, objectToDump, filter)
  };

  /**
   * Écrit en console
   * @param message
   * @param objectToDump
   * @param filter
   */
  logger = function(message, objectToDump, filter) {
    // out(message, objectToDump, filter, true)
    console.log(message)
    console.log(objectToDump)
  }

} else {
  logDev = function() {};
  logger = function () {} // jshint ignore:line
}

// on ajoute nos fct comme méthodes de la fct principale exportée
logger.getElapsed = getElapsed
logger.dev = logDev
logger.error = function (message, objectToDump, filter) {
  out(message, objectToDump, filter)
}
logger.errorData = logErrorData
logger.setFilterOn = setFilterOn
logger.setFilterOff = setFilterOff

module.exports = logger
