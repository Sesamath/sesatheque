#!/usr/bin/env node
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
 * Pour appeler le cli avec une autre config que celle par défaut, passer par l'environnement :
 * `env SESATHEQUE_CONF=xxx app/cli.js …` pour utiliser la config _private/xxx.js
 */

const glob = require('glob')
const anLog = require('an-log')
const anLogLevels = require('an-log/source/lib/levels.js')
const boot = require('./boot')
const config = require('./config')

function beforeBootsrap (lassi, mainComponent, allComponents) {
  // on ajoute toutes les tasks AVANT le bootstrap
  const commands = {}
  let nbCommands = 0
  glob.sync(`${__dirname}/cli/*.js`).concat(glob.sync(`${__dirname}/tasks/**/index.js`)).forEach(function (fichier) {
    // chaque module peut déclarer un service lassi *-cli et ne rien exporter, ou exporter
    // un objet dont chaque propriété sera une fonction avec une méthode help,
    // cette fonction deviendra alors une commande du nom de la propriété (les autres propriétés seront ignorées)
    // console.log('ajout du module', fichier)
    const module = require(fichier)
    const names = Object.keys(module)
    names.forEach((name) => {
      const fn = module[name]
      if (typeof fn === 'function' && typeof fn.help === 'function') {
        // console.log('ajout de la commande ', name)
        commands[name] = fn
        nbCommands++
      }
    })
    if (nbCommands) {
      // console.log('aj service $sesatheque-cli')
      mainComponent.service('$sesatheque-cli', function () {
        // un service est une fct, et un service *-cli doit retourner une fct
        // qui doit retourner un objet avec une propriété commands qui doit être un fct
        // qui doit retourner un objet dont chaque propriété est une commande…
        // C'est lassi qui l'a dit…
        return function () {
          return {commands: () => commands}
        }
      })
    }
  })
}

try {
  anLog.config({
    [config.application.name]: {
      logLevel: anLogLevels.ERROR
    },
    $auth: {logLevel: anLogLevels.ERROR}
  })
  boot(beforeBootsrap, {cli: true}) // cli: true évite de lancer le serveur http
  lassi.service('$cli').run()
} catch (error) {
  console.error(error)
}
