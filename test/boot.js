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

import app from '../app/server'
import config from '../app/server/config'
import anLog from 'an-log'
// si on a pas de link vers le module on peut pas aller dans src
import {addSesatheque} from 'sesatheque-client/dist/server/sesatheques'
import log from 'sesajstools/utils/log'

/**
 * client supertest
 * @see https://github.com/visionmedia/supertest
 * @typedef supertestClient
 * @type {object}
 */
/**
 * Agent supertest
 * @see https://visionmedia.github.io/superagent/
 * @typedef supertestAgent
 * @type {object}
 */
import supertest from 'supertest'

log.setLogLevel('error')

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

const resetTimer = (delay) => {
  if (timerId) clearTimeout(timerId)
  timerId = setTimeout(shutdown, delay)
}

const shutdown = (done) => {
  if (!resolvedValue.lassi) throw new Error('impossible de fermer l’appli avant de l’avoir démarrée')
  if (done) resolvedValue.lassi.on('shutdown', done)
  resolvedValue.lassi.shutdown()
}

/**
 * Démarre l'appli et résoud avec un objet {lassi, superTestClient, superTestAgent, testsDone}
 * @param {number} [delay=3000] Le nb de ms à attendre après le boot pour éteindre
 * @return {Promise} qui sera résolue en passant un objet {lassi, superTestClient, superTestAgent, testsDone}
 */
export default function boot () {
  return new Promise((resolve) => {
    const finish = () => {
      // on supprime le timer de shutdown
      // Il faut un shutdown pour que mocha rende la main, même si on l'appelle sur un seul fichier
      // mais on veut pas de boot & shutdown à chaque test, trop long, donc à chaque fin de test
      if (timerId) clearTimeout(timerId)
      return resolve(resolvedValue)
    }
    // sera appelé sur l'événement startup de lassi
    const afterBootCallback = () => {
      if (!resolvedValue.lassi) throw new Error('Il y a eu un pb dans la méthode boot, lassi n’est pas disponible')
      /** @type supertestClient */
      resolvedValue.superTestClient = supertest(resolvedValue.lassi.express)
      /** @type supertestAgent */
      resolvedValue.superTestAgent = supertest.agent(resolvedValue.lassi.express)
      // à mettre en after pour lancer un shutdown si personne ne demande de boot dans les 100ms qui suivent
      resolvedValue.testsDone = () => resetTimer(100)
      isBooted = true
      finish()
    }

    if (isBooted) return finish()

    // si le boot a démarré mais que l'événement startup n'est pas encore arrivé,
    // (afterBootCallback pas encore appelée), faut l'attendre
    if (resolvedValue.lassi) {
      log('boot already started, waiting for startup event')
      resolvedValue.lassi.on('startup', finish)
      return
    }

    // on enregistre notre sesatheque de test
    addSesatheque(config.application.baseId, config.application.baseUrl)
    // on configure an-log d'après la conf
    // les logs de l'appli sont dans le dossier configuré dans _private/test.js
    // possibilité de modifier le logLevel là-bas
    anLog.config(config.lassiLogger)
    // boot
    app({noCheckLocalOnRemote: true}, afterBootCallback).then((lassiInstance) => {
      // le boot retourne lassi en synchrone et afterBootCallback est appelée sur l'event startup
      // donc on est dans le then mais afterBootCallback n'a pas encore été appelée

      // anLog est pénible…
      anLog.config(config.lassiLogger)
      resolvedValue.lassi = lassiInstance
      // finish sera appelé dans afterBootCallback
    }).catch(log.error)
  })
}
