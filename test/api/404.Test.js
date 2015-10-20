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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
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
/*global describe,it*/

var assert = require("assert")
var _ = require('lodash')
var request = require('request')

var config = require('../../app/config')
var apiToken = config.apiTokens[0]
if (process.argv.indexOf('--token') > -1) {
  apiToken = process.argv[process.argv.indexOf('--token') +1]
}
var urlApiBibli = 'http://'
if (process.argv.indexOf('--prod') > -1) {
  urlApiBibli += 'bibliotheque.sesamath.net'
} else if (process.argv.indexOf('--dev') > -1) {
  urlApiBibli += 'bibliotheque.devsesamath.net'
} else {
  urlApiBibli += config.$server && config.$server.hostname || 'localhost'
  urlApiBibli += ':'
  urlApiBibli += config.$server && config.$server.port || '3000'
}
urlApiBibli += '/api'

describe('api get 404', function () {
  it("prend un 404 sur /public/foo/bar", function (done) {
    var options = {
      url : urlApiBibli + '/public/foo/bar',
      json: true
    }
    request.get(options, function (error, response, ressource) {
      assert.ok(!error)
      assert.ok(ressource.error)
      assert.equal(404, response.statusCode)
      done()
    })
  })

  it("prend un 404 sur /ressource/foo/bar", function (done) {
    var options = {
      url : urlApiBibli + '/ressource/foo/bar',
      json: true
    }
    request.get(options, function (error, response, ressource) {
      assert.ok(!error)
      assert.ok(ressource.error)
      assert.equal(404, response.statusCode)
      done()
    })
  })

  it("prend un 404 sur /public/foo", function (done) {
    var options = {
      url : urlApiBibli + '/public/foo',
      json: true
    }
    request.get(options, function (error, response, ressource) {
      assert.ok(!error)
      assert.ok(ressource.error)
      assert.equal(404, response.statusCode)
      done()
    })
  })

  it("prend un 404 sur /ressource/foo", function (done) {
    var options = {
      url : urlApiBibli + '/ressource/foo',
      json: true
    }
    request.get(options, function (error, response, ressource) {
      assert.ok(!error)
      assert.ok(ressource.error)
      assert.equal(404, response.statusCode)
      done()
    })
  })

  it("prend un 404 sur /foo/bar", function (done) {
    var options = {
      url : urlApiBibli + '/foo/bar',
      json: true
    }
    request.get(options, function (error, response, ressource) {
      assert.ok(!error)
      assert.ok(ressource.error)
      assert.equal(404, response.statusCode)
      done()
    })
  })
})
