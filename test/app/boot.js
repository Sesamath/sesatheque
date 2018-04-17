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

import app from '../../app/server/index'
import config from '../../app/server/config'
import anLog from 'an-log'
import sesatheques from 'sesatheque-client/src/sesatheques'
/**
 * @see https://github.com/visionmedia/supertest
 * @see https://visionmedia.github.io/superagent/
 */
import supertest from 'supertest'

let isBooted = false
// pour que mocha rende la main, il faut shutdown lassi
// on gère ça avec un timeout après chaque boot, et un
// testsDone qui raccourci ce timeout (qui sera réinitialisé
// si un autre describe appelle boot juste après)
/**
 * Objet de la promesse résolue après le boot
 * Chaque describe devra appeler le boot en before et testsDone en after
 * @type {{lassi, superTestClient, testsDone}}
 */
const resolvedValue = {}
let timerId
// un delay par défaut de 10s pour chaque describe qui appelle boot dans son before
const defaultDelay = 10000
const resetTimer = (delay = defaultDelay) => {
  if (timerId) clearTimeout(timerId)
  timerId = setTimeout(shutdown, delay)
}
const shutdown = (done) => {
  if (!resolvedValue.lassi) throw new Error('impossible de fermer l’appli avant de l’avoir démarrée')
  if (done) resolvedValue.lassi.on('shutdown', done)
  resolvedValue.lassi.shutdown()
}

/**
 * Démarre l'appli et résoud avec un objet {lassi, superTestClient, testsDone}
 * @param {number} [delay=3000] Le nb de ms à attendre après le boot pour éteindre
 * @return {Promise} qui sera résolue en passant un objet {superTestClient, lassi}
 */
const getBootPromise = (delay) => new Promise((resolve, reject) => {
  try {
    const finish = () => {
      // on éteindra après delay ms (rappeller boot reset le timer)
      resetTimer(delay)
      return resolve(resolvedValue)
    }
    if (isBooted) return finish()

    // on enregistre notre sesatheque de test
    sesatheques.addSesatheque(config.application.baseId, config.application.baseUrl)
    // on configure an-log pour qu'il mette tout en fichier
    // les logs de l'appli sont dans le dossier configuré dans _private/test.js
    // possibilité de modifier le logLevel là-bas
    anLog.config(config.lassiLogger)
    // boot
    app(function afterBootCallback () {
      anLog.config(config.lassiLogger)
      // on garde une ref sur lassi (pas dispo en global dans un describe)
      // et le client pour tester notre appli express
      resolvedValue.lassi = lassi
      resolvedValue.superTestClient = supertest(lassi.express)
      resolvedValue.testsDone = () => resetTimer(100)
      isBooted = true
      // en ajoutant --delay dans mocha.opts, on a une fct run en global (qui prend une callback à exécuter)
      return finish()
    })
  } catch (error) {
    reject(error)
  }
})

module.exports = getBootPromise
