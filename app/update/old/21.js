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

const name = 'Rectification de majuscules qui pouvaient rester dans les groupesSuivis et groupesMembre'
const description = ''

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    const EntityPersonne = lassi.service('EntityPersonne')
    let total = 0
    let nbMod = 0

    updateLog(name)
    flow().seq(function () {
      // on traite les personnes
      EntityPersonne.match('groupesSuivis').sort('oid').count(this)
    }).seq(function (tot) {
      total = tot
      updateLog(`${total} personnes à vérifier`)
      if (total) this()
      else done()
    }).seq(function () {
      EntityPersonne.match('groupesSuivis').sort('oid').grab(this)
    }).seqEach(function (personne) {
      let hasChange = false
      ;['groupesSuivis', 'groupesMembre'].forEach(p => {
        if (personne[p] && personne[p].length) {
          personne[p] = personne[p].map(nom => {
            const nomOk = nom.toLowerCase()
            if (nomOk !== nom) hasChange = true
            return nomOk
          })
        }
      })
      if (hasChange) {
        nbMod++
        personne.store(this)
      } else {
        this()
      }
    }).seq(function () {
      updateLog(`fin, ${total} personne(s) vérifiées, ${nbMod} corrections de groupes`)
      done()
    }).catch(done)
  } // run
}
