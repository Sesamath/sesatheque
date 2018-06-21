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
 * Ce test crée une ressource puis la supprime
 * l'appeler directement en lui passant --prod ou --dev pour tester la sésathèque de prod ou dev
 * ou --token pour lui passer un token
 *
 */

'use strict'
/* eslint-env mocha */
import {expect} from 'chai'
import boot from './boot'

describe('prend un 404 sur les urls inexistantes', function () {
  const paths = ['/public/foo/bar', '/ressource/foo/bar', '/public/foo', '/ressource/foo', '/foo/bar']
  let _superTestClient
  const setClient = ({superTestClient}) => {
    if (!superTestClient) return Promise.reject(new Error('pas de client express après le boot'))
    _superTestClient = superTestClient
    return Promise.resolve()
  }
  this.timeout(60000)
  before(() => boot().then(setClient))

  paths.forEach(path => {
    // on retourne une promesse
    it(`404 sur ${path}`, () =>
      _superTestClient
        .get(path)
        .expect(404, 'not found ' + path)
        .expect('Content-Type', /text\/plain/)
    )
  })
  paths.forEach(path => {
    it(`404 sur /api${path}`, () =>
      _superTestClient
        .get('/api' + path)
        .expect(404)
        .expect('Content-Type', /application\/json/)
        .then(res => {
          expect(res.body.success).not.to.be.ok
          expect(res.body.error).to.be.ok
          expect(res.body.error).to.contain('n’existe pas')
        })
    )
  })
})
