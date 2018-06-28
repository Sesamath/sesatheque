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

const path = require('path')
const fs = require('fs')

const config = require('../config')
const applog = require('an-log')(config.application.name)

// Composant de gestion des updates
module.exports = function updateComponentFactory (lassi) {
  const updateComponent = lassi.component('update')

  require('./EntityUpdate')(updateComponent)
  require('./serviceUpdateCli')(updateComponent)

  if (!lassi.options.cli) {
    // on ajoute le lancement des updates au startup
    // @todo utiliser les updates de lassi à la place
    lassi.on('startup', function () {
      // si on est en mode cluster avec pm2, on ne se lance que sur la 1re instance (0)
      if (process.env.NODE_APP_INSTANCE && process.env.NODE_APP_INSTANCE > 0) {
        applog('update', 'instance n° ' + process.env.NODE_APP_INSTANCE + ', abandon pour laisser l’instance 0 faire le job')
        return
      }
      const EntityUpdate = lassi.service('EntityUpdate')
      // on cherche le dernier update appliqué
      EntityUpdate.match('num').sort('num', 'desc').grabOne(function (error, update) {
        function done (error) {
          if (error) {
            log.error(error)
            applog('updates', `Une erreur est survenue dans l’update ${dbVersion}, cf les logs ${config.logs.dir}/${config.logs.error} et ${config.logs.dir}/${config.logs.dataError}`)
          } else {
            applog('updates', 'plus d’update à faire, base en version', dbVersion)
          }
        }

        function nextUpdate (error) {
          if (error) return done(error)
          const update = path.join(__dirname, 'updates', (dbVersion + 1) + '.js')
          const lock = path.join(__dirname, '../../_private/updates.lock')
          try {
            fs.accessSync(lock, fs.R_OK)
            return applog('updates', `${lock} présent, on ignore les updates automatiques, base en version ${dbVersion}`)
          } catch (error) {
            // lock n’existe pas, on met ça pour rappeler qu'il pourrait exister
            applog('updates', `${lock} non présent, on étudie un éventuel update à lancer`)
          }
          fs.access(update, fs.R_OK, function (error) {
            if (error) return done() // plus d'updates à passer, c'est pas une erreur
            // sinon on applique
            dbVersion++
            const currentUpdate = require(update)
            applog('updates', `lancement update n° ${dbVersion} : ${currentUpdate.name}`)
            currentUpdate.run(function (error) {
              applog('updates', `fin update n° ${dbVersion}`)
              if (error) return done(error)
              EntityUpdate.create({
                name: currentUpdate.name,
                description: currentUpdate.description,
                num: dbVersion
              }).store(nextUpdate)
              applog('updates', `update n° ${dbVersion} OK, base en version ${dbVersion}`)
            })
          })
        }

        if (error) return done(error)
        // à partir de la sesatheque 1.0.1 on démarre en db version 27
        let dbVersion = (update && update.num) || 27
        nextUpdate()
      })
    })
  }
}
