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


function logInfo() {
  var arg
  var prefix = '        '
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i]
    if (typeof arg === 'string') arg = prefix +arg
    console.log(arg)
  }
}

describe('api get public by oid', function () {
  it("récupère public/42", function (doneGet) {
    var options = {
      url    : urlApiBibli +'/public/42',
      json   : true
    }
    request.get(options, function (error, response, ressource) {
      assert.ok(!error)
      assert.ok(!ressource.error)
      assert.strictEqual(ressource.titre, 'Droites visiblement parallèles')
      assert.strictEqual(ressource.origine, 'em')
      assert.strictEqual(ressource.idOrigine, '42')
      doneGet()
    })
  })
})

describe('api get ressource by oid', function () {
  it("récupère ressource/42", function (doneGet) {
    var options = {
      url    : urlApiBibli +'/ressource/42',
      json   : true
    }
    request.get(options, function (error, response, ressource) {
      assert.ok(!error)
      assert.ok(!ressource.error)
      assert.strictEqual(ressource.titre, 'Droites visiblement parallèles')
      assert.strictEqual(ressource.origine, 'em')
      assert.strictEqual(ressource.idOrigine, '42')
      doneGet()
    })
  })
})

describe('api get public by origin', function () {
  it("récupère public/sesaxml/exercices_interactifs", function (doneGet) {
    var options = {
      url    : urlApiBibli +'/public/sesaxml/exercices_interactifs',
      json   : true
    }
    request.get(options, function (error, response, ressource) {
      assert.ok(!error)
      assert.ok(!ressource.error)
      assert.strictEqual(ressource.origine, 'sesaxml')
      assert.strictEqual(ressource.idOrigine, 'exercices_interactifs')
      doneGet()
    })
  })
})

describe('api get ressource by origin', function () {
  it("récupère ressource/sesaxml/exercices_interactifs", function (doneGet) {
    var options = {
      url    : urlApiBibli +'/ressource/sesaxml/exercices_interactifs',
      json   : true
    }
    request.get(options, function (error, response, ressource) {
      assert.ok(!error)
      assert.ok(!ressource.error)
      assert.strictEqual(ressource.origine, 'sesaxml')
      assert.strictEqual(ressource.idOrigine, 'exercices_interactifs')
      doneGet()
    })
  })
})

