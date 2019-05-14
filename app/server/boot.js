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

const lassi = require('lassi')
const config = require('./config')
const log = require('./lib/log.js')
const {merge} = require('sesajstools/utils/object')

const {application: {name: appName, staging}} = config

// plusieurs modules permettent de récupérer les traces async, tous font de grosses surcharges,
// pénalisantes pour les perfs mais surtout non exempte de bug, faut surtout pas utiliser ça en prod
// après avoir regardé
// https://github.com/mattinsler/longjohn/
// https://github.com/tlrobinson/long-stack-traces
// https://github.com/groundwater/node-stackup
// on opte pour https://github.com/AndreasMadsen/trace
// mais on ne le lance que via npm run start:devBack car ça fait parfois planter node (out of memory)

let lassiInstance

/**
 * Appelé après déclaration des composants mais avant bootstrap
 * @callback beforeBootstrapCallback
 * @param {Lassi} L'instance lassi
 * @param {Component} sesatheque Notre appli
 * @param {string[]} La liste des dépendances de notre appli
 */
/**
 * Boot l'application
 * @param {beforeBootstrapCallback} beforeBootstrapCb
 * @param {object} [options] Options qui seront passées à lassi() (@link Lassi)
 * @param {simpleCallback} afterBootCb
 */
function boot (beforeBootstrapCb, options, afterBootCb) {
  if (lassiInstance) {
    log.error(new Error('boot déjà appelé, beforeBootstrapCb et options ignorés'))
    if (afterBootCb) afterBootCb()
    return lassiInstance
  }
  if (!options) options = {}
  options.root = __dirname
  // @todo pas de var globale lassi
  // options.noGlobalLassi = true
  lassiInstance = lassi(options)
  if (options.config) {
    merge(config, options.config)
    // lassi charge en settings ${options.root}/config
    merge(lassiInstance.settings, options.config)
  }

  // notre fct de log en global
  global.log = log
  // et ce flag pratique
  global.isProd = /prod/.test(staging)
  /* global isProd */
  if (isProd || options.cli || staging === 'test') log.disable()
  else log(`Démarrage de l’application ${appName} avec l'environnement ${staging}`)

  /**
   * Gestion des traces
   * Attention, le module long-stack-traces m'a déjà joué des tours avec une erreur qui plante node
   * (reproductible, sur une 404), le désactiver a réglé le problème
   *
   * Pour augmenter les traces, mieux vaut passer à node ces options
   * --stack_trace_limit=100 --stack-size=2048
   */

  // les déclarations de nos components
  const dependancies = ['main', 'personne', 'ressource', 'update', 'auth']
  // on charge ces composants
  dependancies.forEach(dep => require(`./${dep}`)(lassiInstance))
  // des modules sup à charger
  if (config.extraModules) {
    config.extraModules.forEach(function (module) {
      log(`ajout du module supplémentaire ${module}`)
      require(module)
    })
  }
  if (config.extraDependenciesFirst) {
    config.extraDependenciesFirst.forEach(function (dependency) {
      log(`ajout en premier de la dépendance supplémentaire ${dependency}`)
      dependancies.unshift(dependency)
    })
  }
  if (config.extraDependenciesLast) {
    config.extraDependenciesLast.forEach(function (dependency) {
      log(`ajout en dernier de la dépendance supplémentaire ${dependency}`)
      dependancies.push(dependency)
    })
  }
  const sesatheque = lassiInstance.component('sesatheque', dependancies)

  beforeBootstrapCb(lassiInstance, sesatheque, dependancies)

  if (afterBootCb) lassiInstance.on('startup', afterBootCb)

  // et on lance le boot
  lassiInstance.bootstrap(sesatheque, function (error) {
    if (error) {
      log.error('boot failed')
      log.error(error)
      process.exit()
    }
    log('end bootstrap')
  })

  return lassiInstance
}

module.exports = boot
