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
// import Ressource from '../../../app/constructors/Ressource'
import {getRandomPersonne, getRandomRessource, getRessources, populate, purge} from '../populate'
import boot from '../boot'
import fakeRessource from '../../helpers/fakeRessource'
import configRessource from '../../../app/ressource/config'

// const {clone} = require('sesajstools/utils/object')
// const {stringify} = require('sesajstools')

describe('controller api ressource', () => {
  let myBaseId
  // pour les appels authentifiés via token
  let apiTokenEncoded
  let _superTestClient
  let EntityRessource
  let $settings
  // pour le mettre en argument de .catch()
  const catcher = Promise.reject.bind(Promise)
  // const catcher = (error) => Promise.reject(error)

  /**
   * Vérifie que ressourceExpected est bien en db
   * @private
   * @param ressourceExpected
   * @return {Promise}
   */
  const checkDb = (ressourceExpected) => new Promise((resolve, reject) => {
    if (!ressourceExpected.oid) return reject(new Error('ressource attendue sans oid'))
    const {oid} = ressourceExpected
    EntityRessource.match('oid').equals(oid).grabOne((error, ressource) => {
      if (error) return reject(error)
      if (!ressource) return reject(new Error(`aucune resssource ${oid} en base`))
      try {
        // console.log(`pour ${ressource.oid} version en db ${ressource.version}`)
        // Object.keys(ressourceExpected).forEach(p => expect(ressource[p]).to.deep.equals(ressourceExpected[p], `pb avec ${p} pour ${oid} : ${JSON.stringify(ressource[p])} ≠ ${JSON.stringify(ressourceExpected[p])}`))
        Object.keys(ressourceExpected).forEach(p => expect(JSON.stringify(ressource[p])).to.equals(JSON.stringify(ressourceExpected[p]), `pb avec ${p} pour ${oid}`))
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })
  /**
   * Appelle url en get et vérifie qu'on récupère expected
   * @private
   * @param url
   * @param expected
   * @return {Promise}
   */
  const checkHttp = (url, expected) => checkHttpResult(_superTestClient.get(url), expected)

  /**
   * Vérifie qu'un supertestClient ayant envoyé sa requête récupère bien la ressource attendue
   * @private
   * @param stc
   * @param expected
   * @return {Promise}
   */
  const checkHttpResult = (stc, expected) => stc
    .expect(200)
    .expect('Content-type', /application\/json/)
    .then((res) => {
      try {
        const ressource = res.body
        cleanVolatileProperties(expected)
        expect(ressource).to.have.property('oid', expected.oid)
        expect(ressource.error).to.be.empty
        expect(ressource.errors).to.be.empty
        expect(ressource.warnings).to.be.empty
        Object.keys(expected).forEach(k => {
          // if (expected[k] instanceof Date) expect(ressource[k]).to.equals(expected[k].toISOString(), `pb sur propriété ${k}`)
          // else expect(ressource[k]).to.deep.equal(expected[k], `pb sur propriété ${k}`)
          expect(JSON.stringify(ressource[k])).to.equal(JSON.stringify(expected[k]), `pb sur propriété ${k}`)
        })
        return Promise.resolve()
      } catch (error) {
        return Promise.reject(error)
      }
    })
    .catch(catcher)

  // nettoie une entity pour en faire un objet presque plain sans ses propriétés volatiles ($original ou dateMiseAJour)
  // ou susceptible d'être modifiées par un post (typeDoc & typePeda)
  const cleanVolatileProperties = (ressource) => {
    // typeDoc et typePeda peuvent avoir été re-générés par le post, on les vérifie pas
    delete ressource.typeDocumentaires
    delete ressource.typePedagogiques
    // pour dateMiseAJour idem, c'est normal que ça change
    delete ressource.dateMiseAJour
    // on vire aussi toutes les méthodes et propriétés $
    Object.keys(ressource).forEach(p => {
      if (/^\$/.test(p) || typeof ressource[p] === 'function') delete ressource[p]
    })
    return ressource
  }

  // attend un peu…
  // const sleep = (delay = 100, value) => new Promise((resolve) => setTimeout(() => resolve(value), delay))

  // ressource publique sans oid ni rid
  const getRessPublicAnonymous = () => fakeRessource({
    nooid: true,
    norid: true,
    // on met une baseId connue, mais pas la notre sinon l'api va virer ces ressources qui n'existent pas chez elle
    relations: [[1, 'sesabibli/1'], [14, 'sesabibli/2']]
  })
  // ressource publique sans oid avec rid
  const getRessPublicSsOid = () => fakeRessource({
    nooid: true,
    rid: `${myBaseId}/${faker.random.uuid()}`
  })
  // ressource publique avec oid et rid
  const getRessPublic = () => fakeRessource()
  // idem en fixant le type arbre
  const getArbrePublic = () => fakeRessource({
    type: 'arbre'
  })
  // ressource privée sans oid ni rid
  const getRessPrivateAnonymous = () => fakeRessource({
    nooid: true,
    norid: true,
    restriction: 1,
    // on met une baseId connue, mais pas la notre sinon l'api va virer ces ressources qui n'existent pas chez elle
    relations: [[1, 'sesabibli/1'], [14, 'sesabibli/2']]
  })
  // ressource privée sans oid ni rid
  const getRessUnpublishedAnonymous = () => fakeRessource({
    nooid: true,
    norid: true,
    publie: false,
    // on met une baseId connue, mais pas la notre sinon l'api va virer ces ressources qui n'existent pas chez elle
    relations: [[1, 'sesabibli/1'], [14, 'sesabibli/2']]
  })
  // toutes ces ressources
  const getTestRessources = () => [
    getRessPublicAnonymous(),
    getRessPublicSsOid(),
    getRessPublic(),
    getArbrePublic(),
    getRessPrivateAnonymous(),
    getRessUnpublishedAnonymous()
  ]

  // boot + récup des services et config nécessaires à nos tests
  before(() => boot().then(({superTestClient, lassi}) => {
    if (!superTestClient) return Promise.reject(new Error('boot KO stc'))
    if (!lassi) return Promise.reject(new Error('boot KO lassi'))
    _superTestClient = superTestClient
    EntityRessource = lassi.service('EntityRessource')
    $settings = lassi.service('$settings')
    const apiToken = $settings.get('apiTokens')[0]
    if (!apiToken) return Promise.reject(new Error('pas trouvé apiTokens en configuration'))
    apiTokenEncoded = encodeURIComponent(apiToken)
    myBaseId = $settings.get('application.baseId')
    if (!myBaseId) return Promise.reject(new Error('pas trouvé de baseId en configuration'))
    // on démarre sur une base vide
    return purge()
  }))

  it('POST enregistre une ressource et retourne son oid', function () {
    const getPostPromise = (ressource) => _superTestClient
      .post('/api/ressource')
      .set('Content-Type', 'application/json')
      .set('X-ApiToken', apiTokenEncoded)
      .send(ressource)
      .expect(200)
      .then(res => {
        try {
          const result = res.body
          // console.log(`après post de ${ressource.oid} ${ressource.rid} on récupère`, result)
          // expect(result).to.have.property('success', true, 'pas de success')
          expect(result).not.to.have.property('error')
          expect(result).to.have.property('oid')
          const {oid} = result
          expect(result).to.deep.equal({oid}, 'pb sur le body retourné')
          ressource.oid = oid
          ressource.rid = `${myBaseId}/${oid}`
          cleanVolatileProperties(ressource)
          // la ressource n'existait pas donc le inc doit être incrémenté, la version aussi
          // ressource.inc++
          delete ressource.inc
          delete ressource.version
          return checkDb(ressource)
        } catch (error) {
          return Promise.reject(error)
        }
      }).catch(catcher)

    return purge()
      .then(() => {
        Promise.all(getTestRessources().map(getPostPromise))
      }).then(purge)
      .catch(catcher)
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
        .post(`/api/ressource`)
        .set('Content-Type', 'application/json')
        .set('X-ApiToken', apiTokenEncoded)
        .send(postData)
        .then(() => checkDb(ressource))
        .catch(catcher)
    }
    return populate({ressources: 10, personnes: 6})
      .then(() => Promise.all(getRessources().map(checkOne)))
      .then(purge)
      .catch(catcher)
  })

  it('POST /api/ressource met à jour une ressource et incrémente version et inc si modif des auteurs', () => {
    function checkOne (ressource) {
      const {oid} = ressource
      cleanVolatileProperties(ressource)
      // on ajoute un auteur
      const existingPids = ressource.auteurs.concat(ressource.contributeurs)
      ressource.auteurs.push(getRandomPersonne(true, existingPids))
      ressource.inc++
      ressource.version++
      // on vire ça des propriétés à vérifier car ça va changer
      delete ressource.archiveOid
      const postData = {
        oid,
        auteurs: ressource.auteurs
      }
      return _superTestClient
        .post(`/api/ressource`)
        .set('Content-Type', 'application/json')
        .set('X-ApiToken', apiTokenEncoded)
        .send(postData)
        .then(() => checkDb(ressource))
        .catch(catcher)
    }
    return populate({ressources: 10, personnes: 6})
      .then(() => Promise.all(getRessources().map(checkOne)))
      .then(purge)
      .catch(catcher)
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
        .post(`/api/ressource`)
        .set('Content-Type', 'application/json')
        .set('X-ApiToken', apiTokenEncoded)
        .send(postData)
        .then(() => checkDb(ressource))
        .catch(catcher)
    }
    return populate({ressources: 10, personnes: 6})
      .then(() => Promise.all(getRessources().map(checkOne)))
      .then(purge)
      .catch(catcher)
  })

  it('DELETE prend un 403 si on veut effacer sans token', function () {
    return populate({ressources: 1, personnes: 1})
      .then(() => {
        const ressource = getRandomRessource()
        return _superTestClient
          .delete(`/api/ressource/${ressource.oid}`)
          .expect(403)
          .expect('Content-type', /application\/json/)
      })
      .then((res) => {
        const result = res.body
        expect(result).to.have.property('success', false, 'Pb sur result.success')
        expect(result, 'Pb sur result.error').to.have.property('error')
        expect(Object.keys(result)).to.have.lengthOf(2, 'Pb sur le nb de propriétés de result')
        return Promise.resolve()
      })
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
      .then((res) => {
        const result = res.body
        expect(result).to.have.property('success', true, 'Pb sur result.success')
        expect(result).to.have.property('deleted', ressource.oid, 'Pb sur result.deleted')
        expect(Object.keys(result)).to.have.lengthOf(2, 'Pb sur le nb de propriétés de result')
        return Promise.resolve()
      })
      .then(purge)
      .catch(catcher)
  })

  describe('GET /api/ressource/… sur ressource publique', () => {
    let ressources
    const getGlobalPromise = (urlConstructor) => Promise.all(ressources.map(r => checkHttp(urlConstructor(r), r)))

    before(() => purge()
      .then(() => populate({ressources: 6, personnes: 6}))
      .then(() => {
        ressources = getRessources().map(cleanVolatileProperties)
        return Promise.resolve()
      }).catch(catcher)
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
