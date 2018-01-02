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
 * Ce fichier fait partie de Sesatheque, créée par l'association Sésamath.
 *
 * Sesatheque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sesatheque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que SesaQcm
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */
'use strict'

const bugsnag = require('bugsnag-js')
const {version} = require('../../../package')
// releaseStage devrait être précisé dans _private/config
const localSettings = require('../../../_private/config')
let releaseStage = (localSettings && localSettings.application && localSettings.application.staging) || 'unknown'
if (releaseStage === 'prod') releaseStage = 'production'

/**
 * Appelé avant d'envoyer le rapport, pour filtrer
 * @param report
 * @return {boolean}
 */
function beforeSend (report) {
  // cf https://docs.bugsnag.com/platforms/browsers/js/customizing-error-reports/
  const type = report && report.metaData && report.metaData.type
  if (['am', 'em'].includes(type)) {
    // apparemment le flash tente de lire des trucs sur la fenêtre parente
    if (/Permission denied to access property/.test(report.errorMessage)) return false
    if (/Accès refusé/.test(report.errorMessage)) return false
  }
}

// @see https://docs.bugsnag.com/platforms/browsers/configuration-options/#apikey
const bugsnagClient = bugsnag({
  beforeSend,
  apiKey: '5269a7241ef3290394720eaff61e90a1',
  appVersion: version,
  releaseStage
  // on pourra ajouter endpoint si on veut traiter nous-même les retours
})

// on ajoute notre client en global pour que le code puisse facilement lui ajouter des infos de contexte
window.bugsnagClient = bugsnagClient
// via ces objet, dont on s'assure qu'ils existent toujours
if (!bugsnagClient.metaData) bugsnagClient.metaData = {}
if (!bugsnagClient.user) bugsnagClient.user = {}

// et le listener
window.onerror = (messageOrEvent, source, line, col, error) => {
  // metadata basiques
  Object.assign(bugsnagClient.metaData, {col, line, source})
  // error n'est pas toujours fourni
  if (error) {
    // on ajoute ça si on l'a aussi (pas sûr que ça arrive…)
    if (messageOrEvent) bugsnagClient.metaData.messageOrEvent = messageOrEvent
  } else {
    // un isError cheap qui devrait suffire (sinon cf isError de bugsnag-js)
    if (messageOrEvent && messageOrEvent.hasOwnProperty('stack')) {
      error = messageOrEvent
    } else if (typeof messageOrEvent === 'string') {
      // on aura pas de stacktrace, mais au moins ce sera signalé et bugsnag râlera pas
      error = new Error(messageOrEvent)
    } else {
      if (messageOrEvent) bugsnagClient.metaData.messageOrEvent = messageOrEvent
      error = new Error('window.onerror appelé sans error')
    }
  }
  console.error('bugsnag', error)
  // bugsnagClient.notify(error, {severity: 'error'})
}
