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
 * l'appeler directement en lui passant --prod ou --dev pour tester la bibliotheque de prod ou dev
 * ou --token pour lui passer un token
 *
 */

'use strict'
/* eslint-env mocha */
/* global stClient */
import {expect} from 'chai'

module.exports = function describe404 () {
  const paths = ['/public/foo/bar', '/ressource/foo/bar', '/public/foo', '/ressource/foo', '/foo/bar']
  paths.forEach(path => {
    it(`prend un 404 sur ${path}`, function () {
      // on retourne une promesse plutôt qu'utiliser done
      return stClient
        .get(path)
        .expect(404, 'not found ' + path)
        .expect('Content-Type', /text\/plain/)
    })
  })
  paths.forEach(path => {
    it(`prend un 404 sur /api${path}`, function () {
      // on retourne une promesse plutôt qu'utiliser done
      return stClient
        .get('/api' + path)
        .expect(404)
        .expect('Content-Type', /application\/json/)
        .then(res => {
          expect(res.body.success).not.to.be.ok
          expect(res.body.error).to.be.ok
          if (/ressource/.test(path)) expect(res.body.error).to.contain('Cette ressource n’existe pas.')
          else if (/public/.test(path)) expect(res.body.error).to.contain("n'existe pas ou n'est pas publique")
          else expect(res.body.error).to.contain("Cette page ou ce fichier n'existe pas")
        })
    }) // it
  })
}
