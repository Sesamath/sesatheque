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

import app from '../../app/index'
import config from '../../app/config'
import anLog from 'an-log'
import sesatheques from 'sesatheque-client/src/sesatheques'
/**
 * @see https://github.com/visionmedia/supertest
 * @see https://visionmedia.github.io/superagent/
 */
import supertest from 'supertest'

let isBooted = false
const resolvedValue = {}
let timerId
const defaultDelay = 3000
const resetTimer = (delay = defaultDelay) => {
  if (timerId) clearTimeout(timerId)
  timerId = setTimeout(resolvedValue.lassi.shutdown, delay)
}

/**
 * Démarre l'appli
 * @param {number} [delay=3000] Le nb de ms à attendre après le boot pour éteindre
 * @return {Promise} qui sera résolue en passant un objet {superTestClient, lassi}
 */
const getBootPromise = (delay) => new Promise((resolve, reject) => {
  try {
    const finish = () => {
      // on éteindra après delay ms
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
      // on exporte lassi (pas dispo en global dans un describe) et le client pour tester notre appli express
      resolvedValue.lassi = lassi
      resolvedValue.superTestClient = supertest(lassi.express)
      isBooted = true
      // en ajoutant --delay dans mocha.opts, on a une fct run en global qui prend une callback
      // mais si on ajoute cette ligne ça shutdown avant de commencer les tests…
      // setTimeout(() => run(lassi.shutdown), 500)
      return finish()
    })
  } catch (error) {
    reject(error)
  }
})

module.exports = getBootPromise
