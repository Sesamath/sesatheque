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

// Ce jeu de test de l'appli est lancé avec les paramètres de _private/test.js
// (c'est app/config.js qui détecte mocha et utilise ce fichier)

import app from '../app'
import config from '../app/config'
// import flow from 'an-flow'
import anLog from 'an-log'
import sesatheques from 'sesatheque-client/src/sesatheques'
import {populate, purge} from './app/populate'
/**
 * @see https://github.com/visionmedia/supertest
 * @see https://visionmedia.github.io/superagent/
 */
import supertest from 'supertest'

// les logs de l'appli sont dans le dossier configuré dans _private/test.js
// possibilité de modifier le logLevel là-bas
anLog.config(config.lassiLogger)

describe('L’application sesatheque', function () {
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
      // le client pour tester notre appli express
      global.superTestClient = supertest(lassi.express)
      // on commence par purger tout, au cas où un test précédent aurait laissé trainer des scories
      purge(done)
    })
  })
  after(purge)

  this.timeout(30000)
  // le code dans le before sera exécuté avant tout autre it des describe
  // qui sont dans nos modules requis ensuite, mais pas avant les describe eux-même
  // d'où ce describe englobant qui ne sert qu'à différer les describe qu'il contient (après le retour du before)
  describe('contenus statiques', require('./app/static.Test'))
  describe('api get 404', require('./app/404.Test'))
  describe('sesatheques', require('./app/sesatheque-client/sesatheques'))
  describe('controller api ressource', require('./app/ressource/controllerApi'))
  describe('EntityPersonne', require('./app/personne/EntityPersonne'))
  describe('EntityGroupe', require('./app/personne/EntityGroupe'))
  describe('Tests avec des datas aléatoires (mais cohérentes)', function (done) {
    it('Génère les entities en base', populate)
    describe('sesatheque-client', require('./app/sesatheque-client/client'))
  })
})
