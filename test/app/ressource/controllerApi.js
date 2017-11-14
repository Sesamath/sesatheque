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
import {getRessources, populate, purge} from '../populate'
import boot from '../../boot'
import fakeRessource from '../../helpers/fakeRessource'
import ressourceConfig from '../../../app/ressource/config'

// const {clone} = require('sesajstools/utils/object')
// const {stringify} = require('sesajstools')

describe('controller api ressource', () => {
  let myBaseId
  // pour les appels authentifiés via token
  let apiToken
  let _lassi
  let _superTestClient
  let EntityRessource
  let $settings

  // une erreur toute prête
  const errAbort = new Error('pas la peine de tester ça tant que ça plante avant')
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
      console.log(`en db on a le suffixe ${ressource.suffix} pour ${ressource.oid}`)
      try {
        Object.keys(ressourceExpected).forEach(p => expect(ressource[p]).to.deep.equals(ressourceExpected[p], `pb avec ${p} pour ${oid}`))
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })
  /**
   * Appelle url et vérifie qu'on récupère expected
   * @private
   * @param url
   * @param expected
   * @return {Promise}
   */
  const checkHttp = (url, expected) => {
    const stc = _superTestClient.get(url)
    return checkRessource(stc, expected)
  }

  /**
   * Vérifie qu'un supertestClient ayant envoyé sa requête récupère bien la ressource attendue
   * @private
   * @param stc
   * @param ressExpected
   * @return {Promise}
   */
  const checkRessource = (stc, ressExpected) => new Promise((resolve, reject) => {
    stc
      .expect(200)
      .expect('Content-type', /application\/json/)
      .end((err, res) => {
        if (err) return reject(err)
        try {
          const ress = res.body
          expect(ress).to.be.ok
          expect(ress.oid).to.be.ok
          expect(ress.error).to.be.not.ok
          expect(ress.errors).to.be.not.ok
          Object.keys(ressExpected).forEach(k => {
            if (/^\$/.test(k)) return
            if (ressExpected[k] instanceof Date) expect(ress[k]).to.equals(ressExpected[k].toISOString(), `pb sur propriété ${k}`)
            else expect(ress[k]).to.deep.equal(ressExpected[k], `pb sur propriété ${k}`)
          })
          resolve()
        } catch (error) {
          reject(error)
        }
      })
  })

  // attend un peu…
  // const sleep = (delay = 100, value) => new Promise((resolve) => setTimeout(() => resolve(value), delay))

  // ress publique sans oid ni rid
  const getRessPublicAnonymous = () => fakeRessource({
    nooid: true,
    norid: true,
    // on met une baseId connue, mais pas la notre sinon l'api va virer ces ressources qui n'existent pas chez elle
    relations: [[1, 'sesabibli/1'], [14, 'sesabibli/2']]
  })
  // ress publique sans oid avec rid
  const getRessPublicSsOid = () => fakeRessource({
    nooid: true,
    rid: `${myBaseId}/${faker.random.uuid()}`
  })
  // ress publique avec oid et rid
  const getRessPublic = () => fakeRessource()
  // idem en fixant le type arbre
  const getArbrePublic = () => fakeRessource({
    type: 'arbre'
  })
  // ress privée sans oid ni rid
  const getRessPrivateAnonymous = () => fakeRessource({
    nooid: true,
    norid: true,
    restriction: 1,
    // on met une baseId connue, mais pas la notre sinon l'api va virer ces ressources qui n'existent pas chez elle
    relations: [[1, 'sesabibli/1'], [14, 'sesabibli/2']]
  })
  // ress privée sans oid ni rid
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
  before(() => boot().then(({superTestClient, _lassi}) => {
    if (!superTestClient) return Promise.reject(new Error('boot KO stc'))
    if (!lassi) return Promise.reject(new Error('boot KO lassi'))
    _superTestClient = superTestClient
    _lassi = lassi
    EntityRessource = lassi.service('EntityRessource')
    $settings = lassi.service('$settings')
    apiToken = $settings.get('apiTokens')[0]
    if (!apiToken) return Promise.reject(new Error('pas trouvé apiTokens en configuration'))
    myBaseId = $settings.get('application.baseId')
    if (!myBaseId) return Promise.reject(new Error('pas trouvé de baseId en configuration'))
    // on démarre sur une base vide
    return purge()
  }))

  it('POST enregistre une ressource et retourne son oid', function () {
    const getPostPromise = (ressource) => _superTestClient
      .post('/api/ressource')
      .set('Content-Type', 'application/json')
      .set('X-ApiToken', apiToken)
      .send(ressource)
      .expect(200)
      .then(res => {
        const result = res.body
        // console.log(`après post de ${ressource.oid} ${ressource.rid} on récupère`, result)
        // expect(result).to.have.property('success', true, 'pas de success')
        expect(result).not.to.have.property('error')
        expect(result).to.have.property('oid')
        const {oid} = result
        expect(result).to.deep.equal({oid}, 'pb sur le body retourné')
        ressource.oid = oid
        ressource.rid = `${myBaseId}/${oid}`
        // ressource.suffix++
        return checkDb(ressource)
      })
    return purge().then(() => {
      Promise.all(getTestRessources().map(getPostPromise))
    }).then(purge)
  })

  it('POST /api/ressource met à jour une ressource et incrémente suffix si modif du résumé', function () {
    function checkOne (ressource) {
      const {oid} = ressource
      const expected = {
        oid,
        resume: ressource.resume + faker.lorem.words(),
        suffix: ressource.suffix + 1,
        version: ressource.version
      }
      const postData = {
        oid,
        resume: expected.resume
      }
      console.log(`en db avant post on a le suffixe ${ressource.suffix} pour ${ressource.oid}`)
      return _superTestClient
        .post(`/api/ressource`)
        .set('Content-Type', 'application/json')
        .set('X-ApiToken', apiToken)
        .send(postData)
        .then(() => checkDb(expected))
    }
    return populate({ressources: 10, personnes: 6})
      .then(() => {
        getRessources().forEach(r => console.log(`après populate on a suffix ${r.suffix} pour ${r.oid}`))
        return Promise.all(getRessources().map(checkOne))
      }).then(purge)
  })

  it.skip('POST /api/ressource met à jour une ressource et incrémente version et suffix si modif des auteurs', function (done) {
    if (!oid) return done(errAbort)
    // on reposte un truc qui incrémente la version
    if (!ressource.auteurs) ressource.auteurs = []
    ressource.auteurs.push('external/1')
    // on veut le retrouver
    ressExpected.auteurs = ressource.auteurs
    // et ça doit incrémenter version et suffix
    ressExpected.suffix++
    ressExpected.version++
    const stc = _superTestClient
      .post(`/api/ressource?format=ressource`)
      .set('Content-Type', 'application/json')
      .set('X-ApiToken', apiToken)
      .send({oid, auteurs: ressource.auteurs})
    checkRessource(stc, ressExpected, done)
  })

  it.skip('POST /api/ressource met à jour une ressource sans incrément si modif typePedagogiques seulement', function (done) {
    if (!oid) return done(errAbort)
    // on modifie typePedagogiques
    if (!ressource.typePedagogiques) ressource.typePedagogiques = []
    ressource.typePedagogiques.push(ressourceConfig.constantes.typePedagogiques.evaluation)
    // on veut le retrouver
    ressExpected.typePedagogiques = ressource.typePedagogiques
    // et ça doit incrémenter ni version ni suffix
    const stc = _superTestClient
      .post(`/api/ressource?format=ressource`)
      .set('Content-Type', 'application/json')
      .set('X-ApiToken', apiToken)
      .send({oid, typePedagogiques: ressource.typePedagogiques})
    checkRessource(stc, ressExpected, done)
  })

  it.skip('DELETE prend un 403 si on veut effacer sans token', function (done) {
    if (!oid) return done(errAbort)
    _superTestClient
      .delete(`/api/ressource/${bundleId}`)
      .expect(403)
      .expect('Content-type', /application\/json/)
      .end((err, res) => {
        if (err) return done(err)
        const ress = res.body
        expect(ress).to.be.ok
        expect(ress.error).to.be.ok
        done()
      })
  })

  it.skip("DELETE vire la ressource que l'on vient d'enregistrer", function (done) {
    if (!oid) return done(errAbort)
    const apiToken = _lassi.settings.apiTokens[0]
    _superTestClient
      .delete(`/api/ressource/${bundleId}`)
      .set('X-ApiToken', apiToken)
      .expect(200)
      .expect('Content-type', /application\/json/)
      .end((err, res) => {
        if (err) return done(err)
        const ress = res.body
        expect(ress).to.be.ok
        expect(ress.error).to.be.not.ok
        expect('' + ress.deleted).to.equal('' + bundleId)
        done()
      })
  })

  describe.skip('GET /api/ressource/… sur ressource publique', () => {
    let ressources = []
    const getGlobalPromise = (urlConstructor) => Promise.all(ressources.map(r => checkHttp(urlConstructor(r), r)))

    before(() => purge()
      .then(() => populate({ressources: 10, personnes: 6}))
      .then(() => {
        getRessources().forEach(r => {
          // ces champs peuvent être déduit du reste, on cherche pas à les vérifier
          delete r.typePedagogiques
          delete r.typeDocumentaires
          ressources.push(r)
        })
        return Promise.resolve()
      })
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
