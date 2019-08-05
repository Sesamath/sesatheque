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
// ce fichier met un objet busgnagClient en global

// On utilise ça pour mutualiser la conf bugsnag entre client & client-react
const getBugsnagClient = require('../../client-react/utils/getBugsnagClient').default

if (typeof window === 'undefined') {
  console.error(new Error('pas de busgnag hors d’un navigateur'))
} else if (!window.bugsnagClient) {
  const bugsnagClient = getBugsnagClient()
  if (bugsnagClient) {
    window.bugsnagClient = bugsnagClient
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
