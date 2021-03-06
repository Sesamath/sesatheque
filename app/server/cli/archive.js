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
const taskLog = require('an-log')('sesatheque-cli')
const {application: {baseId}} = require('../config')

function listVersions (oid, done) {
  if (typeof done !== 'function' || !oid) {
    taskLog.error('argument invalides')
    listVersions().help()
    return
  }
  const rid = `${baseId}/${oid}`
  lassi.service('EntityArchive').match('rid').equals(rid).sort('version').grab((error, archives) => {
    if (error) return done(error)
    if (archives.length) {
      console.log(`La ressource ${oid} est archivée avec les versions ${archives.map(a => a.version).join(' ')}`)
    } else {
      console.log(`La ressource ${oid} n’a pas d’archives`)
    }
    done()
  })
}

listVersions.help = () => console.log('La commande listVersions prend un oid de ressource en argument')

function print (oid, version, done) {
  if (typeof done !== 'function') {
    taskLog.error('arguments invalides')
    restore.help()
    return
  }
  if (!oid || !version) return done(new Error('arguments invalides'))
  const rid = `${baseId}/${oid}`
  const query = lassi.service('EntityArchive').match('rid').equals(rid)
  if (version === 'last') query.sort('version', 'desc')
  else query.match('version').equals(version)
  query.grabOne((error, archive) => {
    if (error) return done(error)
    if (!archive) {
      console.log(`La ressource ${oid} archivée en version ${version} :`)
      console.log(JSON.stringify(archive, null, 2))
    } else {
      console.log(`La ressource ${oid} n’a pas d’archive en version ${version}`)
    }
    done()
  })
}
print.help = () => console.log('La commande restore prend un oid de ressource en premier argument et la version à restaurer en 2e (mettre last pour récupérer la dernière)')

/**
 * Restore une version depuis les archives
 * @param {string} [oid]
 * @param {errorCallback} done
 */
function restore (oid, version, done) {
  const EntityRessource = lassi.service('EntityRessource')
  const EntityArchive = lassi.service('EntityArchive')
  const $ressourceRepository = lassi.service('$ressourceRepository')
  if (typeof done !== 'function') {
    taskLog.error('arguments invalides')
    restore.help()
    return
  }
  if (!oid || !version) return done(new Error('arguments invalides'))
  let ressource
  let archive

  flow().seq(function () {
    EntityRessource.match('oid').equals(oid).grabOne(this)
  }).seq(function (_ressource) {
    if (!_ressource) return done(new Error(`La ressource ${oid} n’existe pas`))
    ressource = _ressource
    if (version === 'last') {
      EntityArchive
        .match('rid').equals(ressource.rid)
        .sort('version', 'desc')
        .grabOne(this)
    } else {
      EntityArchive
        .match('rid').equals(ressource.rid)
        .match('version').equals(version)
        .grabOne(this)
    }
  }).seq(function (_archive) {
    if (!_archive) return done(new Error(`Il n’y a pas d'archive de la ressource ${oid} en version ${version}`))
    archive = _archive
    $ressourceRepository.archive(ressource, this)
  }).seq(function () {
    const overrides = {
      oid: ressource.oid,
      // on garde comme parent l'archive restaurée, qui ne sera donc pas en version - 1
      version: ressource.version + 1,
      inc: ressource.inc + 1,
      dateArchivage: undefined
    }
    const ressourceRestored = Object.assign({}, archive, overrides)
    $ressourceRepository.save(ressourceRestored, this)
  }).seq(function (freshRessource) {
    taskLog(`Archive ${archive.oid} de la ressource ${oid}`)
    done()
  }).catch(done)
}

restore.help = () => console.log('La commande restore prend un oid de ressource en premier argument et la version à restaurer en 2e (mettre last pour récupérer la dernière)')

module.exports = {
  listVersions,
  print,
  restore
}
