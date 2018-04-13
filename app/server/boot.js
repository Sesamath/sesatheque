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
const anLog = require('an-log')
const lassi = require('lassi')
const config = require('./config')
const sesatheques = require('sesatheque-client/src/sesatheques')
const {exists, addSesatheque} = sesatheques
const log = require('./tools/log.js')
const {merge} = require('sesajstools/utils/object')

const appName = config.application.name
const logger = anLog(appName)

/**
 * Boot l'application
 * @param beforeBootstrapCb
 * @param {object} [options] Options qui seront passées à lassi() (@link Lassi)
 * @param {simpleCallback} afterBootCb
 */
function boot (beforeBootstrapCb, options, afterBootCb) {
  if (!options) options = {}
  options.root = __dirname
  // @todo pas de var globale lassi
  // options.noGlobalLassi = true
  const lassiInstance = lassi(options)
  if (options.config) {
    merge(config, options.config)
    // lassi charge en settings ${options.root}/config
    merge(lassiInstance.settings, options.config)
  }

  global.isProd = !options.cli && config.application.staging === 'prod'

  // nos loggers
  logger("Démarrage de l'application avec l'environnement " + config.application.staging)

  /**
   * Gestion des traces
   * Attention, le module long-stack-traces m'a déjà joué des tours avec une erreur qui plante node
   * (reproductible, sur une 404), le désactiver a réglé le problème
   *
   * Pour augmenter les traces, mieux vaut passer à node ces options
   * --stack_trace_limit=100 --stack-size=2048
   */

  // on s'ajoute à la liste si on n'y est pas
  const myBaseId = config.application.baseId
  if (!exists(myBaseId)) addSesatheque(myBaseId, config.application.baseUrl)
  if (config.sesatheques) {
    if (Array.isArray(config.sesatheques)) config.sesatheques.forEach(({baseId, baseUrl}) => addSesatheque(baseId, baseUrl))
    else logger.error('config.sesatheques non-conforme (doit être un tableau de {baseId, baseUrl})')
  } else {
    logger('pas d’autre sesatheque connue mise en configuration')
  }
  // les déclarations de nos components
  require('./main/index')
  require('./personne/index')
  require('./ressource')
  require('../update/index')
  require('./auth/index')
  var dependancies = ['main', 'personne', 'ressource', 'update', 'auth']

  // des modules sup à charger
  if (config.extraModules) {
    config.extraModules.forEach(function (module) {
      logger('ajout du module supplémentaire ' + module)
      require(module)
    })
  }
  if (config.extraDependenciesFirst) {
    config.extraDependenciesFirst.forEach(function (dependency) {
      logger('ajout en premier de la dépendance supplémentaire ' + dependency)
      dependancies.unshift(dependency)
    })
  }
  if (config.extraDependenciesLast) {
    config.extraDependenciesLast.forEach(function (dependency) {
      logger('ajout en dernier de la dépendance supplémentaire ' + dependency)
      dependancies.push(dependency)
    })
  }
  // Notre appli qui sera mise en global (pour que chacun puisse y ajouter ses controleurs ou services)
  // console.log('au boot', dependancies)
  var sesatheque = lassiInstance.component('sesatheque', dependancies)

  // notre fct de log en global
  global.log = log

  beforeBootstrapCb(lassiInstance, sesatheque, dependancies)

  if (afterBootCb) lassiInstance.on('startup', afterBootCb)

  // et on lance le boot
  lassiInstance.bootstrap(sesatheque, function (error) {
    if (error) {
      logger.error('boot failed')
      logger.error(error)
      process.exit()
    }
    logger('end bootstrap')
  })

  return lassiInstance
}

module.exports = boot
