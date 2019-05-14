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
import {boot, keepAlive, shutdownDelayed} from '../../boot'
import {purge} from '../populate'

describe('EntityGroupe', () => {
  // une erreur toute prête
  // const errAbort = new Error('pas la peine de tester ça tant que ça plante avant')
  const groupeData = {
    nom: 'Groupe ACCENTUÉ',
    description: 'Un groupe ouvert de test.\nAvec un peu de bla bla.',
    ouvert: true,
    public: true,
    gestionnaires: ['oidXX'] // il en faut un
  }

  // @todo ajouter les groupes au populate et gérer des tests indépendants, avec une vérif faite par un client mongo
  // une entity globale,
  let groupe
  let EntityGroupe

  const checkGroupe = (groupe) => {
    ;['nom', 'description', 'ouvert', 'public'].forEach(p => {
      expect(groupe[p]).to.equal(groupeData[p])
    })
    expect(groupe.gestionnaires).to.deep.equal(groupeData.gestionnaires)
  }

  // boot + récup des services et config nécessaires à nos tests
  before((done) => {
    boot().then(({lassi}) => {
      if (!lassi) return Promise.reject(new Error('boot KO lassi'))
      EntityGroupe = lassi.service('EntityGroupe')
      // on démarre sur une base vide
      EntityGroupe.match().purge((error) => {
        if (error) return done(error)
        done()
      })
    }).catch(done)
  })

  beforeEach(keepAlive)

  after(purge)
  after(shutdownDelayed)

  it('create', function () {
    checkGroupe(EntityGroupe.create(groupeData))
  })

  it('store', function (done) {
    EntityGroupe.create(groupeData).store((error, _groupe) => {
      if (error) return done(error)
      groupe = _groupe
      checkGroupe(groupe)
      done()
    })
  })

  it('grab', function (done) {
    EntityGroupe
      .match('nom').equals(groupeData.nom)
      .grab((error, groupes) => {
        if (error) return done(error)
        expect(groupes.length).to.equals(1)
        checkGroupe(groupes[0])
        done()
      })
  })

  it('grabOne', function (done) {
    EntityGroupe
      .match('nom').equals(groupeData.nom)
      .grabOne((error, groupe) => {
        if (error) return done(error)
        checkGroupe(groupe)
        done()
      })
  })

  it('delete', function (done) {
    groupe.delete(function (error) {
      if (error) return done(error)
      EntityGroupe
        .match('nom').equals(groupeData.nom)
        .grab(function (error, groupes) {
          if (error) return done(error)
          expect(groupes).to.have.length(0)
          done()
        })
    })
  })

  it('purge', function (done) {
    EntityGroupe.create(groupeData).store((error, groupe) => {
      if (error) return done(error)
      checkGroupe(groupe)
      EntityGroupe.match().purge((error, nb) => {
        if (error) return done(error)
        expect(nb).to.equal(1, 'pb de nb d’entities purgées')
        EntityGroupe.match().grab((error, groupes) => {
          if (error) return done(error)
          expect(groupes.length).to.equal(0, 'il reste des groupes')
          done()
        })
      })
    })
  })
})
