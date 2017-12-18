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
let isRunning

function errorListener (errorEvent) {
  // errorEvent a une propriété error avec l'erreur que personne n'a catchée
  // mais y'a sûrement des navigateurs qui envoient des event bizarres…
  let error
  if (errorEvent.error) {
    if (errorEvent.error.stack) error = errorEvent.error.stack
    else error = errorEvent.error
  } else {
    error = errorEvent
  }
  if (error) errors.push(error)
}

/**
 * Démarre le spy (râle en console sans rien faire si c'est déjà le cas)
 */
function start () {
  if (typeof window === 'undefined') return
  if (isRunning) {
    console.error(new Error('errorCatcher is already running'))
    return
  }
  isRunning = true
  window.addEventListener('error', errorListener)
}

/**
 * Arrête le spy (râle en console sans rien faire si c'est déjà le cas)
 * et retourne les erreurs collectées
 * @return {Error[]}
 */
function stop () {
  if (typeof window === 'undefined') return
  if (!isRunning) {
    console.error(new Error('errorCatcher isn’t running'))
    return
  }
  window.removeEventListener('error', errorListener)
  return flush()
}

/**
 * Retourne les erreurs collectées depuis start et reset le tableau d'erreurs
 * @return {Error[]}
 */
function flush () {
  const tmp = errors
  errors = []
  return tmp
}

/**
 * Retourne les erreurs collectées depuis start
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
