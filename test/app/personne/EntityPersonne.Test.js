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
import boot from '../boot'
import flow from 'an-flow'
import fakePersonne from '../../helpers/fakePersonne'
import {getRandomPersonne, populate, purge} from '../populate'

describe('EntityPersonne', () => {
  let EntityPersonne, $settings
  const checkPersonne = (personne, expected) => {
    Object.keys(expected).forEach(p => expect(personne[p]).to.deep.equals(expected[p], `Pb avec propriété ${p}`))
  }

  // boot + récup des services et config nécessaires à nos tests
  before(() => boot()
    .then(({lassi}) => {
      if (!lassi) return Promise.reject(new Error('boot KO lassi'))
      EntityPersonne = lassi.service('EntityPersonne')
      $settings = lassi.service('$settings')
      return Promise.resolve()
    })
  )

  beforeEach(purge)
  afterEach(purge)

  it('create (avec permissions set)', () => {
    // on teste un create avec tous les rôles définis en config, plus un inconnu
    const configRoles = $settings.get('components.personne.roles')
    const rolesList = Object.keys(configRoles)
    rolesList.push('inconnu')
    const unknownPermissions = {foo: true, bar: true}
    rolesList.forEach(role => {
      const isKnownRole = role !== 'inconnu'
      const personneData = fakePersonne()
      personneData.roles = {[role]: true}
      personneData.permissions = unknownPermissions
      const personne = EntityPersonne.create(personneData)
      // ça on le vérifie séparément après
      if (isKnownRole) delete personneData.permissions
      checkPersonne(personne, personneData)
      if (isKnownRole) {
        // les permissions d'un rôle sont fixée par la config, ça écrase tout ce qu'on peut passer au constructeur
        expect(personne.permissions).not.to.have.property('foo')
        expect(personne.permissions).not.to.have.property('bar')
        expect(personne.permissions).to.deep.equal(configRoles[role], `Pb de permissions sur rôle ${role}`)
      } else {
        expect(personne.permissions).to.deep.equal({}, 'Pb de permissions sur rôle inconnu')
      }
    })
  })

  it('store', (done) => {
    const personneData = fakePersonne()
    EntityPersonne.create(personneData).store((error, personne) => {
      if (error) return done(error)
      checkPersonne(personne, personneData)
      done()
    })
  })

  it('grab', (done) => {
    populate({nbRessources: 0, nbPersonnes: 3})
      .then(() => {
        const personne = getRandomPersonne()
        const matchers = [
          ['oid', personne.oid],
          ['pid', personne.pid],
          ['nom', personne.nom] // lui pourrait remonter des homonymes, mais avec 3 noms aléatoires…
        ]
        flow(matchers).seqEach(function ([prop, value]) {
          EntityPersonne.match(prop).equals(value).grab(this)
        }).seqEach(function (personnes) {
          expect(personnes, 'Pb sur le nb de personnes remontées').to.have.lengthOf(1)
          checkPersonne(personnes[0], personne)
          done()
        }).catch(done)
      })
      .catch(done)
  })

  it('grabOne', (done) => {
    populate({nbRessources: 0, nbPersonnes: 3})
      .then(() => {
        const personne = getRandomPersonne()
        const matchers = [
          ['oid', personne.oid],
          ['pid', personne.pid],
          ['nom', personne.nom] // lui pourrait remonter des homonymes, mais avec 3 noms aléatoires…
        ]
        flow(matchers).seqEach(function ([prop, value]) {
          EntityPersonne.match(prop).equals(value).grabOne(this)
        }).seqEach(function (personneFound) {
          checkPersonne(personneFound, personne)
          done()
        }).catch(done)
      })
      .catch(done)
  })

  it('Delete ok', function (done) {
    populate({nbRessources: 0, nbPersonnes: 3})
      .then(() => {
        const personne = getRandomPersonne()
        personne.delete((error) => {
          if (error) return done(error)
          EntityPersonne.match().grab((error, personnes) => {
            if (error) return done(error)
            expect(personnes).to.have.lengthOf(2)
            done()
          })
        })
      })
  })
})
