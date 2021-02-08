/**
 * This file is part of SesaXXX.
 *   Copyright 2014-2015, Association Sésamath
 *
 * SesaXXX is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * SesaXXX is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with SesaReactComponent (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de SesaReactComponent, créée par l'association Sésamath.
 *
 * SesaXXX est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * SesaXXX est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que SesaQcm
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */
'use strict'

import Bugsnag from '@bugsnag/js'

import config from '../../server/config'
import getParentUrls from './getParentUrls'

const {application, bugsnag, version} = config
const apiKeyByType = bugsnag.apiKeyByType || {}

/**
 * Appelé avant d'envoyer le rapport, pour filtrer
 * @param event
 * @return {boolean}
 */
function onError (event) {
  // cf https://docs.bugsnag.com/platforms/browsers/js/customizing-error-reports/
  if (/local/.test(window.location.hostname)) return false
  if (/^file:\/\//.test(event.request.url)) return false
  // normalement ça existe toujours à cet endroit, mais on blinde quand même
  const errorMessage = (event && event.originalError && event.originalError.errorMessage) || ''
  const errorClass = (event && event.originalError && event.originalError.errorClass) || ''
  const stacktrace = (event && event.originalError && event.originalError.stacktrace) || []
  // on regarde suivant le contexte
  const type = event.getMetadata('exo', 'type')
  if (!type || ['am', 'em'].includes(type)) {
    // si pas de type on teste quand même ce qui suit
    // apparemment le flash tente de lire des trucs sur la fenêtre parente, et il a pas le droit
    if (/Permission denied to (get|access) property/.test(errorMessage)) return false
    if (/Accès refusé/.test(errorMessage)) return false
  }
  // on ignore pour le moment les erreurs des js de calculatice, y'en a un peu trop…
  if (type === 'ecjs') {
    // des erreurs fréquentes sur ecjs qu'on regardera le jour où on aura la main sur le code
    if (/BigError/.test(errorClass)) return false
    if (/Unable to get property/.test(errorMessage)) return false
    // on vire tous les rapport qui ont du replication_calculatice dans la stacktrace
    if (stacktrace.some(stackFrame => /replication_calculatice/.test(stackFrame.file))) return false
  }
  // si y'a une apiKey spécifique à ce type on l'ajoute
  if (apiKeyByType[type]) event.apiKey = apiKeyByType[type]
  // on vire tous les plantages qui concernent une extension firefox
  if (stacktrace.some(stackFrame => /^moz-extension:\/\//.test(stackFrame.file))) return false
  if (/ChunkLoadError/.test(errorClass)) {
    alert('Il y a un problème de chargement de l’application, vous devriez essayer de vider le cache de votre navigateur pour le resoudre (ctrl+maj+suppr en général, puis cocher « fichier en cache »).')
  }

  // si on est toujours là on ajoute ça avant d'envoyer
  event.addMetadata('frames', { urls: getParentUrls() })
}

/**
 * Retourne un client bugsnag si on a une apiKey en config, null sinon
 * @return {Client|null}
 */
export default function getBugsnagClient (config = {}) {
  if (!bugsnag || !bugsnag.apiKey) return null
  const defaultConfig = {
    // https://docs.bugsnag.com/platforms/browsers/js/configuration-options/#apikey
    apiKey: bugsnag.apiKey,
    onError,
    // https://docs.bugsnag.com/platforms/browsers/js/configuration-options/#appversion
    appVersion: version,
    // https://docs.bugsnag.com/platforms/browsers/js/configuration-options/#releasestage
    releaseStage: application.staging
  }
  return Bugsnag.createClient({ ...defaultConfig, ...config })
}
