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
/* global superTestClient */
import {expect} from 'chai'
import fakeRessource from '../../helpers/fakeRessource'
import ressourceConfig from '../../../app/ressource/config'

const {clone} = require('sesajstools/utils/object')
// const {stringify} = require('sesajstools')

/**
 * Vérifie qu'un supertestClient ayant envoyé sa requête récupère bien la ressource attendue
 * @param stc
 * @param ressExpected
 * @param done
 */
function checkRessource (stc, ressExpected, done) {
  stc
    .expect(200)
    .expect('Content-type', /application\/json/)
    .end((err, res) => {
      if (err) return done(err)
      const ress = res.body
      expect(ress).to.be.ok
      expect(ress.oid).to.be.ok
      expect(ress.error).to.be.not.ok
      expect(ress.errors).to.be.not.ok
      Object.keys(ressExpected).forEach(k => {
        expect(ress[k]).to.deep.equal(ressExpected[k], `propriété ${k}`)
      })
      done()
    })
}

module.exports = function describeControllerApi () {
  /** {string} l'oid mis par l'appli à l'enregistrement du post */
  let oid
  /** {Ressource} Ressource de test à poster */
  let ressource
  /** {Ressource} Ressource attendue en retour */
  let ressExpected
  // pour le test via origine/idOrigine
  const bundleId = 'fakeOrigine/42'
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
      origine: 'fakeOrigine',
      idOrigine: '42',
      // on met une baseId connue, mais pas la notre sinon l'api va virer ces ressources qui n'existent pas chez elle
      relations: [[1, 'sesabibli/1'], [14, 'sesabibli/2']]
    })
    ressExpected = clone(ressource)
    // ressExpected.relations = [[1, myBaseId + '/1'], [14, myBaseId + '/2']]
    ressExpected.version = 1
    ressExpected.suffix = 1

    return superTestClient
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
        expect(res.body).to.deep.equal({ oid: oid }, 'pb sur le body retourné')
        // si ce test est passé on a l'oid que l'on ajoute pour les tests suivants
        ressExpected.oid = oid
        ressExpected.rid = `${myBaseId}/${oid}`
        return Promise.resolve()
      })
  })

  it('GET /api/ressource/:oid récupère la ressource envoyée précédemment', function (done) {
    if (!oid) return done(errAbort)
    const stc = superTestClient.get(`/api/ressource/${oid}`)
    checkRessource(stc, ressExpected, done)
  })

  it('GET /api/ressource/:origine/:idOrigine récupère la ressource envoyée précédemment', function (done) {
    if (!oid) return done(errAbort)
    const stc = superTestClient.get(`/api/ressource/${bundleId}`)
    checkRessource(stc, ressExpected, done)
  })

  it('GET /api/public/:oid récupère la ressource envoyée précédemment', function (done) {
    if (!oid) return done(errAbort)
    const stc = superTestClient.get(`/api/public/${oid}`)
    checkRessource(stc, ressExpected, done)
  })

  it('GET /api/public/:origine/:idOrigine récupère la ressource envoyée précédemment', function (done) {
    if (!oid) return done(errAbort)
    const stc = superTestClient.get(`/api/public/${bundleId}`)
    checkRessource(stc, ressExpected, done)
  })

  it('POST /api/ressource met à jour une ressource et incrémente suffix si modif du résumé', function (done) {
    if (!oid) return done(errAbort)
    const ajout = '\nbla bla sup'
    ressource.resume += ajout
    ressExpected.resume += ajout
    ressExpected.suffix++
    const stc = superTestClient
      .post(`/api/ressource?format=ressource`)
      .set('Content-Type', 'application/json')
      .set('X-ApiToken', apiToken)
      .send({oid, resume: ressource.resume})
    checkRessource(stc, ressExpected, done)
  })

  it('POST /api/ressource met à jour une ressource et incrémente version et suffix si modif des auteurs', function (done) {
    if (!oid) return done(errAbort)
    // on reposte un truc qui incrémente la version
    if (!ressource.auteurs) ressource.auteurs = []
    ressource.auteurs.push('external/1')
    // on veut le retrouver
    ressExpected.auteurs = ressource.auteurs
    // et ça doit incrémenter version et suffix
    ressExpected.suffix++
    ressExpected.version++
    const stc = superTestClient
      .post(`/api/ressource?format=ressource`)
      .set('Content-Type', 'application/json')
      .set('X-ApiToken', apiToken)
      .send({oid, auteurs: ressource.auteurs})
    checkRessource(stc, ressExpected, done)
  })

  it('POST /api/ressource met à jour une ressource sans incrément si modif typePedagogiques seulement', function (done) {
    if (!oid) return done(errAbort)
    // on modifie typePedagogiques
    if (!ressource.typePedagogiques) ressource.typePedagogiques = []
    ressource.typePedagogiques.push(ressourceConfig.constantes.typePedagogiques.evaluation)
    // on veut le retrouver
    ressExpected.typePedagogiques = ressource.typePedagogiques
    // et ça doit incrémenter ni version ni suffix
    const stc = superTestClient
      .post(`/api/ressource?format=ressource`)
      .set('Content-Type', 'application/json')
      .set('X-ApiToken', apiToken)
      .send({oid, typePedagogiques: ressource.typePedagogiques})
    checkRessource(stc, ressExpected, done)
  })

  it('DELETE prend un 403 si on veut effacer sans token', function (done) {
    if (!oid) return done(errAbort)
    superTestClient
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
    superTestClient
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
