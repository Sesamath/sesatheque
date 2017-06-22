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

const flow = require('an-flow')
const config = require('../../config')
const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
// an-log ne fait rien ici si on l'appelle avec le même config.application.name que update/index.js !
const updateLog = require('an-log')(config.application.name + ' update' + updateNum)
const updateLogErr = updateLog.error
const logBoth = (message, obj) => {
  updateLogErr(message)
  log.dataError(message, obj)
}

const name = 'Met à jour le format des séries'
const description = ''

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    // fcts internes
    function cleanSerie (serie, next) {
      if (!serie.parametres) {
        logBoth(`Série ${serie.oid} sans paramètres`, serie)
        return next()
      }
      let needSave = false
      flow().seq(function () {
        if (!serie.parametres.serie && !Array.isArray(serie.parametres)) {
          logBoth(`Série ${serie.oid} avec paramètres qui n’est pas un array, sans parametres.serie, `, serie)
          return next()
        }
        if (!serie.parametres.serie) {
          needSave = true
          serie.parametres = {
            serie: serie.parametres
          }
        }
        // faut vérifier si on a de vieilles refs obsolètes
        serie.parametres.serie.some(exo => {
          if (!exo.rid) {
            logBoth(`Série avec des refs trop vieilles`, serie)
            needSave = true
            serie = {
              type: 'error',
              titre: `${serie.titre} : Désolé, format trop ancien, il faut réimporter depuis labomep1 ou refaire l’export depuis labomep2`
            }
            return true // on arrête là
          } else {
            if (exo.ref) {
              delete exo.ref
              needSave = true
            }
            if (!exo.public) {
              if (!exo.cle) {
                if (exo.hasOwnProperty('cle')) delete exo.cle // inutile de traîner des null
                exo.public = true
                needSave = true
              }
            }
            if (exo.displayUrl) {
              delete exo.displayUrl
              needSave = true
            }
          }
        })
        if (!needSave) return next()
        serie.store(this)
      }).seq(function () {
        updateLog(`Série ${serie.oid} mise à jour`)
        $cacheRessource.delete(serie.oid, this)
      }).done(next)
    }

    // init
    const EntityRessource = lassi.service('EntityRessource')
    const $cacheRessource = lassi.service('$cacheRessource')

    flow().seq(function () {
      // on traite les groupes
      EntityRessource.match('type').equals('serie').sort('oid').count(this)
    }).seq(function (total) {
      updateLog(`${total} séries à vérifier`)
      if (total) EntityRessource.match('type').equals('serie').sort('oid').grab(this)
      else done()
    }).seqEach(function (serie) {
      cleanSerie(serie, this)
    }).seq(function () {
      done()
    }).catch(done)
  } // run
}
