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
// cf https://docs.bugsnag.com/platforms/browsers/js/
const bugsnagJs = require('bugsnag-js')
// on récupère ce que webpackConfigLoader.js nous file
const {application, bugsnag, version} = require('../../config')

// ce fichier met un objet busgnagClient en global

/**
 * Appelé avant d'envoyer le rapport, pour filtrer
 * @param report
 * @return {boolean}
 */
function beforeSend (report) {
  // cf https://docs.bugsnag.com/platforms/browsers/js/customizing-error-reports/
  if (/local/.test(window.location.hostname)) return false
  if (report && report.metaData) {
    const md = report.metaData
    const type = md && md.exo && md.exo.type
    if (!type || ['am', 'em'].includes(type)) {
      // si pas de type on teste quand même ce qui suit
      // apparemment le flash tente de lire des trucs sur la fenêtre parente, et il a pas le droit
      if (/Permission denied to access property/.test(report.errorMessage)) return false
      if (/Accès refusé/.test(report.errorMessage)) return false
    }
    // on ignore pour le moment les erreurs des js de calculatice, y'en a un peu trop…
    if (md.source && /\/replication_calculatice\//.test(md.source)) {
      return false
    } else if (type && type === 'ecjs') {
      // des erreurs fréquentes sur ecjs qu'on regardera le jour où on aura la main sur le code
      if (/BigError/.test(report.errorClass)) return false
      if (/Unable to get property/.test(report.errorMessage)) return false
      // on vire tous les rapport qui ont du replication_calculatice dans la stacktrace
      if (report.stacktrace.some(trace => /replication_calculatice/.test(trace.file))) return false
    }
  }
}

if (typeof window === 'undefined') {
  console.error(new Error('pas de busgnag hors d’un navigateur'))
} else if (!window.bugsnagClient) {
  if (bugsnag && bugsnag.apiKey) {
    window.bugsnagClient = bugsnagJs({
      // https://docs.bugsnag.com/platforms/browsers/js/configuration-options/#apikey
      apiKey: bugsnag.apiKey,
      // https://docs.bugsnag.com/platforms/browsers/js/configuration-options/#appversion
      appVersion: version,
      // https://docs.bugsnag.com/platforms/browsers/js/configuration-options/#beforesend
      beforeSend,
      // https://docs.bugsnag.com/platforms/browsers/js/configuration-options/#releasestage
      releaseStage: application.staging
    })
    // et on ajoute ça pour que ce soit toujours présent (ça ne l'est pas par défaut)
    window.bugsnagClient.metaData = {}
    window.bugsnagClient.user = {}
  } else {
    console.error('pas d’apiKey pour bugsnag, on crée un fake qui sortira les erreurs en console')
    // pour que ceux qui s'attendent à trouver ça ne plantent pas
    window.bugsnagClient = {
      notify: function fakeNotify () {
        console.error('bugsnag n’a pas été instancié, mais il reçoit')
        console.error.apply(console, arguments)
      },
      metaData: {},
      user: {}
    }
  }
} else {
  console.log('Un 2e appel du module bugsnag reste sans effet')
}
