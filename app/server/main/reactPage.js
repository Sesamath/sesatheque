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

const fs = require('fs')
const path = require('path')

const log = require('sesajstools/utils/log')
const {version} = require('../../../package')
const {application: {name}} = require('../config')

const root = path.resolve(__dirname, '..', '..', '..')

let homeContent

const homeContentFile = path.join(root, '_private', 'home.inc.html')
if (fs.existsSync(homeContentFile)) {
  homeContent = fs.readFileSync(homeContentFile, 'utf8')
  if (!homeContent) {
    log.error(`${homeContentFile} existe mais sans contenu`)
  }
}

if (!homeContent) homeContent = 'Site en construction.'

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="description" content="Médiathèque de ressources pour l'éducation">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" sizes="16x16" href="/favicon.png?${version}">
  <title>${name}</title>
</head>
<body>
<div id="homeContent" style="display: none;">${homeContent}</div>
<div id="root" role="document"></div>
<script
  type="application/javascript"
  src="/react.js?${version}"
></script>
</body>
</html>
`

const getHtml = () => html

/**
 * Ajoute la page react au contenu courant (pour beforeTransport)
 * @param {Context} context
 * @param {string} [contentToAdd] Sera ajouté tel quel dans la page, après le div root (juste avant </body>), à priori du js…
 */
function displayReactPage (context) {
  context.contentType = 'text/html'
  // faut utiliser raw sinon le content-type va imposer le transport html qui veut un template dust
  context.raw(html, {})
  // on peut fixer nos headers directement sur la réponse
  // context.response.append('Content-Length', reactPagelength)
  // mais express ajoute Content-Length lui-même
}

module.exports = {
  displayReactPage,
  getHtml
}
