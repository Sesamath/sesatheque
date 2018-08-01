/**
 * controller file is part of Sesatheque.
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
 *
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

'use strict'

const rawOptions = {headers: {'Content-Type': 'text/html'}}

/**
 * Retourne le code html de la page pour afficher la ressource (à priori dans une iframe, pas de header / footer ici)
 * @param {Ressource} ressource
 * @returns {string}
 */
module.exports = function displayError (context, error) {
  if (!error) throw Error('Pour afficher une erreur il faut la fournir')
  const errorMessage = error.message || error
  let titre = 'Erreur'
  if (context.status) titre += ' ' + context.status

  const page = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta charset="utf-8" />
  <meta name="robots" content="noindex"/>
  <title>${titre}</title>
</head>
<body class="iframe">
  <div id="root" role="document">
    <div id="errors">${errorMessage}</div>
  </div>
</body>
</html>
`
  context.raw(page, rawOptions)
}
