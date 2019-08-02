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
'use strict'
/* eslint-env mocha */
import chai, {expect} from 'chai'
// on utilise node-fetch, suffisant pour nos besoins (cf https://github.com/bitinn/node-fetch/blob/master/LIMITS.md)
import fetch from 'node-fetch'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'

import boot from '../boot'
import {purge} from './populate'
import {application} from '../../app/server/config'
import {errors} from '../../app/server/main/controllerTest'
import {DELETE, GET, PATCH, POST, PUT} from '../../app/client-react/utils/httpMethods'

chai.use(sinonChai)

const {baseUrl} = application
const httpMethods = {DELETE, GET, PATCH, POST, PUT}
// circleCI peut être assez lent
const timeout = 10000

describe('httpMethods', function () {
  this.timeout(timeout * 5)
  let consoleErrorStub

  before(() => boot().then(({testsDone}) => {
    after(testsDone)
    // faut mettre un pseudo fetch en global
    global.fetch = fetch
  }))

  after(() => {
    delete global.fetch
    return purge()
  })

  beforeEach(() => {
    consoleErrorStub = sinon.stub(console, 'error')
  })
  afterEach(() => {
    consoleErrorStub.reset()
    consoleErrorStub.restore()
  })

  Object.entries(httpMethods).forEach(([methodName, method]) => {
    it(`${methodName} résoud si OK en json`, () => {
      const url = `${baseUrl}test/json/200`
      return method(url)
        .then((res) => {
          expect(res).to.equals('OK', `${methodName} ${url}`)
          expect(consoleErrorStub).to.not.have.been.called
        })
    })

    it(`${methodName} rejette si OK en text`, function (done) {
      method(`${baseUrl}test/text/200`)
        .then(() => {
          done(Error(`${methodName} résoud sa promesse sur une réponse texte`))
        })
        .catch(error => {
          expect(error.message).to.contains('pas au format attendu')
          // 2 appel, un pour le json foireux et l'autre avec l'erreur générée
          expect(consoleErrorStub).to.have.been.calledTwice
          done()
        }).catch(done) // au cas où le expect précédent throw
    })

    const getPromise = (url, errorMessageExpected) => method(url)
      .then(() => {
        const error = Error(`${methodName} ${url} résoud sa promesse`)
        error.notExpected = true
        throw error
      })
      .catch(error => {
        if (error.notExpected) {
          console.error(error)
          throw error
        }
        expect(error.message).to.contains(errorMessageExpected, `pb ${methodName} ${url} `)
        // calledTwice sur les erreurs json, calledOnce sinon
        expect(consoleErrorStub).to.have.been.called
        const consoleArgs = consoleErrorStub.args.pop() // dernier appel
        expect(consoleArgs[0]).to.be.a('Error')
        expect(consoleArgs[0].toString()).to.contains(errorMessageExpected, `Le message en console n’était pas celui attendu : ${consoleArgs.join('\n')}`)
        // les promises sont appelées en //, faut reset à chaque fois
        // apparemment lorsqu'un then console.error puis throw (pour tomber dans le check du catch ici)
        // le catch est appelé juste après, en tout cas jamais vu de cas où deux console error ont lieu
        // avant que le code du catch du premier ne soit exécuté (en théorie c'est pas trop garanti,
        // on risque un check qui trouve 2 appels et l'autre 0)
        // si ce test plante de temps en temps à cause de ça, il faudra envisager un compteur
        // (pas de reset ici et vérifier que le nb d'appels est entre 1 et le nb de promises)
        consoleErrorStub.reset()
        return Promise.resolve()
      })

    it(`${methodName} rejette (json ET text) si code >= 400 (testé pour ${Object.keys(errors).join(' ')})`, () => {
      // faut passer par variable & forEach (map impossible car chaque itération crée 2 promesses)
      const promises = []
      Object.entries(errors).forEach(([code, text]) => {
        ;['json', 'text'].forEach(type => {
          const url = `${baseUrl}test/${type}/${code}`
          promises.push(getPromise(url, text))
        })
      })
      return Promise.all(promises)
    })

    it(`${methodName} rejette si code >= 400 et forward le message en Error`, () => {
      const promises = []
      Object.entries(errors).forEach(([code, text]) => {
        const message = 'Un truc accentué'
        const url = `${baseUrl}test/api/error/${code}/${encodeURIComponent(message)}`
        // const expected = code === '400' ? text : message
        promises.push(getPromise(url, message))
      })
      return Promise.all(promises)
    })

    const bodyTest = {
      a: 1,
      b: false,
      c: {
        d: 'foo',
        e: 'bar'
      }
    }

    it(`${methodName} résoud avec le contenu ou le message si OK`, () => {
      const promises = []
      // pour envoyer du contenu faut être sur /api/
      const url = `${baseUrl}api/test/echo`
      const urlFooBar = `${baseUrl}test/api/foo/bar`
      promises.push(method(url).then((result) => {
        expect(result).to.equals('OK', `${methodName} ${url} ne résoud pas avec OK`)
      }))
      promises.push(method(urlFooBar).then((result) => {
        expect(result.foo).to.equals('bar', `${methodName} ${urlFooBar} ne résoud pas correctement`)
      }))
      if (methodName !== 'GET') {
        promises.push(method(url, {body: bodyTest}).then((result) => {
          expect(result).to.deep.equals(bodyTest, `${methodName} ${url} ne résoud pas avec le contenu attendu`)
        }))
      }
      return Promise.all(promises)
    })
  })
})
