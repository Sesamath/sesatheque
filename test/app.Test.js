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
 * Test qui lance l'appli sur un autre port avec une config de test (d'après la conf _private/test.js)
 * S'il y a de nouveaux updates depuis le dernier lancement avec cette conf, relancer l'appli avec
 *    env SESATHEQUE_CONF=test node --stack_trace_limit=100 --stack-size=2048 app/index.js
 * avant de relancer les tests (pour appliquer les updates sur la base de test)
 */

'use strict'
/* eslint-env mocha */

const app = require('../app/app')
const config = require('../app/config')
const anLog = require('an-log')
const sesatheques = require('sesatheque-client/src/sesatheques')

/**
 * @see https://github.com/visionmedia/supertest
 * @see https://visionmedia.github.io/superagent/
 */
const supertest = require('supertest')
// un objet global avec lassi et notre agent initialisé, à passer aux tests
const globTest = {}

describe('test de l’application lassi', function () {
  before(function beforeBoot (done) {
    // on enregistre notre sesatheque de test
    sesatheques.addSesatheque(config.application.baseId, config.application.baseUrl)
    // les 2s par défaut suffisent pas pour le boot
    this.timeout(8000)
    // on re-configure an-log pour qu'il mette tout en fichier
    anLog.config(config.lassiLogger)
    // boot
    app(function afterBootCallback () {
      // console.log('app started')
      anLog.config(config.lassiLogger)
      globTest.lassi = lassi
      globTest.client = supertest(lassi.express)
      globTest.config = lassi.settings
      // pour que le an-log de lassi finisse son bavardage en console
      setTimeout(done, 0)
    })
  })

  require('./app/static.Test')(globTest)
  require('./app/404.Test')(globTest)
  require('./app/ressource/controllerApi.Test')(globTest)
  require('./app/sesatheque-client/sesatheques.Test')(globTest)
})
