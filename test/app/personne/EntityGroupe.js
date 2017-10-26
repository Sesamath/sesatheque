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

// const clone = require('sesajstools/utils/object').clone

module.exports = function describeEntityGroupe () {
  // une erreur toute prête
  // const errAbort = new Error('pas la peine de tester ça tant que ça plante avant')
  const groupeData = {
    nom: 'Groupe ACCENTUÉ',
    description: 'Un groupe ouvert de test.\nAvec un peu de bla bla.',
    ouvert: true,
    public: true,
    gestionnaires: ['sesabibli/1'] // il en faut un
  }
  const nomLower = groupeData.nom.toLowerCase()
  /**
   * L'entité créée
   * @type {EntityGroupe}
   */
  let groupe, EntityGroupe

  const checkGroupe = (groupe) => {
    expect(groupe.nom).to.equal(nomLower)
    ;['description', 'ouvert', 'public'].forEach(p => {
      expect(groupe[p]).to.equal(groupeData[p])
    })
    expect(groupe.gestionnaires).to.deep.equal(groupeData.gestionnaires)
  }

  const grab = (next) => {
    EntityGroupe
      .match('nom').equals(nomLower)
      .grab(next)
  }

  before(done => {
    EntityGroupe = lassi.service('EntityGroupe')
    done()
  })

  it('create', function () {
    groupe = EntityGroupe.create(groupeData)
    checkGroupe(groupe)
  })

  it('store', function (done) {
    groupe.store(function (error, groupe) {
      // mocha n'affiche pas les erreurs si on le demande pas !
      if (error) console.error(error)
      expect(error).to.be.falsy
      checkGroupe(groupe)
      done()
    })
  })

  it('grab', function (done) {
    grab(function (error, groupes) {
      if (error) console.error(error)
      expect(error).to.be.falsy
      expect(groupes.length).to.equals(1)
      checkGroupe(groupes[0])
      done()
    })
  })

  it('delete', function (done) {
    groupe.delete(function (error) {
      if (error) console.error(error)
      expect(error).to.be.falsy
      grab(function (error, groupes) {
        expect(error).to.be.falsy
        expect(groupes).to.have.length(0)
        done()
      })
    })
  })
}
