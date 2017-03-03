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
const config = require('./config')
const configCheck = require('./configCheck')
const sesatheques = require('sesatheque-client/src/sesatheques')
const {exists, addSesatheque} = sesatheques

module.exports = function boot (beforeBootstrapCb, options) {
  const logger = anLog(config.application.name)
  if (!options) options = {}
  options.root = __dirname
  // appel du module lassi qui met en global une variable lassi
  require('lassi')(options)

  global.isProd = !options.cli && config.application.staging === 'prod'

  // nos loggers
  logger("Démarrage de l'application avec l'environnement " + config.application.staging)

  // Si on veut passer un préfixe à sesalabSso, ou si d'autres components veulent la config
  // avant que lassi n'affecte ça et que $settings ne soit dispo, faut le mettre en global dès maintenant
  global.app = {settings: config}

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
    if (Array.isArray(config.sesatheques)) config.sesatheques.forEach((s) => addSesatheque(s.baseId, s.baseUrl))
    else logger.error('config.sesatheques non-conforme (doit être un tableau de {baseId, baseUrl})')
  } else {
    logger('pas d’autre sesatheque connue mise en configuration')
  }
  // les déclarations de nos components
  require('./main')
  require('./personne')
  require('./ressource')
  require('./update')
  require('./auth')
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
  var sesatheque = lassi.component('sesatheque', dependancies)

  // utile pour des modules npm qui voudrait ajouter des services sans définir de composants pour autant
  // avec app.service('$newService', function () {…})
  // ou app.controller('path', function () {this.get('path', function (context) {…} })
  global.app = sesatheque

  beforeBootstrapCb(lassi, sesatheque, dependancies)
  // si le beforeBootstrapCb n'a pas ajouté de logger en global, on en met un inoffensif ici
  if (!global.log) global.log = () => undefined

  // vérif de config au démarrage
  lassi.on('startup', function () {
    // console.log('evt startup')
    configCheck(config)
    if (options.afterBootCallback) options.afterBootCallback()
  })

  // et on lance le boot
  sesatheque.bootstrap()
}
