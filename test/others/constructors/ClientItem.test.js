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
 * Ce fichier fait partie de Sesatheque, créée par l'association Sésamath.
 *
 * Sesatheque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sesatheque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que SesaQcm
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */
'use strict'
/* global describe, it */
import Ref from 'sesatheque-client/src/constructors/Ref'
// si on a pas de link vers le module on peut pas aller dans src
// import ClientItem from 'sesatheque-client/src/constructors/ClientItem'
import ClientItem from 'sesatheque-client/src/constructors/ClientItem'

import fakeRef from '../../fixtures/fakeRef'
import fakeRessource from '../../fixtures/fakeRessource'
// cf http://chaijs.com/api/bdd/
import {expect} from 'chai'
import config from '../../../app/server/config'
import configRessource from '../../../app/server/ressource/config'

const myBaseId = config.application.baseId
const myBaseUrl = config.application.baseUrl
const types = Object.keys(configRessource.listes.type)

describe('ClientItem', () => {
  const getRessourcesCollection = () => types.map(type => fakeRessource({type}))
  const getRefCollection = () => types.map(type => fakeRef({type}))
  const {describe, display} = configRessource.constantes.routes

  it('Converti une ressource', () => {
    // ressource publiques
    getRessourcesCollection()
      .forEach(ressource => {
        ressource.$droits = 'R'
        const item = new ClientItem(ressource)
        const expectedFields = ['aliasOf', 'type', 'titre', 'resume', 'commentaires', 'description', 'public', 'categories', 'inc']
        expectedFields.forEach(p => {
          if (p === 'public') expect(item.public).to.equal(ressource.publie && !ressource.restriction, `Pb restriction => public\n${JSON.stringify(ressource)}\n=>\n${JSON.stringify(item)}`)
          else expect(item[p]).to.deep.equal(ressource[p], `Pb ${p}\n${JSON.stringify(ressource)}\n=>\n${JSON.stringify(item)})`)
        })
        // url
        const suffix = ressource.inc ? `?inc=${ressource.inc}` : ''
        expect(item.$displayUrl).to.equal(`${myBaseUrl}public/${display}/${ressource.oid}${suffix}`, 'pb $displayUrl')
        expect(item.$describeUrl).to.equal(`${myBaseUrl}ressource/${describe}/${ressource.oid}${suffix}`, 'pb $describeUrl')
        expect(item.$dataUrl).to.equal(`${myBaseUrl}api/public/${ressource.oid}${suffix}`, 'pb $dataUrl')
        expect(item, 'pb $editUrl').not.to.have.property('$editUrl')
        expect(item.$deletable).to.equal(false, 'pb $deletable')
      })
  })
  it('Converti une ref', () => {
    // ressource publiques
    getRefCollection()
      .forEach(ref => {
        ref.$droits = 'R'
        const item = new ClientItem(ref)
        const expectedFields = ['type', 'titre', 'resume', 'commentaires', 'description', 'public', 'categories', 'inc']
        expect(item.rid).to.equal(ref.aliasOf, `Pb aliasOf => rid`)
        if (!ref.aliasOf && ref.type === 'arbre') expectedFields.push('enfants')
        expectedFields.forEach(p => expect(item[p]).to.deep.equal(ref[p], `Pb ${p}`))
        // url
        const oid = ref.aliasOf.substr(myBaseId.length + 1)
        const suffix = ref.inc ? `?inc=${ref.inc}` : ''
        if (ref.public) {
          expect(item.$displayUrl).to.equal(`${myBaseUrl}public/${display}/${oid}${suffix}`, 'pb $displayUrl')
          expect(item.$describeUrl).to.equal(`${myBaseUrl}ressource/${describe}/${oid}${suffix}`, 'pb $describeUrl')
          expect(item.$dataUrl).to.equal(`${myBaseUrl}api/public/${oid}${suffix}`, 'pb $dataUrl')
        } else {
          expect(item.$displayUrl).to.equal(`${myBaseUrl}public/${display}/cle/${ref.cle}${suffix}`, 'pb $displayUrl')
          expect(item.$describeUrl).to.equal(`${myBaseUrl}ressource/${describe}/${oid}`, 'pb $describeUrl')
          expect(item.$dataUrl).to.equal(`${myBaseUrl}api/ressource/${oid}`, 'pb $dataUrl')
        }
        expect(item, 'pb $editUrl').not.to.have.property('$editUrl')
        expect(item.$deletable).to.equal(false, 'pb $deletable')
      })
  })

  it('Laisse inchangé un clientItem', () => {
    const itemOrig = fakeRef()
    const item = new Ref(itemOrig)
    // malgré des objets qui semblent vraiment égaux, ce truc passe pas
    // expect(item).to.deep.equal(itemOrig)
    // mais en prenant les clés une par une ça passe…
    const keysOrig = Object.keys(itemOrig).sort()
    const keys = Object.keys(item).sort()
    expect(keys).to.deep.equal(keysOrig, 'liste de propriétés')
    keys.forEach(k => expect(item[k]).to.deep.equal(itemOrig[k], `propriété ${k}`))
  })
})
