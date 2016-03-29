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

var path = require('path')
var fs = require('fs')

var flow = require('an-flow')
var config = require('../config')
var applog = require('an-log')(config.application.name)

// Composant de gestion des updates
var updateComponent = lassi.component('update')

updateComponent.entity('EntityUpdate', function () {
  require('./EntityUpdate')(this)
})

lassi.on('startup', function () {
  var EntityUpdate = lassi.service('EntityUpdate')
  // on cherche le dernier update appliqué
  EntityUpdate.match('num').sort('num', 'desc').grabOne(function (error, update) {
    try {
      if (error) throw error
      var last = update && update.num || 0
      lassi.settings.application.dbVersion = last
      var i = last + 1
      var file = path.join(__dirname, 'updates/update_' + i + '.js')
      var files = []
      while (fs.existsSync(file)) {
        files.push(file)
        i++
        file = path.join(__dirname, 'batch/update_' + i + '.js')
      }
      if (files.length) {
        i = last
        flow(files).seqEach(function (file) {
          i++
          var nextUpdate = this
          var todo = require(file)
          applog('updates', 'lancement update n° ' + i)
          flow().seq(function () {
            todo.run(this)
          }).seq(function (result) {
            if (!result) {
              this(new Error(file + ' n’a pas renvoyé d’erreur ni de result'))
            } else {
              var update = EntityUpdate.create()
              update.date = new Date()
              update.name = todo.name
              update.description = todo.description
              update.num = i
              update.result = result
              update.store(this)
            }
          }).seq(function (update) {
            applog('updates', 'update n° ' + update.num + ' OK, base en version ' + update.num)
            lassi.settings.application.dbVersion = update.num
          }).catch(nextUpdate)
        }).catch(function (error) {
          applog('updates', 'Une erreur est survenue, cf le log d’erreurs', config.logs.error)
          log.error(error)
        })
      } else {
        applog('updates', 'aucun update à faire, base en version', lassi.settings.application.dbVersion)
      }
    } catch (error) {
      log.error(error)
    }
  })
})
/* */
