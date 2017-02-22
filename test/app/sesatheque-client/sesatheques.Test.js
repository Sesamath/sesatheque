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
 * l'appeler directement en lui passant --prod ou --dev pour tester la bibliotheque de prod ou dev
 * ou --token pour lui passer un token
 *
 */

'use strict'
/* eslint-env mocha */
import chai, {expect} from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import {add, exists, getBaseId, getBaseUrl} from 'sesatheque-client/src/sesatheques'

chai.use(sinonChai)

const expected = {
  current: '/',
  sesabibli: 'http://bibliotheque.sesamath.net/',
  sesacommun: 'http://commun.sesamath.net/',
  sesabiblidev: 'http://bibliotheque.devsesamath.net/',
  sesacommundev: 'http://commun.devsesamath.net/'
}

module.exports = function testSesatheques (globTest) {
  describe('sesatheques', function () {
    let consoleErrorSpy
    beforeEach(() => { consoleErrorSpy = sinon.spy(console, 'error') })
    afterEach(() => console.error.restore())

    it('les 4 sesatheques dev & prod existent avec les urls attendues', function (done) {
      Object.keys(expected).forEach((baseId) => {
        expect(exists(baseId)).to.be.true
        expect(getBaseUrl(baseId)).to.equal(expected[baseId])
        expect(getBaseId(expected[baseId])).to.equal(baseId)
      })
      expect(consoleErrorSpy).to.have.not.been.called
      done()
    })

    it('get de notre sesathèque de test mise au boot', function (done) {
      const {baseId, baseUrl} = globTest.config.application
      expect(exists(baseId)).to.be.true
      expect(getBaseUrl(baseId)).to.equal(baseUrl)
      expect(getBaseId(baseUrl)).to.equal(baseId)
      expect(consoleErrorSpy).to.have.not.been.called
      done()
    })

    it('add & get d’une sésathèque qcq, console.error si baseId connue avec baseUrl ≠ ou s’il manque le slash de fin', function (done) {
      const baseId = 'stbidon1'
      const baseUrl = 'http://localhost/'
      expect(add(baseId, baseUrl)).to.be.true
      expect(consoleErrorSpy).to.have.not.been.called
      expect(exists(baseId)).to.be.true
      expect(getBaseUrl(baseId)).to.equal(baseUrl)
      expect(getBaseId(baseUrl)).to.equal(baseId)

      // on recommence, ça doit renvoyer false
      expect(add(baseId, baseUrl)).to.be.false
      expect(consoleErrorSpy).to.have.not.been.called
      expect(exists(baseId)).to.be.true
      expect(getBaseUrl(baseId)).to.equal(baseUrl)
      expect(getBaseId(baseUrl)).to.equal(baseId)

      // on recommence avec baseUrl ≠, ça doit en plus appeler console.error
      const baseUrl2 = 'http://localhost:1234/'
      expect(add(baseId, baseUrl2)).to.be.false
      expect(consoleErrorSpy).to.have.been.calledWithMatch(/déjà définie avec une autre base/)
      expect(getBaseUrl(baseId)).to.equal(baseUrl)
      expect(getBaseId(baseUrl)).to.equal(baseId)

      // on recommence sans le slash de fin
      const baseId3 = 'stbidon3'
      let baseUrl3 = 'http://localhost:3'
      expect(add(baseId3, baseUrl3)).to.be.true
      expect(consoleErrorSpy).to.have.been.calledWithMatch(/doit avoir un slash de fin/)
      baseUrl3 += '/'
      expect(getBaseUrl(baseId3)).to.equal(baseUrl3)
      expect(getBaseId(baseUrl3)).to.equal(baseId3)

      done()
    })

    it('getBaseId throw Error ou console.error si baseUrl inconnue', function (done) {
      const getBaseIdThrow = () => getBaseId('foo')
      const reMsg = /pas une sesathèque connue/
      expect(getBaseIdThrow).to.throw(Error, reMsg)
      getBaseId('foo', false)
      expect(consoleErrorSpy).to.have.been.calledWithMatch(reMsg)
      done()
    })
  })
}
