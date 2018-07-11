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
import sinon from 'sinon'
// si on a pas de link vers le module on peut pas aller dans src (mocha aime pas les import que babel ne traite pas because node_modules)
// import {addSesatheque, exists, getBaseId, getBaseUrl} from 'sesatheque-client/src/sesatheques'
import {addSesatheque, exists, getBaseId, getBaseUrl} from 'sesatheque-client/dist/sesatheques'
import boot from '../boot'

chai.use(sinonChai)

const expected = {
  sesabibli: 'https://bibliotheque.sesamath.net/',
  sesacommun: 'https://commun.sesamath.net/',
  sesabiblidev: 'https://bibliotheque.devsesamath.net/',
  sesacommundev: 'https://commun.devsesamath.net/'
}

describe('sesatheques', () => {
  let consoleErrorSpy
  const baseId = 'stbidon1'
  const baseUrl = 'http://localhost/'
  const baseUrl2 = 'http://localhost:1234/'
  const baseId3 = 'stbidon3'
  let baseUrl3 = 'http://localhost:3'
  let $settings

  before(() => boot()
    .then(({lassi, testsDone}) => {
      after(testsDone)
      $settings = lassi.service('$settings')
      return Promise.resolve()
    })
  )
  beforeEach(() => { consoleErrorSpy = sinon.spy(console, 'error') })
  afterEach(() => console.error.restore())

  it('les 4 sesatheques dev & prod existent avec les urls attendues', function (done) {
    Object.keys(expected).forEach((baseId) => {
      expect(exists(baseId)).to.be.ok
      expect(getBaseUrl(baseId)).to.equal(expected[baseId])
      expect(getBaseId(expected[baseId])).to.equal(baseId)
    })
    expect(consoleErrorSpy).to.not.have.been.called
    done()
  })

  it('get de notre sesathèque de test mise au boot', function (done) {
    const {baseId, baseUrl} = $settings.get('application')
    expect(exists(baseId)).to.be.true
    expect(getBaseUrl(baseId)).to.equal(baseUrl)
    expect(getBaseId(baseUrl)).to.equal(baseId)
    expect(consoleErrorSpy).to.not.have.been.called
    done()
  })

  it('addSesatheque puis get', function (done) {
    expect(addSesatheque(baseId, baseUrl)).to.be.true
    expect(consoleErrorSpy).to.not.have.been.called
    expect(exists(baseId)).to.be.true
    expect(getBaseUrl(baseId)).to.equal(baseUrl)
    expect(getBaseId(baseUrl)).to.equal(baseId)
    done()
  })
  it('2e add identique renvoie false sans râler', function (done) {
    // on recommence, ça doit renvoyer false
    expect(addSesatheque(baseId, baseUrl)).to.be.false
    expect(consoleErrorSpy).to.not.have.been.called
    expect(exists(baseId)).to.be.true
    expect(getBaseUrl(baseId)).to.equal(baseUrl)
    expect(getBaseId(baseUrl)).to.equal(baseId)
    done()
  })
  it('add avec même baseId mais baseUrl ≠ => throw une erreur', function (done) {
    // on recommence avec baseUrl ≠, ça doit nous jeter
    const addThrow = () => addSesatheque(baseId, baseUrl2)
    const reMsg = /déjà définie avec une autre base/
    expect(addThrow).to.throw(Error, reMsg)
    done()
  })
  it('add avec nouvelle baseId mais baseUrl existante => throw une erreur', function (done) {
    const addThrow = () => addSesatheque(baseId3, baseUrl)
    const reMsg = /était déjà enregistré avec/
    expect(addThrow).to.throw(Error, reMsg)
    done()
  })
  it('nouvel add sans slash de fin dans baseUrl, ça l’ȧjoute en le disant', function (done) {
    // on recommence sans le slash de fin
    expect(addSesatheque(baseId3, baseUrl3)).to.be.true
    expect(consoleErrorSpy).to.have.been.calledWithMatch(/doit avoir un slash de fin/)
    baseUrl3 += '/'
    expect(getBaseUrl(baseId3)).to.equal(baseUrl3)
    expect(getBaseId(baseUrl3)).to.equal(baseId3)
    done()
  })

  it('getBaseId throw Error ou console.error si baseUrl inconnue', function (done) {
    const getBaseIdThrow = () => getBaseId('foo')
    const reMsg = /pas l’url d’une sesathèque connue/
    expect(getBaseIdThrow).to.throw(Error, reMsg)
    getBaseId('foo', false)
    expect(consoleErrorSpy).to.have.been.calledWithMatch(reMsg)
    done()
  })
})
