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
 * Ce test crée une ressource puis la supprime, options possibles :
 * l'appeler directement en lui passant --prod ou --dev pour tester la sésathèque de prod ou dev,
 * (sinon c'est la bibli locale)
 * ou --token pour lui passer un token
 */

'use strict'
/* eslint-env mocha */
import {expect} from 'chai'
import faker from 'faker/locale/fr'
import {getRandomPersonne, getRandomRessource, getRessources, populate, purge} from '../populate'
import boot from '../../boot'
import configRessource from '../../../app/server/ressource/config'
import config from '../../../app/server/config'
import helpersFactory from './helpers'

const {application: {baseId: myBaseId}} = config

describe('controller api ressource', () => {
  // pour les appels authentifiés via token
  let apiTokenEncoded
  // le client express instancié en before
  let _superTestClient
  let $settings
  // nos helpers
  let checkDb
  let checkHttp
  let cleanVolatileProperties
  let getTestRessources
  let purgeOnError

  // boot + récup des services et config nécessaires à nos tests
  before(function () {
    this.timeout(10000)
    return boot().then(({lassi, superTestClient, testsDone}) => {
      if (!superTestClient) return Promise.reject(new Error('boot KO stc'))
      if (!lassi) return Promise.reject(new Error('boot KO lassi'))
      after(testsDone)
      _superTestClient = superTestClient
      $settings = lassi.service('$settings')
      const apiToken = $settings.get('apiTokens')[0]
      if (!apiToken) return Promise.reject(new Error('pas trouvé apiTokens en configuration'))
      apiTokenEncoded = encodeURIComponent(apiToken)
      const h = helpersFactory(lassi, superTestClient)
      checkDb = h.checkDb
      checkHttp = h.checkHttp
      cleanVolatileProperties = h.cleanVolatileProperties
      getTestRessources = h.getTestRessources
      purgeOnError = h.purgeOnError
      // on démarre sur une base vide
      return purge()
    })
  })

  after(purge)

  it('POST enregistre une ressource et retourne son oid', function () {
    const getPostPromise = (ressource) => _superTestClient
      .post('/api/ressource')
      .set('Content-Type', 'application/json')
      .set('X-ApiToken', apiTokenEncoded)
      .send(ressource)
      .expect(200)
      .then(({body: {message, data}}) => {
        expect(message).to.equal('OK')
        const {oid} = data
        expect(!!oid).to.be.true
        ressource.oid = oid
        ressource.rid = `${myBaseId}/${oid}`
        cleanVolatileProperties(ressource)
        // la ressource n'existait pas donc le inc et version ont été incrémenté
        delete ressource.inc
        delete ressource.version
        return checkDb(ressource)
      })

    const ressources = getTestRessources().map(r => {
      // si on crée une ressource avec oid ou version l'api va vouloir archiver
      // et ça plantera car y'a pas de version antérieure
      delete r.oid
      delete r.version
      delete r.inc
      return r
    })

    // purge puis poste et vérifie puis purge
    return purge()
      .then(() => Promise.all(ressources.map(getPostPromise)))
      .catch(purgeOnError)
      .then(purge)
  })

  it('POST /api/ressource met à jour une ressource et incrémente inc si modif du résumé', function () {
    function checkOne (ressource) {
      const {oid} = ressource
      cleanVolatileProperties(ressource)
      ressource.resume += faker.lorem.words()
      ressource.inc++
      const postData = {
        oid,
        resume: ressource.resume
      }
      return _superTestClient
        .post('/api/ressource')
        .set('Content-Type', 'application/json')
        .set('X-ApiToken', apiTokenEncoded)
        .send(postData)
        .expect(200)
        .then(({body: {message, data}}) => {
          expect(message).to.equal('OK')
          return checkDb(ressource)
        })
    }
    return populate({ressources: 10, personnes: 6})
      .then(() => Promise.all(getRessources().map(checkOne)))
      .catch(purgeOnError)
      .then(purge)
  })

  it('POST /api/ressource met à jour une ressource et incrémente version et inc si modif des auteurs', () => {
    function checkOne (ressource) {
      const {oid} = ressource
      cleanVolatileProperties(ressource)
      // on ajoute un auteur
      const excludedPids = ressource.auteurs.concat(ressource.contributeurs)
      ressource.auteurs.push(getRandomPersonne(true, excludedPids))
      // on incrémente version et inc
      ressource.inc++
      ressource.version++
      // mais on ne poste que oid & auteurs
      const postData = {
        oid,
        auteurs: ressource.auteurs
      }
      return _superTestClient
        .post('/api/ressource')
        .set('Content-Type', 'application/json')
        .set('X-ApiToken', apiTokenEncoded)
        .send(postData)
        .expect(200)
        .then(({body: {message, data}}) => {
          expect(message).to.equal('OK')
          checkDb(ressource)
        })
    }
    return populate({ressources: 10, personnes: 6})
      .then(() => Promise.all(getRessources().map(checkOne)))
      .catch(purgeOnError)
      .then(purge)
  })

  it('POST /api/ressource met à jour une ressource sans incrément si modif relations seulement', function () {
    function checkOne (ressource) {
      const {oid} = ressource
      cleanVolatileProperties(ressource)
      // on ajoute une relation
      ressource.relations.push([configRessource.constantes.relations.assocA, getRandomRessource(true, [ressource.rid])])
      const postData = {
        oid,
        relations: ressource.relations
      }
      return _superTestClient
        .post('/api/ressource')
        .set('Content-Type', 'application/json')
        .set('X-ApiToken', apiTokenEncoded)
        .send(postData)
        .expect(200)
        .then(() => checkDb(ressource))
    }
    return populate({ressources: 10, personnes: 6})
      .then(() => Promise.all(getRessources().map(checkOne)))
      .catch(purgeOnError)
      .then(purge)
  })

  it('DELETE prend un 401 si on veut effacer sans token ni session', function () {
    return populate({ressources: 1, personnes: 1})
      .then(() => {
        const ressource = getRandomRessource()
        return _superTestClient
          .delete(`/api/ressource/${ressource.oid}`)
          .expect(401)
          .expect('Content-type', /application\/json/)
      })
      .then(({body}) => {
        expect(body).to.have.property('message')
        expect(body.message).to.contains('pas de droits suffisants')
        expect(Object.keys(body)).to.have.lengthOf(1, 'Pb sur le nb de propriétés de result')
        return Promise.resolve()
      })
      .catch(purgeOnError)
      .then(purge)
  })

  it('DELETE vire une ressource', function () {
    let ressource
    return populate({ressources: 1, personnes: 1})
      .then(() => {
        ressource = getRandomRessource()
        return _superTestClient
          .delete(`/api/ressource/${ressource.oid}`)
          .set('X-ApiToken', apiTokenEncoded)
          .expect(200)
          .expect('Content-type', /application\/json/)
      })
      .then(({body: result}) => {
        expect(result).to.have.property('message', 'OK', 'Pb sur result.message')
        expect(result).to.have.property('data')
        expect(result.data).to.have.property('deleted', ressource.oid, 'Pb sur result.deleted')
        expect(Object.keys(result)).to.have.lengthOf(2, 'Pb sur le nb de propriétés de result')
      })
      .catch(purgeOnError)
      .then(purge)
  })

  describe('GET /api/ressource/… sur ressource publique', () => {
    let ressources
    const getGlobalPromise = (urlConstructor) => Promise.all(ressources.map(r => checkHttp(urlConstructor(r), r)))

    before(() => purge()
      .then(() => populate({ressources: 6, personnes: 6}))
      .then(() => {
        ressources = getRessources().map(cleanVolatileProperties)
        return Promise.resolve()
      })
      .catch(purgeOnError)
    )

    after(purge)

    it('GET /api/ressource/:oid', () => getGlobalPromise(r => `/api/ressource/${r.oid}`))
    it('GET /api/ressource/:baseId/:oid', () => getGlobalPromise(r => `/api/ressource/${r.rid}`))
    it('GET /api/ressource/:origine/:idOrigine', () => getGlobalPromise(r => `/api/ressource/${r.origine}/${r.idOrigine}`))
    it('GET /api/public/:oid', () => getGlobalPromise(r => `/api/public/${r.oid}`))
    it('GET /api/public/:baseId/:oid', () => getGlobalPromise(r => `/api/public/${r.rid}`))
    it('GET /api/public/:origine/:idOrigine', () => getGlobalPromise(r => `/api/public/${r.origine}/${r.idOrigine}`))
  })
})
