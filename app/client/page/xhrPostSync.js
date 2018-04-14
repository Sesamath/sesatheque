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

// Module pour simuler de l'ajax synchrone
// si c'est dispo avec du sendBeacon vers /api/deferSync qui va reposter en async vers ailleurs,
// sinon en faisant un xhr.sync vers /api/deferSync qui fera suivre

const sjt = require('sesajstools')
const xhr = require('sesajstools/http/xhr')

/**
 * À n'utiliser que dans un event unload (où on peut pas faire de l'ajax async)
 * Utilisera sendBeacon si c'est dispo, ou ajax sync, pour envoyer à '/api/deferPost' qui fera suivre
 * @private
 * @param {string}   url url absolue vers un sesalab connu
 * @param {Object} data
 * @param {errorCallback} next appellé en synchrone
 */
function xhrPostSync (url, data, next) {
  // ici pas le choix, si on veut envoyer ça sur du unload faut du xhr sync, qui est deprecated
  // et que chrome ne fait plus…
  // on essaie quand même sendBeacon si c'est dispo…
  // cf https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon
  // sauf qu'il faudrait ajouter un middleware pour décoder une simple string
  // ou alors utiliser les web workers et FormData, on verra plus tard…
  if (typeof navigator !== 'undefined' && navigator.sendBeacon && typeof Blob !== 'undefined') {
    /* global Blob */
    data.deferUrl = url
    url = '/api/deferPost'
    // faut préciser le type sinon y'a un pb de preflight avec chrome
    const blob = new Blob([sjt.stringify(data)], {type: 'text/plain; charset=UTF-8'})
    if (navigator.sendBeacon(url, blob)) next(null)
    else next(new Error('sendBeacon existe mais son appel a échoué'))
  } else {
    xhr.post(url, data, {sync: true}, error => {
      if (!error) return next(null)
      /* global bugsnagClient */
      if (typeof bugsnagClient !== 'undefined') bugsnagClient.notify(error)
      console.error(error)
      next(error)
    })
  }
}

module.exports = xhrPostSync
