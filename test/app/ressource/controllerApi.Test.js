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
/* global stClient */
import {expect} from 'chai'
import fakeRessource from '../../helpers/fakeRessource'

const {clone} = require('sesajstools/utils/object')
const {stringify} = require('sesajstools')

module.exports = function describeControllerApi () {
  /** {string} l'oid mis par l'appli à l'enregistrement du post */
  let oid
  /** {Ressource} Ressource de test à poster */
  let ressource
  /** {Ressource} Ressource attendue en retour */
  let ressExpected
  // pour le test via origine/idOrigine
  let bundleId
  // pour les appels authentifiés via token
  let apiToken
  // une erreur toute prête
  const errAbort = new Error('pas la peine de tester ça tant que ça plante avant')

  it('POST enregistre une ressource et retourne son oid', function () {
    // on peut ajouter ce qui nous manquait
    apiToken = lassi.settings.apiTokens[0]
    const myBaseId = lassi.settings.application.baseId
    ressource = fakeRessource({
      nooid: true,
      norid: true,
      origine: myBaseId,
      noidOrigine: true,
      // on met une baseId connue, mais pas la notre sinon l'api va virer ces users qui n'existent pas
      relations: [[1, 'sesabibli/1'], [14, 'sesabibli/2']]
    })
    ressExpected = clone(ressource)
    // ressExpected.relations = [[1, myBaseId + '/1'], [14, myBaseId + '/2']]
    // on la poste sans oid ni rid
    delete ressource.oid
    delete ressource.rid

    // ce test
    return stClient
      .post('/api/ressource')
      .set('Content-Type', 'application/json')
      .set('X-ApiToken', apiToken)
      .send(ressource)
      .expect(200)
      .then(res => {
        // console.log('res', res.body)
        expect(res.body).to.be.ok
        expect(res.body.error).to.be.not.ok
        expect(res.body.errors).to.be.not.ok
        expect(res.body.oid).to.be.ok
        oid = res.body.oid // string
        bundleId = myBaseId + '/' + oid
        expect(res.body).to.deep.equal({ oid: oid }, 'pb sur le body retourné')
        // si ce test est passé on a l'oid que l'on ajoute pour les tests suivants
        ressExpected.oid = oid
        ressExpected.rid = bundleId
        ressExpected.idOrigine = '' + oid
      })
  })

  it('GET /api/ressource/:oid récupère la ressource envoyée précédemment', function (done) {
    if (!oid) return done(errAbort)
    stClient
      .get(`/api/ressource/${oid}`)
      .expect(200)
      .expect('Content-type', /application\/json/)
      .end((err, res) => {
        if (err) return done(err)
        const ress = res.body
        expect(ress).to.be.ok
        expect(ress.error).to.be.not.ok
        expect(ress.errors).to.be.not.ok
        Object.keys(ressExpected).forEach(k => {
          expect(ress[ k ]).to.deep.equal(ressExpected[ k ], `propriété ${k} vaut ${stringify(ress[k])} et pas ${stringify(ressExpected[k])}`)
        })
        done()
      })
  })

  it('GET /api/public/:oid récupère la ressource envoyée précédemment', function (done) {
    if (!oid) return done(errAbort)
    stClient
      .get(`/api/public/${oid}`)
      .expect(200)
      .expect('Content-type', /application\/json/)
      .end((err, res) => {
        if (err) return done(err)
        const ress = res.body
        expect(ress).to.be.ok
        expect(ress.error).to.be.not.ok
        expect(ress.errors).to.be.not.ok
        Object.keys(ressExpected).forEach(k => {
          expect(ress[ k ]).to.deep.equal(ressExpected[ k ], `propriété ${k}`)
        })
        done()
      })
  })

  it('GET /api/ressource/:origine/:idOrigine récupère la ressource envoyée précédemment', function (done) {
    if (!oid) return done(errAbort)
    stClient
      .get(`/api/ressource/${bundleId}`)
      .expect(200)
      .expect('Content-type', /application\/json/)
      .end((err, res) => {
        if (err) return done(err)
        const ress = res.body
        expect(ress).to.be.ok
        expect(ress.error).to.be.not.ok
        expect(ress.errors).to.be.not.ok
        Object.keys(ressExpected).forEach(k => {
          expect(ress[ k ]).to.deep.equal(ressExpected[ k ], `propriété ${k}`)
        })
        done()
      })
  })

  it('DELETE prend un 403 si on veut effacer sans token', function (done) {
    if (!oid) return done(errAbort)
    stClient
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

  it("DELETE vire la ressource que l'on vient d'enregistrer", function (done) {
    if (!oid) return done(errAbort)
    const apiToken = lassi.settings.apiTokens[0]
    stClient
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
}
