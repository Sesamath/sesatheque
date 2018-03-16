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

// ce fichier met un objet busgnagClient en global et attend qu'on appelle busgnagClient.setup
// en lui passant une apiKey (qui devrait être précisé dans _private/config,
// si c'est le cas c'est beforeTransport qui ajoute l'appel de setup au source html de la page)
// pour mettre le vrai busgnagClient en global

/**
 * Appelé avant d'envoyer le rapport, pour filtrer
 * @param report
 * @return {boolean}
 */
function beforeSend (report) {
  // cf https://docs.bugsnag.com/platforms/browsers/js/customizing-error-reports/
  if (/local/.test(window.location.hostname)) return false
  const type = report && report.metaData && report.metaData.type
  if (['am', 'em'].includes(type)) {
    // apparemment le flash tente de lire des trucs sur la fenêtre parente
    if (/Permission denied to access property/.test(report.errorMessage)) return false
    if (/Accès refusé/.test(report.errorMessage)) return false
  }
}

function setup (bugsnagConfig) {
  // @see https://docs.bugsnag.com/platforms/browsers/configuration-options/#apikey
  if (!bugsnagConfig.apiKey) {
    console.error(new Error('impossible de configurer busgnag sans apiKey'), bugsnagConfig)
    return
  }
  // on complète la conf avec ça
  bugsnagConfig.beforeSend = beforeSend

  // s'écrase en ajoutant notre client en global
  window.bugsnagClient = bugsnag(bugsnagConfig)
  /* global bugsnagClient */
  // et pour que le code puisse facilement ajouter des infos de contexte
  // on s'assure que ces objets existent toujours
  if (!bugsnagClient.metaData) bugsnagClient.metaData = {}
  if (!bugsnagClient.user) bugsnagClient.user = {}

  // et le listener
  window.onerror = (messageOrEvent, source, line, col, error) => {
    // metadata basiques
    Object.assign(bugsnagClient.metaData, {col, line, source})

    // le stringify des event ne laisse que la propriété isTrusted, on essaie de récupérer les autres
    if (typeof messageOrEvent === 'object' && messageOrEvent.hasOwnProperty('isTrusted')) {
      bugsnagClient.metaData.event = Object.assign({}, messageOrEvent)
    }

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
    bugsnagClient.notify(error, {severity: 'error'})
  }
  // on le teste tout de suite
  // throw new Error('erreur bugsnag de test dès l’init')
}

if (typeof window === 'undefined') {
  console.error(new Error('pas de busgnag hors d’un navigateur'))
} else if (!window.bugsnagClient) { // au cas où on serait requis plusieurs fois
  window.bugsnagClient = {
    setup,
    // et pour que ceux qui s'attendent à trouver ça ne plantent pas
    notify: function fakeNotify () {
      console.error('bugsnag n’a pas été instancié, mais il reçoit')
      console.error.apply(console, arguments)
    },
    metaData: {},
    user: {}
  }
}
