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
/*global describe,it, before */

var assert = require('assert')
/**
 * Un browser plus simple que phantomJs pour tester le html que l'on récupère
 * @see http://www.redotheweb.com/2013/01/15/functional-testing-for-nodejs-using-mocha-and-zombie-js.html
 */
var Zombie = require('zombie')

var config = require('../../app/config')
var urlBibli = 'http://'
if (process.argv.indexOf('--prod') > -1) {
  urlBibli += 'bibliotheque.sesamath.net'
} else if (process.argv.indexOf('--dev') > -1) {
  urlBibli += 'bibliotheque.devsesamath.net'
} else {
  urlBibli += ':'
}
var host = config.$server && config.$server.hostname || 'localhost'
var port = config.$server && config.$server.port || '3000'
var baseUrl = 'http://' +host +':' +port

var browser = Zombie.create({site : baseUrl})

function logInfo() {
  var arg
  var prefix = '        '
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i]
    if (typeof arg === 'string') arg = prefix +arg
    console.log(arg)
  }
}

describe('get public by oid', function () {
  before(function (done) {
    browser.visit('/public/decrire/42', done)
  })

  it('récupère la page attendue', function (done) {
    //logInfo(browser.tabs[0])
    //logInfo(browser.tabs[0]._response)
    browser.assert.success()
    browser.assert.text('h1', 'Droites visiblement parallèles')
    done()
  })
})

describe('get public by origine', function () {
  before(function (done) {
    browser.visit('/public/decrire/sesaxml/exercices_interactifs', done)
  })

  it('récupère la page attendue', function (done) {
    //logInfo(browser.tabs[0])
    //logInfo(browser.tabs[0]._response)
    browser.assert.success()
    browser.assert.elements('h1', { atLeast: 1, atMost: 1 })
    assert.equal(browser.text('h1').toLowerCase(), 'exercices interactifs')
    done()
  })
})
