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
import boot from '../boot'
import {expect} from 'chai'
import groupes from '../../fixtures/groupes'
import {
  createGroupe,
  createPersonne,
  itBlocksUser,
  itIsSuccessfull,
  login,
  logout
} from '../helpers'
import {purge} from '../populate'
import utilisateurs from '../../fixtures/utilisateurs'
const personne = utilisateurs[0]

// services Lassi chargés dans le before
let agent
let apiTokenEncoded
let $settings

describe('API groupe', () => {
  before(() => boot().then(({superTestAgent, lassi}) => {
    if (!superTestAgent) return Promise.reject(new Error('boot KO supertest non chargé'))
    agent = superTestAgent

    if (!lassi) return Promise.reject(new Error('boot KO lassi'))
    $settings = lassi.service('$settings')

    const apiToken = $settings.get('apiTokens')[0]
    if (!apiToken) return Promise.reject(new Error('pas trouvé apiTokens en configuration'))
    apiTokenEncoded = encodeURIComponent(apiToken)

    return purge()
  }))

  context('sans avoir de session', () => {
    it(`empèche la récupération des groupes pour un compte non identifié`, async () => {
      const response = await agent
        .get(`/api/groupes/perso`)
        .set('Content-Type', 'application/json')

      itBlocksUser(response, `Il faut être authentifié pour récupérer ses groupes`)
    })
  })

  context('avec une session', () => {
    before(async () => {
      await purge()
      return createPersonne(personne)
    })
    beforeEach(() => login(agent, personne))
    afterEach(() => logout(agent))
    after(() => purge())

    it(`création d'un groupe`, async () => {
      // On s'approprie le groupe de fixture
      const groupeToCreate = groupes[0]
      delete groupeToCreate.oid // Force une création
      groupeToCreate.gestionnaires = [personne.oid]

      let response = await agent
        .post(`/api/groupe`)
        .send(groupeToCreate)
        .set('Content-Type', 'application/json')
        .set('X-ApiToken', apiTokenEncoded)

      itIsSuccessfull(response)
      expect(response.body.oid).to.exist
      expect(response.body.creationDate).to.exist
      expect(response.body.ouvert).to.equal(groupeToCreate.ouvert)
      expect(response.body.public).to.equal(groupeToCreate.public)
      expect(response.body.gestionnaires).to.be.an('array').that.includes(personne.oid)

      return response
    })

    it(`création d'un groupe avec un nom seulement`, async () => {
      const groupeName = `group-${Math.random()}`

      // Création
      let response = await agent
        .get(`/api/groupe/ajouter/${groupeName}`)
        .set('Content-Type', 'application/json')
        .set('X-ApiToken', apiTokenEncoded)
      itIsSuccessfull(response)

      // Récupération puis vérifications
      response = await agent
        .get(`/api/groupe/byNom/${groupeName}`)
        .set('Content-Type', 'application/json')
        .set('X-ApiToken', apiTokenEncoded)

      itIsSuccessfull(response)
      expect(response.body.oid).to.exist
      expect(response.body.nom).to.equal(groupeName)
      expect(response.body.gestionnaires).to.be.an('array').that.includes(personne.oid)
      expect(response.body.ouvert).to.equal(false)
      expect(response.body.public).to.equal(true)

      return response
    })

    it(`tente la récupération d'un groupe qui n'existe pas (depuis un oid)`, async () => {
      let response = await agent
        .get(`/api/groupe/groupe-qui-existe-pas`)
        .set('Content-Type', 'application/json')
        .set('X-ApiToken', apiTokenEncoded)

      expect(response.status).to.equal(404)
      return response
    })

    it(`tente la récupération d'un groupe qui existe (depuis un oid)`, async () => {
      const groupe = await createGroupe(groupes[0], [personne.oid])
      let response = await agent
        .get(`/api/groupe/${groupe.oid}`)
        .set('Content-Type', 'application/json')
        .set('X-ApiToken', apiTokenEncoded)

      expect(response.status).to.equal(200)
      expect(response.body.oid).to.equal(groupe.oid)
      expect(response.body.nom).to.equal(groupe.nom)

      return response
    })

    it(`tente la récupération d'un groupe qui n'existe pas (depuis un nom)`, async () => {
      let response = await agent
        .get(`/api/groupe/byNom/groupe-qui-existe-pas`)
        .set('Content-Type', 'application/json')
        .set('X-ApiToken', apiTokenEncoded)

      expect(response.status).to.equal(404)
      return response
    })

    it(`tente la récupération d'un groupe qui existe (depuis un nom)`, async () => {
      await createGroupe(groupes[0], [personne.oid])
      let response = await agent
        .get(`/api/groupe/byNom/${groupes[0].nom}`)
        .set('Content-Type', 'application/json')
        .set('X-ApiToken', apiTokenEncoded)

      expect(response.status).to.equal(200)

      return response
    })

    it(`récupère les groupes d'un utilisateur`, async () => {
      let response = await agent
        .get(`/api/groupes/perso`)
        .set('Content-Type', 'application/json')
        .set('X-ApiToken', apiTokenEncoded)

      itIsSuccessfull(response)
      expect(response.body.groupes).to.be.an('object')

      return response
    })
  })
})
