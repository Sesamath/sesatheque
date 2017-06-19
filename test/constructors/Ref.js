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

describe('Ref', () => {
  const ressource = fakeRessource()
  it('Converti une ressource', () => {
    const ref = new Ref(ressource)
    expect(ref.type).to.equal(ressource.type, 'Pb type')
    expect(ref.titre).to.equal(ressource.titre, 'Pb titre')
    expect(ref.resume).to.equal(ressource.resume, 'Pb resume')
    expect(ref.commentaires).to.equal(ressource.commentaires, 'Pb commentaires')
    expect(ref.aliasOf).to.equal(ressource.rid, 'Pb rid => aliasOf')
    if (ressource.type === 'arbre' || ressource.type === 'serie') {
      expect(ref.enfants).to.deep.equal(ressource.enfants, 'Pb enfants')
    }
  })

  it('Laisse inchangé une ref', () => {
    const refOrig = fakeRef()
    const ref = new Ref(refOrig)
    // console.log('la ref\n', refOrig, '\nest devenue\n', ref)
    // on vire les trucs obsolètes
    if (ref.ref) delete ref.ref
    // malgré des objets qui semblent vraiment égaux, ce truc passe pas
    // expect(ref).to.deep.equal(refOrig)
    // mais en prenant les clés une par une ça passe…
    const keysOrig = Object.keys(refOrig).sort()
    const keys = Object.keys(ref).sort()
    expect(keys).to.deep.equal(keysOrig, 'liste de propriétés')
    keys.forEach(k => expect(ref[k]).to.deep.equal(refOrig[k], `propriété ${k}`))
  })

  it('converti une ancienne ref (avec propriété ref) en ajoutant baseId', () => {
    const refOrig = fakeRef()
    const oldRef = Object.assign({}, refOrig)
    const pos = refOrig.aliasOf.indexOf('/')
    const baseId = refOrig.aliasOf.substr(0, pos)
    const oid = refOrig.aliasOf.substr(pos + 1)
    oldRef.ref = oid
    delete oldRef.aliasOf
    const ref = new Ref(oldRef, baseId)
    if (ref.ref) delete ref.ref
    const keysOrig = Object.keys(refOrig).sort()
    const keys = Object.keys(ref).sort()
    expect(keys).to.deep.equal(keysOrig, 'liste de propriétés')
    keys.forEach(k => expect(ref[k]).to.deep.equal(refOrig[k], `propriété ${k}`))
  })

  it('lance une exception si on file un oid sans baseId', () => {
    const refOrig = {
      oid: 42,
      titre: 'foo bar',
      type: 'ato'
    }
    const init = () => new Ref(refOrig)
    expect(init).to.throw(Error, /Impossible de convertir la ref/)
  })
})
