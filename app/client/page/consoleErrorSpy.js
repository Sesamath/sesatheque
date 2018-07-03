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

// nos var privées
let errors = []
let consoleError

/**
 * Démarre le spy
 * @param {boolean} [strict=false] passer true pour râler en console s'il tournait déjà
 */
function start (strict = false) {
  if (consoleError) {
    if (strict) console.error(new Error('consoleErrorSpy is already running'))
    return
  }
  // stub console.error
  consoleError = console.error
  console.error = (...args) => {
    // on affiche quand même les erreurs
    consoleError.apply(console, args)
    // et on les stocke
    errors = errors.concat(args.map(arg => {
      if (arg && typeof arg === 'object') {
        if (arg.stack) return arg.stack
        if (arg.message) return arg.message
      }
      return arg
    }))
  }
}

/**
 * Arrête le spy (râle en console sans rien faire si c'est déjà le cas)
 * @return {Error[]}
 */
function stop () {
  if (!consoleError) {
    console.error(new Error('consoleErrorSpy isn’t running'))
    return []
  }
  console.error = consoleError
  consoleError = undefined
  return flush()
}

/**
 * Retourne les erreurs collectées depuis start et reset le tableau d'erreurs
 * @return {Error[]}
 */
function flush () {
  const errorsToSend = errors
  errors = []
  return errorsToSend
}

/**
 * Retourne les erreurs collectées depuis start | flush
 * @return {Error[]}
 */
function getErrors () {
  return errors
}

module.exports = {
  flush,
  getErrors,
  start,
  stop
}
