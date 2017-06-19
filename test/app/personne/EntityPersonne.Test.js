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
 * l'appeler directement en lui passant --prod ou --dev pour tester la bibliotheque de prod ou dev,
 * (sinon c'est la bibli locale)
 * ou --token pour lui passer un token
 */

'use strict'
/* eslint-env mocha */

import {expect} from 'chai'

// const clone = require('sesajstools/utils/object').clone

module.exports = function describeEntityPersonne () {
  // une erreur toute prête
  // const errAbort = new Error('pas la peine de tester ça tant que ça plante avant')

  const EntityPersonne = lassi.service('EntityPersonne')
  const personneData = {
    // pas d'oid pour le moment
    // ni pid
    origine: 'origAuth',
    idOrigine: 'idAtOrigAuth',
    prenom: 'foo',
    nom: 'bar',
    email: 'foo@bar.baz',
    roles: {'formateur': true},
    permissions: {'foo': true, 'bar': true}
  }
  /**
   * L'entité créée
   * @type {EntityPersonne}
   */
  let personne

  const checkPersonne = (personne) => {
    const configRoles = lassi.settings.components.personne.roles
    expect(personne.origine).to.equal(personneData.origine)
    expect(personne.idOrigine).to.equal(personneData.idOrigine)
    expect(personne.prenom).to.equal(personneData.prenom)
    expect(personne.nom).to.equal(personneData.nom)
    expect(personne.email).to.equal(personneData.email)
    expect(personne.roles).to.deep.equal(personneData.roles)
    // les permissions d'un rôle sont fixée par la config, ça écrase tout ce qu'on peut passer au constructeur
    expect(personne.permissions).not.to.have.property('foo')
    expect(personne.permissions).not.to.have.property('bar')
    expect(personne.permissions).to.deep.equal(configRoles.formateur)
  }

  const grab = (next) => {
    EntityPersonne
      .match('origine').equals(personneData.origine)
      .match('idOrigine').equals(personneData.idOrigine)
      .grab(next)
  }

  it('Create avec permissions set Ok', function () {
    personne = EntityPersonne.create(personneData)
    checkPersonne(personne)
  })
  it('store ok', function (done) {
    personne.store(function (error, personne) {
      if (error) console.error(error)
      expect(error).to.be.falsy
      checkPersonne(personne)
      done()
    })
  })
  it('Grab ok', function (done) {
    grab(function (error, personnes) {
      if (error) console.error(error)
      expect(error).to.be.falsy
      expect(personnes.length).to.equals(1)
      checkPersonne(personnes[0])
      done()
    })
  })
  it('Delete ok', function (done) {
    personne.delete(function (error) {
      if (error) console.error(error)
      expect(error).to.be.falsy
      grab(function (error, personnes) {
        if (error) console.error(error)
        expect(error).to.be.falsy
        expect(personnes).to.have.length(0)
        done()
      })
    })
  })
}
