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
import boot from '../boot'
import {limites} from '../../../app/server/ressource/config'
import Ref from '../../../app/constructors/Ref'
import {update as urlUpdate} from '../../../app/server/lib/url'

const {listeNbDefault} = limites

describe('GET /api/liste', () => {
  // pour les appels authentifiés via token
  let apiTokenEncoded
  // le client express instancié en before
  let _superTestClient
  let $settings
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
      $settings = lassi.service('$settings')
      const apiToken = $settings.get('apiTokens')[0]
      if (!apiToken) return Promise.reject(new Error('pas trouvé apiTokens en configuration'))
      apiTokenEncoded = encodeURIComponent(apiToken)
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
    expect(result).not.to.have.property('error')
    expect(result).to.have.property('success')
    expect(result.success).to.be.true
    expect(result).not.to.have.property('warnings')
    expect(result).to.have.property('query')
    expect(result.query).to.have.property('publie')
    expect(result.query.publie).to.have.length(1)
    expect(result.query.publie[0]).to.equals(true)
    expect(result.query).to.have.property('restriction')
    expect(result.query.restriction).to.have.length(1)
    expect(result.query.restriction[0]).to.equals(0)
    expect(result).to.have.property('queryOptions')
    expect(result.queryOptions).to.have.property('limit')
    expect(result.queryOptions).to.have.property('skip')
    expect(result).to.have.property('total')
    expect(result).to.have.property('liste')
  }

  const checkAsRef = (item, ressource) => {
    const ref = new Ref(ressource)
    Object.keys(ref).forEach(p => expect(item[p]).to.deep.equals(ref[p], `Pb sur prop ${p}`))
  }

  it('sans argument retourne tout', function () {
    return _superTestClient
      .get('/api/liste')
      .set('Content-Type', 'application/json')
      .expect(200)
      .then(res => {
        const result = res.body
        expect(result.queryOptions.limit).to.equals(listeNbDefault)
        expect(result.queryOptions.skip).to.equals(0)
        expect(result.total).to.equals(50)
        expect(result.liste).to.have.length(listeNbDefault)
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
        expect(result.queryOptions.limit).to.equals(listeNbDefault)
        expect(result.queryOptions.skip).to.equals(0)
        expect(result.total).to.equals(50)
        expect(result.liste).to.have.length(listeNbDefault)
        result.liste.forEach((item, i) => {
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
        expect(result.queryOptions.limit).to.equals(listeNbDefault)
        expect(result.queryOptions.skip).to.equals(0)
        expect(result.total).to.equals(50)
        expect(result.liste).to.have.length(listeNbDefault)
        result.liste.forEach((item, i) => checkAsRef(item, ressources[49 - i]))
        return Promise.resolve()
      })
  })
})
