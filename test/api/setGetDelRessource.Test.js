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
import request from 'request'

import fakeRessource from '../helpers/fakeRessource'

const clone = require('sesajstools/utils/object').clone
// conf de l'appli
import config from '../../app/config'
const myBaseId = config.application.baseId
// token
let apiToken = config.apiTokens[0]

/**
 * Affiche les options possibles
 */
function usage () {
  console.log("Ce test enregistre une ressource sur l'api, puis la récupère pour vérifier et l'efface.\n" +
              'Les options possibles sont :\n' +
              '--token : passe un token (sinon on prend le 1er trouvé dans la conf de cette appli)\n' +
              '--prod ou --dev : pour tester bibliotheque.sesamath.net ou bibliotheque.devsesamath.net (sinon locale)\n' +
              "--debug : affiche qq infos sur ce que l'api retourne\n" +
              '-h ou --help : affiche cette aide')
  process.exit()
}

// aide
if (process.argv.indexOf('--help') !== -1 || process.argv.indexOf('-h') !== -1) {
  usage()
}

if (process.argv.indexOf('--token') !== -1) {
  apiToken = process.argv[process.argv.indexOf('--token')]
}

// url bibli
let urlBibli = 'http://'
if (process.argv.indexOf('--prod') !== -1) {
  urlBibli += 'bibliotheque.sesamath.net'
} else if (process.argv.indexOf('--dev') !== -1) {
  urlBibli += 'bibliotheque.devsesamath.net'
} else {
  urlBibli += config.$server && config.$server.hostname || 'localhost'
  urlBibli += ':'
  urlBibli += config.$server && config.$server.port || '3000'
}
urlBibli += '/api/ressource'

// var isDebug = (process.argv.indexOf('--debug') > -1)

/** {string} l'oid mis par l'appli à l'enregistrement du post */
let oid
/** {Ressource} Ressource de test à poster */
const ressource = fakeRessource({nooid: true, norid: true, origine: myBaseId, noidOrigine: true, relations: [[1, 1], [14, 2]]})

/** {Ressource} Ressource attendue en retour */
const ressExpected = clone(ressource)
ressExpected.relations = [[1, myBaseId + '/1'], [14, myBaseId + '/2']]
// pour le test via origine/idOrigine
let bundleId

const errAbort = new Error('pas la peine de tester ça tant que ça plante avant')

describe('api set, get & del', function () {
  it("set retourne l'oid de la ressource stockée", function (done) {
    // on la poste sans oid ni rid
    delete ressource.oid
    delete ressource.rid
    const options = {
      url: urlBibli,
      headers: {
        'X-ApiToken': apiToken
      },
      json: true,
      body: ressource
    }
    // logInfo('on va poster vers ' + urlBibli)
    request.post(options, function (error, response, body) {
      // console.log('retour du post pour set', body)
      // console.log('\npost\n', ressource)
      if (error) return done(error)
      if (!body) return done(new Error(`pas de body dans le post vers ${urlBibli}`))
      if (body.error) return done(new Error(body.error))
      expect(body.oid).to.be.ok
      oid = body.oid // string
      bundleId = myBaseId + '/' + oid
      expect(body).to.deep.equal({oid: oid}, 'pb sur le body retourné')
      // si ce test est passé on a l'oid que l'on ajoute pour les tests suivants
      ressExpected.oid = oid
      ressExpected.rid = bundleId
      ressExpected.idOrigine = '' + oid
      done()
    })
  })

  it('récupère la ressource envoyée précédemment via oid', function (done) {
    if (!oid) return done(errAbort)
    var options = {
      url: urlBibli + '/' + oid,
      json: true
    }
    request.get(options, function (error, response, ressRecup) {
      // console.log('\n\nla ressource récupérée\n', ressRecup)
      expect(error).to.not.be.ok
      expect(ressRecup.error).to.not.be.ok
      Object.keys(ressExpected).forEach(k => {
        expect(ressRecup[k]).to.deep.equal(ressExpected[k], `propriété ${k}`)
      })
      done()
    })
  })

  it('récupère la ressource envoyée précédemment via origine/idOrigine', function (done) {
    if (!oid) return done(errAbort)
    var options = {
      url: urlBibli + '/' + bundleId,
      json: true
    }
    request.get(options, function (error, response, ressRecup) {
      // console.log('la ressource récupérée', ressRecup)
      expect(error).to.not.be.ok
      expect(ressRecup.error).to.not.be.ok
      Object.keys(ressExpected).forEach(k => {
        expect(ressRecup[k]).to.deep.equal(ressExpected[k], `propriété ${k}`)
      })
      done()
    })
  })

  it('prend un 403 si on veut effacer sans token', function (done) {
    if (!oid) return done(errAbort)
    var options = {
      url: urlBibli + '/' + oid,
      json: true
    }
    request.del(options, function (error, response, body) {
      // console.log('body récupéré', body)
      expect(error).to.not.be.ok
      expect(body.error).to.be.ok
      expect(response.statusCode).to.equal(403)
      done()
    })
  })

  it("vire la ressource que l'on vient d'enregistrer", function (done) {
    if (!oid) return done(errAbort)
    var options = {
      url: urlBibli + '/' + oid,
      headers: {
        'X-ApiToken': apiToken
      },
      json: true
    }
    request.del(options, function (error, response, body) {
      // console.log('body récupéré', body)
      expect(error).to.not.be.ok
      expect(body.error).to.not.be.ok
      expect('' + body.deleted).to.equal('' + oid)
      done()
    })
  })
})
