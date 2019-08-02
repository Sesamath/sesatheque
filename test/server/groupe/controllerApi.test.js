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
import faker from 'faker/locale/fr'
import boot from '../../boot'
import {expect} from 'chai'
import {
  createGroupe,
  createPersonne,
  // itBlocksUser,
  itNeedsAuth,
  itIsSuccessfull,
  login,
  logout
} from '../helpers'
import {purge} from '../populate'
import groupes from '../../fixtures/groupes'
import utilisateurs from '../../fixtures/utilisateurs'

const testUser = utilisateurs[0]
const testGroup = groupes[0]

// attention, cette commande purge en base mais pas dans le cache de l'api
// const purgeGroupe = () => purgeOne('EntityGroupe')

// services Lassi chargés dans le before
let agent

describe('API groupe', () => {
  // let EntityGroupe
  let $groupeRepository

  /* const checkGroupe = (expected) => new Promise((resolve) => {
    EntityGroupe.match('nom').equals(expected.nom).grab((error, groups) => {
      expect(!error).to.be.true
      expect(groupes).to.have.length(1)
      const g = groups[0]
      Object.entries(expected).forEach(([key, value]) => {
        expect(g[key]).to.deep.equals(value, `Pb avec groupe.${key}`)
      })
      resolve()
    })
  }) */

  // pour supprimer un groupe dans mongo et le cache de l'api
  const deleteGroupe = (nom) => new Promise((resolve, reject) => {
    $groupeRepository.delete(nom, (error) => error ? reject(error) : resolve())
  })

  before(() => boot().then(({lassi, superTestAgent, testsDone}) => {
    if (!superTestAgent) return Promise.reject(new Error('boot KO supertest non chargé'))
    agent = superTestAgent
    if (!lassi) return Promise.reject(new Error('boot KO lassi'))
    after(testsDone)
    // EntityGroupe = lassi.service('EntityGroupe')
    $groupeRepository = lassi.service('$groupeRepository')
    return purge()
  }))

  after(purge)

  context('sans avoir de session', () => {
    it('/api/groupes/perso denied', async () => {
      const response = await agent.get(`/api/groupes/perso`)
      itNeedsAuth(response, 'Il faut être authentifié pour récupérer ses groupes')
      return Promise.resolve()
    })

    it('/api/groupe/ajouter/unNom denied', async () => {
      const response = await agent.get(`/api/groupe/ajouter/unNom`)
      itNeedsAuth(response, 'Authentification requise')
      return Promise.resolve()
    })

    it('POST /api/groupe denied', async () => {
      const response = await agent
        .post(`/api/groupe`)
        .set('Content-Type', 'application/json')
        .send(testGroup)
      itNeedsAuth(response, 'Vous devez être authentifié pour créer des groupes')
      return Promise.resolve()
    })

    it('autorise la récupération par oid', async () => {
      const groupe = await createGroupe(testGroup)
      const response = await agent.get(`/api/groupe/${groupe.oid}`)
      return itIsSuccessfull(response, testGroup)
        .then(() => deleteGroupe(testGroup.nom))
    })
  })

  context('avec une session', () => {
    beforeEach(async () => {
      await createPersonne(testUser)
      return login(agent, testUser)
    })
    afterEach(async () => {
      await purge()
      return logout(agent)
    })

    it(`création d'un groupe`, async () => {
      const groupeToCreate = testGroup
      delete groupeToCreate.oid // Force une création
      delete groupeToCreate.gestionnaires // on veut vérifier que l'api le rajoute
      const start = Date.now()

      const response = await agent
        .post(`/api/groupe`)
        .send(groupeToCreate)
        .set('Content-Type', 'application/json')

      // On doit être dans les gestionnaires
      groupeToCreate.gestionnaires = [testUser.oid]
      return itIsSuccessfull(response, groupeToCreate)
        .then(() => {
          // et on teste aussi oid & dateCreation
          const {message, data: {oid, dateCreation}} = response.body
          expect(message).to.equals('OK')
          expect(oid).to.exist
          expect(dateCreation).to.exist
          const creationTimestamp = (new Date(dateCreation)).getTime()
          expect(creationTimestamp > start).to.be.true
          expect(creationTimestamp < start + 2000).to.be.true

          return deleteGroupe(testGroup.nom)
        })
    })

    it(`création d'un groupe avec un nom seulement`, () => {
      const groupeName = faker.lorem.words(3)
      const encodedName = encodeURIComponent(groupeName)
      const expected = {
        nom: groupeName,
        ouvert: false,
        public: true,
        gestionnaires: [testUser.oid]
      }

      // Création
      return agent.get(`/api/groupe/ajouter/${encodedName}`)
        .then(itIsSuccessfull)
        // Récupération puis vérifications
        .then(() => agent.get(`/api/groupe/byNom/${encodedName}`))
        .then((response) => itIsSuccessfull(response, expected))
        .then(() => deleteGroupe(groupeName))
    })

    it(`tente la récupération d'un groupe qui n'existe pas (depuis un oid)`, async () => {
      let response = await agent.get(`/api/groupe/groupe-qui-existe-pas`)
      expect(response.status).to.equal(404)
      return Promise.resolve()
    })

    it(`tente la récupération d'un groupe qui existe (depuis un oid)`, async () => {
      const groupe = await createGroupe(testGroup)
      let response = await agent.get(`/api/groupe/${groupe.oid}`)
      return itIsSuccessfull(response, testGroup)
        .then(() => deleteGroupe(testGroup.nom))
    })

    it(`tente la récupération d'un groupe qui n'existe pas (depuis un nom)`, async () => {
      let response = await agent.get(`/api/groupe/byNom/groupe-qui-existe-pas`)
      expect(response.status).to.equal(404)
      return Promise.resolve()
    })

    it(`tente la récupération d'un groupe qui existe (depuis un nom)`, async () => {
      await createGroupe(testGroup)
      let response = await agent.get(`/api/groupe/byNom/${testGroup.nom}`)
      return itIsSuccessfull(response, testGroup)
        .then(() => deleteGroupe(testGroup.nom))
    })

    it(`/api/groupes/perso répond avec les bonnes propriétés`, async () => {
      await createGroupe(testGroup)
      const expectedGroup = {...testGroup, gestionnairesNames: [`${testUser.prenom} ${testUser.nom}`]}
      const expected = {
        groupes: {
          [testGroup.nom]: expectedGroup
        },
        groupesAdmin: [testGroup.nom],
        groupesMembre: [],
        groupesSuivis: []
      }
      const response = await agent.get(`/api/groupes/perso`)
      return itIsSuccessfull(response, expected)
        .then(() => deleteGroupe(testGroup.nom))
    })

    describe('/api/groupes/perso reflète les modifs', () => {
      // on crée plusieurs groupes en base (ouverts & fermés, avec pour chaque cas
      // admin|membre|suivi des groupes à nous et d'autres
      it.skip('retourne nos groupesAdmin')
      // on appelle l'api pour le quitter
      it.skip('quit')
      // puis pour le rejoindre
      it.skip('join')
      it.skip('retourne nos groupesMembre')
      it.skip('follow')
      it.skip('unfollow')
      it.skip('retourne nos groupesSuivis')
    })
  })
})
