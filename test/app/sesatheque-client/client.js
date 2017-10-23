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

/**
 * Ce test crée une ressource puis la supprime
 * l'appeler directement en lui passant --prod ou --dev pour tester la sésathèque de prod ou dev
 * ou --token pour lui passer un token
 *
 */

'use strict'
/* eslint-env mocha */
import chai, {expect} from 'chai'
import sinonChai from 'sinon-chai'
// import sinon from 'sinon'
import log from 'sesajstools/utils/log'
// on se sert dans src pour avoir les bonnes lignes dans les éventuelles erreurs
import getClient from 'sesatheque-client/src'
import {XMLHttpRequest} from 'xmlhttprequest'

import config from '../../../app/config'
import configRessource from '../../../app/ressource/config'
import {getRandomRessource, populate} from '../populate'

chai.use(sinonChai)

const myBaseUrl = config.application.baseUrl
const sesatheques = [
  {
    baseId: config.application.baseId,
    baseUrl: myBaseUrl
  }
]

let sesathequeClient

module.exports = function describeClient () {
  before(function (done) {
    log.setLogLevel('error')
    sesathequeClient = getClient(sesatheques, 'mochaBaseId', XMLHttpRequest)
    populate(done)
  })

  // let consoleErrorSpy
  // beforeEach(() => { consoleErrorSpy = sinon.spy(console, 'error') })
  // afterEach(() => console.error.restore())

  it('getRessource remonte une ressource', function (done) {
    const expected = getRandomRessource()
    sesathequeClient.getRessource(expected.rid, function (error, ressource) {
      if (error) return done(error)
      Object.keys(expected).forEach(p => {
        if (typeof expected[p] === 'function') return
        expect(JSON.stringify(expected[p])).to.equals(JSON.stringify(ressource[p]), `Pb avec ${p}`)
      })
      done()
    })
  })

  it('getItem remonte un item', function (done) {
    const expected = getRandomRessource()
    sesathequeClient.getItem(expected.rid, function (error, item) {
      if (error) return done(error)
      ;['titre', 'rid', 'resume', 'description', 'commentaires', 'type'].forEach(p => {
        expect(expected[p]).to.equals(item[p], `Pb avec ${p}`)
      })
      expect(item.public).to.be.true
      expect(JSON.stringify(expected.categories)).to.equals(JSON.stringify(item.categories))
      expect(item.$displayUrl).to.equals(`${myBaseUrl}public/${configRessource.constantes.routes.display}/${expected.oid}`)
      done()
    })
  })
}
