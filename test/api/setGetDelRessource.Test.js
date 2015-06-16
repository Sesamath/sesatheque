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
var tools = require('../../construct/tools')
var request = require('request')

var config = require('../../config')
var apiToken = config.apiTokens[0]
if (process.argv.indexOf('--token') > -1) {
  apiToken = process.argv[process.argv.indexOf('--token')]
}
var urlBibli = 'http://'
if (process.argv.indexOf('--prod') > -1) {
  urlBibli += 'bibliotheque.sesamath.net'
} else if (process.argv.indexOf('--dev') > -1) {
  urlBibli += 'bibliotheque.devsesamath.net'
} else {
  urlBibli += config.$server && config.$server.hostname || 'localhost'
  urlBibli += ':'
  urlBibli += config.$server && config.$server.port || '3000'
}
urlBibli += '/api/ressource'


var oid
/** {Ressource} Ressource de test */
var ressTest = {
  origine : 'em',
  idOrigine : '5000', // celle là est pas près d'exister
  titre : "Ressource pour tester l'api",
  typeTechnique:'em',
  resume:'Un résumé bidon sur\ndeux lignes',
  description:'Une description bidon sur\ndeux lignes',
  commentaires:'Un commentaire bidon sur\ndeux lignes',
  niveaux:[10,6],
  categories:[1,2],
  // typePedagogiques
  // typeDocumentaires
  relations:[[1,1],[14,2]],
  parametres:{foo:'bar'}, // ajouter des vrais params pour tester le display
  publie : false
  // auteurs
  // contributeurs
  // langue
  // indexable, restriction, dateCreation, dateMiseAJour, version, archiveOid
}

function logInfo() {
  var arg
  var prefix = '        '
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i]
    if (typeof arg === 'string') arg = prefix +arg
    console.log(arg)
  }
}

describe('api set, get & del', function () {

  describe('api set', function () {
    var options = {
      url    : urlBibli,
      headers: {
        "X-ApiToken": apiToken
      },
      json   : true,
      body   : ressTest
    }
    logInfo('on va poster vers ' +urlBibli)
    request.post(options, function (error, response, body) {
      it("retourne l'oid de la ressource stockée", function (doneSet) {
        assert.ok(!error)
        assert.ok(!body.error)
        assert.ok(body.oid)
        oid = body.oid // string
        assert.deepEqual(body, {oid: oid})
        // si ce test est passé on a l'oid
        var ressCloned = tools.clone(ressTest)
        ressCloned.oid = oid
        doneSet()
      })
    })

    describe('api get', function () {
      it("récupère la ressource em/5000 envoyée précédemment", function (doneGet) {
        var options = {
          url    : urlBibli +'/em/5000',
          json   : true
        }
        request.get(options, function (error, response, ressource) {
          assert.ok(!error)
          assert.ok(!ressource.error)
          for (var key in ressCloned) {
            if (ressCloned.hasOwnProperty(key)) assert.ok(_.isEqual(ressCloned[key], ressource[key]))
          }
          //logInfo('la ressource récupérée', ressource)
          doneGet()
        })
      })
    })

    describe('api get', function () {
      it("récupère la ressource " +oid +" envoyée précédemment", function (doneGet) {
        var options = {
          url    : urlBibli +'/' +oid,
          json   : true
        }
        request.get(options, function (error, response, ressource) {
          assert.ok(!error)
          assert.ok(!ressource.error)
          for (var key in ressCloned) {
            if (ressCloned.hasOwnProperty(key)) assert.ok(_.isEqual(ressCloned[key], ressource[key]))
          }
          doneGet()
        })
      })
    })

    describe('api del', function () {
      it("prend un 403 si on veut effacer sans token", function (done) {
        var options = {
          url    : urlBibli +'/' +oid,
          json   : true
        }
        request.del(options, function (error, response, ressource) {
          assert.ok(!error)
          assert.ok(ressource.error)
          assert.equal(403, response.statusCode)
          done()
        })
      })

      it("vire la ressource " +oid +" envoyée précédemment", function (done) {
        var options = {
          url    : urlBibli +'/' +oid,
          headers: {
            "X-ApiToken": apiToken
          },
          json   : true
        }
        request.del(options, function (error, response, ressource) {
          assert.ok(!error)
          assert.ok(!ressource.error)
          assert.equal(oid, ressource.deleted)
          done()
        })
      })
    })

  })
})
