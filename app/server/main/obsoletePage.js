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

const {version} = require('../../../package')

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="description" content="Médiathèque de ressources pour l'éducation">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" sizes="16x16" href="/favicon.png?${version}">
  <title>Navigateur trop vieux</title>
</head>
<body>
<p>Désolé, ce navigateur ne permet pas d'utiliser Sésathèque.<br />
  <ul>Vous pouvez utiliser:
    <li><a href="https://www.mozilla.org/fr/firefox/">Firefox</a></li>
    <li><a href="https://www.google.com/chrome/browser/desktop/index.html">Chrome</a></li>
    <li><a href="https://www.microsoft.com/fr-fr/windows/microsoft-edge">Microsoft Edge (Windows 10)</a></li>
    <li><a href="https://www.apple.com/fr/safari/">Safari (MacOs ou iOS)</a></li>
    <li>et beaucoup d'autres navigateurs de moins de quelques années</a></li>
  </ul>
</p>
</body>
</html>
`

const getHtml = () => html

/**
 * Ajoute la page pourt les navigateurs obsolètes au contenu courant (pour beforeTransport)
 * @param {Context} context
 */
function displayObsoletePage (context) {
  // sinon le content-type va imposer le transport html qui veut un template dust
  context.contentType = 'text/html'
  context.raw(html, {})
}

module.exports = {
  displayObsoletePage,
  getHtml
}
