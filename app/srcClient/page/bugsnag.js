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

const bugsnag = require('bugsnag-js')
const {isError} = require('sesajstools')
const {version} = require('../../../package')
// @see https://docs.bugsnag.com/platforms/browsers/configuration-options/#apikey
const bugsnagClient = bugsnag({
  apiKey: '5269a7241ef3290394720eaff61e90a1',
  appVersion: version
  // on pourra ajouter endpoint si on veut traiter nous-même les retours
})
// on ajoute notre client en global pour que le code puisse facilement lui ajouter du contexte,
// par ex bugsnagClient.user = {…}
window.bugsnagClient = bugsnagClient
window.onerror = (messageOrEvent, source, line, col, error) => {
  const opts = {
    metaData: {col, messageOrEvent, line, source},
    severity: 'error'
  }
  if (!error) {
    if (isError(messageOrEvent)) {
      error = messageOrEvent
      delete opts.metaData.messageOrEvent
    } else if (typeof messageOrEvent === 'string') {
      error = new Error(messageOrEvent)
      delete opts.metaData.messageOrEvent
    } else {
      error = new Error('onError called without error')
    }
  }
  bugsnagClient.notify(error, opts)
}
