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

const getDesc = (arbre) => `${arbre.oid} ${arbre.origine}/${arbre.idOrigine} ${arbre.titre}`

/**
 * Supprime les contenus ec2 dans l'arbre, retourne le nb d'ec2 virés
 * @param arbre
 */
function cleanEc2 (arbre) {
  // pour le log
  if (!Array.isArray(arbre.enfants)) {
    taskLog.error(`KO, arbre sans propriété enfants ${getDesc(arbre)}`)
    return false
  }

  let nbSuppr = 0
  const getCleanEnfants = branche => branche.enfants.map(e => {
    if (e.type === 'ec2') {
      nbSuppr++
      return null
    }
    if (e.type === 'arbre' && Array.isArray(e.enfants)) {
      const nb = e.enfants.length
      e.enfants = getCleanEnfants(e)
      if (nb && !e.enfants.length) return null // un dossier dont on a viré tous les enfants, on le vire aussi
    }
    return e
  }).filter(e => e)

  arbre.enfants = getCleanEnfants(arbre)
  return nbSuppr
}

/**
 * Purge les ressources ec2 dans tous les arbres
 * @param {string} [oid]
 * @param {errorCallback} done
 */
function purgeEc2 (oid, done) {
  function grab (next) {
    let nb = 0
    flow().seq(function () {
      taskLog(`traitement des arbres de ${offset} à ${offset + limit} sur ${nbArbres}`)
      EntityRessource.match('type').equals('arbre').sort('dateCreation').grab({limit, offset}, this)
    }).seqEach(function (arbre) {
      nb++
      processOne(arbre, this)
    }).seq(function () {
      nbArbres += nb
      if (nb === limit) {
        offset += limit
        grab(next)
      } else {
        next()
      }
    }).catch(next)
  } // grab

  function processOne (arbre, next) {
    const nbSuppr = cleanEc2(arbre)
    if (!nbSuppr) return next(null, arbre)
    nbArbresModif++
    taskLog(`${nbSuppr} ressource ec2 supprimées dans l’arbre ${getDesc(arbre)}`)
    $ressourceRepository.save(arbre, next)
  }

  if (typeof oid === 'function') {
    done = oid
    oid = undefined
  }
  if (typeof done !== 'function') throw new Error('Erreur interne, pas de callback de commande')
  let offset = 0
  const limit = 10
  let nbArbres = 0
  let nbArbresModif = 0
  const EntityRessource = lassi.service('EntityRessource')
  const $ressourceRepository = lassi.service('$ressourceRepository')
  if (oid) {
    flow().seq(function () {
      EntityRessource
        .match('type').equals('arbre')
        .match('oid').equals(oid)
        .grabOne(this)
    }).seq(function (arbre) {
      if (!arbre) {
        taskLog.error(`La ressource ${oid} n’existe pas ou n’est pas un arbre`)
        return done()
      }
      taskLog(`Starting purgeEc2 ${oid}`)
      processOne(arbre, this)
    }).seq(function () {
      taskLog(`fin du rafraichissement de l’arbre ${oid}, il ${nbArbresModif ? 'a' : 'n’a pas'} été modifié.`)
      done()
    }).catch(done)
  } else {
    flow().seq(function () {
      EntityRessource.match('type').equals('arbre').count(this)
    }).seq(function (nb) {
      nbArbres = nb
      taskLog(`Starting purgeEc2 avec ${nb} arbres`)
      grab(this)
    }).seq(function () {
      taskLog(`fin du nettoyage de ${nbArbres} arbres, dont ${nbArbresModif} modifiés`)
      done()
    }).catch(done)
  }
}

purgeEc2.help = function refreshArbresHelp () {
  taskLog('La commande purgeEc2 prend un oid en argument pour nettoyer l’arbre de ses ressources ec2, sans argument elle nettoie tous les arbres')
}

module.exports = {
  purgeEc2
}
