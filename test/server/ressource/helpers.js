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
import fakeRessource from '../../fixtures/fakeRessource'

import config from '../../../app/server/config'
const {application: {baseId: myBaseId}} = config

export default function helpersFactory (lassi, superTestClient) {
  const EntityRessource = lassi.service('EntityRessource')

  /**
   * Une fonction à passer à un promise.catch()
   * @type {function}
   */
  const catcher = Promise.reject.bind(Promise)
  // revient au même que
  // const catcher = (error) => Promise.reject(error)

  /**
   * Vérifie que ressourceExpected est bien en db
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
   * @param url
   * @param expected
   * @return {Promise}
   */
  const checkHttp = (url, expected) => checkHttpResult(superTestClient.get(url), expected)

  /**
   * Vérifie qu'un supertestClient ayant envoyé sa requête récupère bien la ressource attendue
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
        expect(ressource.error).to.be.undefined
        expect(ressource.errors).to.be.undefined
        expect(ressource.warnings).to.be.undefined
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

  /**
   * Nettoie une entity pour en faire un objet presque plain sans ses propriétés volatiles
   * ($original ou dateMiseAJour) ou susceptible d'être modifiées par un post (typeDoc & typePeda)
   * @param {EntityRessource} ressource
   * @return {Ressource}
   */
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

  /**
   * arbre public avec oid et rid
   * @return {Ressource}
   */
  const getArbrePublic = () => fakeRessource({type: 'arbre'})

  /**
   * ressource publique avec oid et rid
   * @return {Ressource}
   */
  const getRessPublic = () => fakeRessource()

  /**
   * ressource publique sans oid ni rid
   * @return {Ressource}
   */
  const getRessPublicAnonymous = () => fakeRessource({
    nooid: true,
    norid: true,
    // on met une baseId connue, mais pas la notre sinon l'api va virer ces ressources qui n'existent pas chez elle
    relations: [[1, 'sesabibli/1'], [14, 'sesabibli/2']]
  })

  /**
   * ressource publique sans oid avec rid
   * @return {Ressource}
   */
  const getRessPublicSsOid = () => fakeRessource({
    nooid: true,
    rid: `${myBaseId}/${faker.random.uuid()}`
  })

  /**
   * ressource privée sans oid ni rid
   * @return {Ressource}
   */
  const getRessPrivateAnonymous = () => fakeRessource({
    nooid: true,
    norid: true,
    restriction: 1,
    // on met une baseId connue, mais pas la notre sinon l'api va virer ces ressources qui n'existent pas chez elle
    relations: [[1, 'sesabibli/1'], [14, 'sesabibli/2']]
  })

  /**
   * ressource privée sans oid ni rid
   * @return {Ressource}
   */
  const getRessUnpublishedAnonymous = () => fakeRessource({
    nooid: true,
    norid: true,
    publie: false,
    // on met une baseId connue, mais pas la notre sinon l'api va virer ces ressources qui n'existent pas chez elle
    relations: [[1, 'sesabibli/1'], [14, 'sesabibli/2']]
  })

  /**
   * Retourne un assortiment de ressources
   * @return {Ressource[]}
   */
  const getTestRessources = () => [
    getRessPublicAnonymous(),
    getRessPublicSsOid(),
    getRessPublic(),
    getArbrePublic(),
    getRessPrivateAnonymous(),
    getRessUnpublishedAnonymous()
  ]

  return {
    catcher,
    checkDb,
    checkHttp,
    checkHttpResult,
    cleanVolatileProperties,
    getArbrePublic,
    getRessPublic,
    getRessPublicAnonymous,
    getRessPrivateAnonymous,
    getRessUnpublishedAnonymous,
    getTestRessources
  }
}
