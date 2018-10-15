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
import {populate, purge} from '../populate'
import {createRessource} from '../helpers'
import boot from '../boot'
import fixturesRessources from '../../fixtures/ressources'
import {limites} from '../../../app/server/ressource/config'
import Ref from '../../../app/constructors/Ref'
import {update as urlUpdate} from '../../../app/server/lib/url'

const {listeNbDefault} = limites

describe('GET /api/liste', () => {
  // pour les appels authentifiés via token
  // let apiTokenEncoded
  // let $settings
  // le client express instancié en before
  let _superTestClient
  // les ressources mises en bdd
  let ressources

  // les props du format light
  const lightProps = ['oid', 'titre', 'type', 'resume', 'description', 'commentaires']

  // boot + récup des services et config nécessaires à nos tests
  before(() => boot()
    .then(({superTestClient, lassi}) => {
      if (!superTestClient) return Promise.reject(new Error('boot KO stc'))
      if (!lassi) return Promise.reject(new Error('boot KO lassi'))
      _superTestClient = superTestClient
      /* $settings = lassi.service('$settings')
      const apiToken = $settings.get('apiTokens')[0]
      if (!apiToken) return Promise.reject(new Error('pas trouvé apiTokens en configuration'))
      apiTokenEncoded = encodeURIComponent(apiToken) */
      const EntityRessource = lassi.service('EntityRessource')

      // on démarre sur une base peuplée
      return purge()
        .then(() => populate({personne: 3, ressources: 50}))
        .then(() => new Promise((resolve, reject) => {
          EntityRessource.match().sort('oid').grab((error, result) => {
            if (error) return reject(error)
            if (!result || result.length !== 50) return reject(Error('Le populate n’a pas enregistré le nb de ressources prévu'))
            ressources = result
            resolve()
          })
        })).catch((error) => Promise.reject(error))
    }))

  after(purge)

  const checkDefault = (result) => {
    expect(result).to.have.property('message')
    expect(result).to.have.property('data')
    expect(Object.keys(result)).to.have.length(2, 'il ne devrait y avoir que {message, data} dans la réponse')
    const {query, queryOptions, total, liste} = result.data
    expect(query).to.have.property('publie')
    expect(query.publie).to.have.length(1)
    expect(query.publie[0]).to.equals(true)
    expect(query).to.have.property('restriction')
    expect(query.restriction).to.have.length(1)
    expect(query.restriction[0]).to.equals(0)
    expect(queryOptions).to.have.property('limit')
    expect(queryOptions).to.have.property('skip')
    expect(total).to.be.a('Number')
    expect(liste).to.be.a('Array')
  }

  const checkAsRef = (item, ressource) => {
    const ref = new Ref(ressource)
    Object.keys(ref).forEach(p => expect(item[p]).to.deep.equals(ref[p], `Pb sur prop ${p}`))
  }

  it('sans argument retourne toutes les ressources (publiques)', function () {
    return _superTestClient
      .get('/api/liste')
      .set('Content-Type', 'application/json')
      .expect(200)
      .then(res => {
        const result = res.body
        checkDefault(result)
        const d = result.data
        expect(d.queryOptions.limit).to.equals(listeNbDefault)
        expect(d.queryOptions.skip).to.equals(0)
        expect(d.total).to.equals(50)
        expect(d.liste).to.have.length(listeNbDefault)
        return Promise.resolve()
      })
  })

  it('format light', function () {
    return _superTestClient
      .get('/api/liste?format=light')
      .set('Content-Type', 'application/json')
      .expect(200)
      .then(res => {
        const result = res.body
        checkDefault(result)
        const d = result.data
        expect(d.queryOptions.limit).to.equals(listeNbDefault)
        expect(d.queryOptions.skip).to.equals(0)
        expect(d.total).to.equals(50)
        expect(d.liste).to.have.length(listeNbDefault)
        d.liste.forEach((item, i) => {
          lightProps.forEach((prop) => expect(item[prop]).to.equals(ressources[i][prop], `Pb avec ${prop} pour ${i}`))
        })
        return Promise.resolve()
      })
  })

  it('orderBy asc', function () {
    const url = urlUpdate('/api/liste', {orderBy: 'oid'})

    return _superTestClient
      .get(url)
      .set('Content-Type', 'application/json')
      .expect(200)
      .then(res => {
        const result = res.body
        checkDefault(result)
        const d = result.data
        expect(d.queryOptions.limit).to.equals(listeNbDefault)
        expect(d.queryOptions.skip).to.equals(0)
        expect(d.total).to.equals(50)
        expect(d.liste).to.have.length(listeNbDefault)
        d.liste.forEach((item, i) => {
          checkAsRef(item, ressources[i])
        })
        return Promise.resolve()
      })
  })

  it('orderBy desc', function () {
    const url = urlUpdate('/api/liste', {orderBy: ['oid', 'desc']})

    return _superTestClient
      .get(url)
      .set('Content-Type', 'application/json')
      .expect(200)
      .then(res => {
        const result = res.body
        checkDefault(result)
        const d = result.data
        expect(d.queryOptions.limit).to.equals(listeNbDefault)
        expect(d.queryOptions.skip).to.equals(0)
        expect(d.total).to.equals(50)
        expect(d.liste).to.have.length(listeNbDefault)
        d.liste.forEach((item, i) => checkAsRef(item, ressources[49 - i]))
        return Promise.resolve()
      })
  })

  describe('Recherche en texte libre', () => {
    before(async () => {
      await createRessource(fixturesRessources[0])
      await createRessource(fixturesRessources[1])
      await createRessource(fixturesRessources[2])
    })

    it(`récupère des ressources à partir d'une partie de titre`, function () {
      const url = urlUpdate('/api/liste', {fulltext: ['exercice']})

      return _superTestClient
        .get(url)
        .set('Content-Type', 'application/json')
        .expect(200)
        .then(res => {
          const result = res.body
          const data = result.data
          expect(data.total).to.equals(2)
          expect(data.liste[0].titre).to.equals('Mon exercice IEP')
          expect(data.liste[1].titre).to.equals('Mon exercice ARBRE')
          return Promise.resolve()
        })
    })

    it(`récupère une ressource à partir de son titre`, function () {
      const url = urlUpdate('/api/liste', {fulltext: ['ARBRE']})

      return _superTestClient
        .get(url)
        .set('Content-Type', 'application/json')
        .expect(200)
        .then(res => {
          const result = res.body
          const data = result.data
          expect(data.total).to.equals(1)
          expect(data.liste[0].titre).to.equals('Mon exercice ARBRE')
          return Promise.resolve()
        })
    })

    it(`récupère une ressource à partir de sa description`, function () {
      const url = urlUpdate('/api/liste', {fulltext: ['description originale']})

      return _superTestClient
        .get(url)
        .set('Content-Type', 'application/json')
        .expect(200)
        .then(res => {
          const result = res.body
          const data = result.data
          expect(data.total).to.equals(1)
          expect(data.liste[0].titre).to.equals('Mon exercice ARBRE')
          return Promise.resolve()
        })
    })
  })
})
