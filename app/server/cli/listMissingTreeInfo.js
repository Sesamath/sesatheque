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
const logTask = require('an-log')('sesatheque-cli')
const config = require('../config')
const {getRidComponents, getBaseUrl} = require('sesatheque-client/dist/server/sesatheques')

/**
 * Rafraichit les datas de tous les arbres
 * @param {errorCallback} done
 */
function listMissing (done) {
  function grab (next) {
    let nb = 0
    flow().seq(function () {
      EntityRessource.match('type').equals('arbre').sort('dateCreation').grab({limit, offset}, this)
    }).seqEach(function (arbre) {
      nb++
      process.nextTick(listOne, '', arbre, this)
    }).seq(function () {
      if (nb === limit) {
        offset += limit
        grab(next)
      } else {
        next()
      }
    }).catch(next)
  } // grab

  function listOne (prefix, arbre, next) {
    // init prefix
    if (arbre.oid) prefix = `${arbre.oid} [${arbre.titre}]`
    else prefix += ` > ${arbre.titre}`
    // traitement de cet arbre
    if (arbre.oid || arbre.aliasOf) checkOne(prefix, arbre)
    // traitement des enfants
    if (!arbre.enfants || !arbre.enfants.length) return next()
    flow(arbre.enfants).seqEach(function (enfant) {
      if (enfant.type === 'arbre') {
        process.nextTick(listOne, prefix, enfant, this)
      } else {
        process.nextTick(checkOne, prefix, enfant)
        this()
      }
    }).done(next)
  }

  function checkOne (prefix, enfant) {
    // on signale les erreurs
    if (enfant.type === 'error') return console.log(`${prefix} => Error : ${enfant.titre}`)
    // on passe les dossiers
    if (enfant.type === 'arbre' && !enfant.oid && !enfant.aliasOf) return
    // on traite le reste
    nbRessources++
    if (enfant.resume) return

    // il manque au moins un resumé, on regarde tout
    const props = ['resume', 'commentaires', 'description']
    const output = []
    props.forEach(p => output.push(p + (enfant[p] ? 'OK' : 'KO')))
    let message = `${prefix} > ${enfant.titre} : ${output.join('\t')}`
    let baseId, baseUrl, oid
    if (enfant.oid) {
      baseId = config.application.baseId
      baseUrl = config.application.baseUrl
      oid = enfant.oid
    } else if (enfant.aliasOf) {
      try {
        [baseId, oid] = getRidComponents(enfant.aliasOf)
        baseUrl = getBaseUrl(baseId)
      } catch (error) {
        return logTask(`${message} : ${error}`)
      }
    } else {
      logTask.error(`${message} : enfant sans oid ni aliasOf`)
    }
    console.log(`${message} ${baseUrl}ressource/modifier/${oid}`)
  }

  if (typeof done !== 'function') {
    listMissing.help()
    process.exit(1)
  }

  let offset = 0
  let limit = 10
  let nbArbres = 0
  let nbArbresModif = 0
  let nbRessources = 0
  const EntityRessource = lassi.service('EntityRessource')
  flow().seq(function () {
    EntityRessource.match('type').equals('arbre').count(this)
  }).seq(function (nb) {
    nbArbres = nb
    logTask(`Starting listMissing avec ${nb} arbres`)
    grab(this)
  }).seq(function () {
    logTask(`fin du rafraichissement de ${nbArbres} arbres (contenant ${nbRessources} ressources), dont ${nbArbresModif} modifiés`)
    done()
  }).catch(done)
}

listMissing.help = function refreshArbresHelp () {
  logTask('La commande listMissing ne prend pas d’argument, elle parcoure tous les arbres et signale les résumés manquants (et si c’est la la présence de description et commentaires)')
}

module.exports = {
  listMissing
}
