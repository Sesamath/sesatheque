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
import log from 'sesajstools/utils/log'
// pour sesatheque-client on se sert dans src pour avoir les bonnes lignes dans les éventuelles erreurs
// mais ça marche pas avec mocha, sauf si le module est linké (car y'a plus node_modules dans son path)
// faudrait dire à babel-register de traiter les node_modules/sesatheque-client/src
// mais pas réussi (cf test/initMocha.js)
// import getClient from 'sesatheque-client/src'
import getClient from 'sesatheque-client'
import Ref from 'sesatheque-client/src/constructors/Ref'
// import ClientItem from 'sesatheque-client/src/constructors/ClientItem'
import ClientItem from 'sesatheque-client/dist/ClientItem'

import {XMLHttpRequest} from 'xmlhttprequest'

import boot from '../../server/boot'
import config from '../../../app/server/config'
import configRessource from '../../../app/server/ressource/config'
import {addRessource, getRandomRessource, populate, purge} from '../../server/populate'
import fakeRessource from '../../fixtures/fakeRessource'

chai.use(sinonChai)

const myBaseUrl = config.application.baseUrl
const sesatheques = [
  {
    baseId: config.application.baseId,
    baseUrl: myBaseUrl
  }
]
/**
 * Liste des propriétés communes à Ref & ClientItem (sauf aliasOf|rid, et les props facultatives enfants et parametres)
 * @private
 * @type {string[]}
 */
const properties = Object.keys(new Ref())

/**
 * Retourne une promesse d'enregistrement d'une ressource en base (avec l'entity passée au resolve)
 * @param ressource
 * @return {Promise}
 */
const getAdditionPromise = (ressource) => new Promise((resolve, reject) => {
  addRessource(ressource, (error, entity) => error ? reject(error) : resolve(entity))
})

describe('sesatheque-client', () => {
  let sesathequeClient
  let consoleErrorStub
  /**
   * Vérifie que item a les valeurs de expected pour toutes les propriétés par défaut d'une ref
   * @private
   * @param {Ref|ClientItem} item
   * @param {Object} expected
   */
  const checkRefProperties = (item, expected) => {
    if (item.enfants) {
      // on passe par des strings, passe plus sinon :-/
      item.enfants.forEach((e, i) => {
        const itemString = JSON.stringify(e, null, 2)
        const expectedString = JSON.stringify(expected.enfants[i], null, 2)
        const errorMessage = `Pb avec enfant n° ${i} :\n${itemString} \n est différent de ce qu'on attendait\n${expectedString}\n`
        expect(itemString).to.equal(expectedString, errorMessage)
      })
    }
    if (item.parametres) expect(item.parametres).to.deep.equal(expected.parametres, 'Pb avec parametres')
    properties.forEach(p => {
      if (p === 'public') {
        // on traite le cas où expected est une ressource
        if (expected.hasOwnProperty('public')) expect(item[p]).to.equal(expected[p], `Pb avec ${p}`)
        else if (expected.publie === false) expect(item.public).to.equal(false, `Pb avec public (non publie)`)
        else if (expected.restriction) expect(item.public).to.equal(false, `Pb avec public (restreint)`)
        else expect(item.public).to.equal(true, `Pb avec public (pas d’info)`)
      } else {
        expect(item[p]).to.deep.equal(expected[p], `Pb avec ${p}`)
      }
    })
  }
  /**
   * Vérifie que item a bien toutes les propriétés à celles qui existent dans expected (à l'identique)
   * @private
   * @param {ClientItem} item
   * @param {ClientItem|Object} expected
   */
  const checkItem = (item, expected) => {
    // si expected n'a pas une des propriétés de properties on l'ajoute pour la comparaison
    const fakeExpected = expected
    properties.forEach(p => {
      // item n'a pas d'aliasOf mais un rid
      if (p === 'aliasOf') p = 'rid'
      // si c'est pas dans expected on veut passer le test de cette propriété
      if (!expected.hasOwnProperty(p)) fakeExpected[p] = item[p]
    })
    checkRefProperties(item, fakeExpected)
    if (expected.enfants && !item.enfants) throw new Error('Pas d’enfants sur l’item')
    if (expected.parametres && !item.parametres) throw new Error('Pas de parametres sur l’item')
    // on ne regarde que les props pas encore testées
    const propsChecked = ['enfants', 'parametres'].concat(properties)
    Object.keys(expected)
      .filter(p => !propsChecked.includes(p))
      .forEach(p => expect(item[p]).to.deep.equal(expected[p], `Pb item avec ${p}`))
  }
  const ressourceToItem = (ressource) => {
    const data = ressource
    if (!data.$droits) data.$droits = 'R'
    return new ClientItem(data)
  }

  // on populate une fois au début, et on purge à la fin
  // inutile ici de le faire à chaque test, c'est le client qu'on teste
  before(function () {
    this.timeout(20000)
    return boot().then(({testsDone}) => {
      after(purge)
      after(testsDone)
      log.setLogLevel('error')
      sesathequeClient = getClient(sesatheques, 'mochaBaseId', XMLHttpRequest)
      return populate()
    })
  })

  beforeEach(() => {
    consoleErrorStub = sinon.stub(console, 'error')
  })
  afterEach(() => {
    expect(consoleErrorStub).to.not.have.been.called
    consoleErrorStub.reset()
    consoleErrorStub.restore()
  })

  it('getRessource remonte une ressource', () => {
    const getCheckPromise = (expected) => new Promise((resolve, reject) => {
      sesathequeClient.getRessource(expected.rid, (error, ressource) => {
        if (error) return reject(error)
        Object.keys(expected).forEach(p => {
          if (typeof expected[p] === 'function') return
          if (p.substr(0, 1) === '$') return
          expect(expected[p]).to.deep.equal(ressource[p], `Pb avec ${p} pour la ressource ${ressource.rid}`)
        })
        resolve()
      })
    })
    // on veut tester ça avec certaines ressources d'un type imposé (undefined => random)
    const types = ['arbre', 'em', 'sequenceModele', undefined, undefined]
    const ressources = types.map(type => fakeRessource({type}))
    const promises = ressources.map((ressource) => getAdditionPromise(ressource).then(getCheckPromise))
    return Promise.all(promises)
  })

  it('getItem remonte un item', () => {
    const getCheckPromise = (entity) => new Promise((resolve, reject) => {
      sesathequeClient.getItem(entity.rid, (error, item) => {
        if (error) return reject(error)
        const expected = ressourceToItem(entity)
        // on veut juste une égalité booléenne
        expect(!item.$deletable).to.equal(!expected.$deletable)
        expected.$deletable = item.$deletable
        checkItem(item, expected)
        resolve()
      })
    })
    // on veut tester ça avec certaines ressources d'un type imposé (undefined => random)
    const types = ['arbre', 'em', 'sequenceModele', undefined, undefined]
    const ressources = types.map(type => fakeRessource({type}))
    const promises = ressources.map((ressource) => getAdditionPromise(ressource).then(getCheckPromise))
    return Promise.all(promises)
  })

  it('getRessource et getItem throw si rid sur baseId inconnue', () => {
    const getRessourceFoireux = () => sesathequeClient.getRessource('foo/bar', () => {})
    const getItemFoireux = () => sesathequeClient.getItem('foo/bar', () => {})
    expect(getRessourceFoireux).to.throw
    expect(getItemFoireux).to.throw
  })

  it('getItem râle en console si on veut une ressource privée sans avoir de token, il tente en public et retourne le résultat', (done) => {
    const ressource = getRandomRessource()
    const expected = ressourceToItem(ressource)
    sesathequeClient.getItem(ressource.rid, false, (error, item) => {
      if (error) return done(error)
      expect(consoleErrorStub).to.have.been.calledOnce
      console.error.reset()
      item.$deletable = false // undefined au retour de getItem
      checkItem(item, expected)
      done()
    })
  })

  // pour que ça marche faut passer un token en authorization, donc gérer une session…
  it.skip('getItem remonte un item privé avec la clé pour displayUrl (avec session)', function (done) {
    const ressource = getRandomRessource()
    ressource.restriction = configRessource.constantes.restriction.prive
    ressource.store((error, entity) => {
      if (error) return done(error)
      const expected = ressourceToItem(entity)
      if (!expected.aliasOf) return done(new Error(`pas d’aliasOf sur l’item sorti de ${entity.rid}`))
      sesathequeClient.getItem(expected.aliasOf, function (error, item) {
        if (error) return done(error)
        checkItem(item, expected)
        // on vérifie quand même $displayUrl
        const {display} = configRessource.constantes.routes
        expect(item.$displayUrl).to.equal(`${myBaseUrl}/public/${display}/cle/${entity.cle}?${entity.inc}`, 'pb $displayUrl')
        done()
      })
    })
  })
})
