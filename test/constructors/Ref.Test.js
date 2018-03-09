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

import Ref from '../../app/constructors/Ref'
import fakeRef from '../helpers/fakeRef'
import fakeRessource from '../helpers/fakeRessource'
// cf http://chaijs.com/api/bdd/
import {expect} from 'chai'
import configRessource from '../../app/ressource/config'

const types = Object.keys(configRessource.listes.type)
// vérif que deux objets sont identiques
const check = (data, expected) => {
  // malgré des objets qui semblent vraiment égaux, ce truc passe pas
  // expect(ref).to.deep.equal(refOrig)
  // mais en prenant les clés une par une ça passe…
  const keysData = Object.keys(data).sort()
  const keysExpected = Object.keys(expected).sort()
  expect(keysData).to.deep.equal(keysExpected, 'liste de propriétés')
  keysExpected.forEach(k => expect(data[k]).to.deep.equal(expected[k], `propriété ${k}`))
}

describe('Ref', () => {
  it('Converti une ressource', () => {
    types
      .map(type => fakeRessource({type}))
      .forEach(ressource => {
        const ref = new Ref(ressource)
        const expectedFields = ['aliasOf', 'type', 'titre', 'resume', 'commentaires', 'description', 'public', 'categories', 'inc']
        // on a jamais d'enfants sur une ref venant d'une ressource (car y'a un aliasOf)
        // @todo tirer ça au clair
        // en attendant on suit le constructeur Ref
        if (ressource.type === 'arbre' && Array.isArray(ressource.enfants)) expectedFields.push('enfants')
        else if (ressource.type === 'sequenceModele' && ressource.parametres) expectedFields.push('parametres')
        expect(Object.keys(ref).sort()).to.deep.equal(expectedFields.sort(), 'pb sur la liste des champs')
        expectedFields.forEach(p => {
          if (p === 'aliasOf') expect(ref[p]).to.equal(ressource.rid, 'Pb rid => aliasOf')
          else if (p === 'public') expect(ref[p]).to.equal(ressource.publie && !ressource.restriction, 'Pb rid => aliasOf')
          else expect(ref[p]).to.deep.equal(ressource[p], `Pb ${p}`)
        })
      })
  })

  it('Laisse inchangé une ref', () => {
    const refOrig = fakeRef()
    const ref = new Ref(refOrig)
    check(ref, refOrig)
  })

  it('conserve les enfants d’une ref de type arbre sans aliasOf (un dossier d’arbre)', () => {
    const data = fakeRef({type: 'arbre'})
    data.enfants = [fakeRef()]
    data.enfants.push(fakeRef())
    delete data.aliasOf
    check(new Ref(data), data)
  })
})
