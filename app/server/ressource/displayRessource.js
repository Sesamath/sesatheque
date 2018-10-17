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

const {version} = require('../../../package')
const {application: {staging}} = require('../config')
const isDev = !staging.includes('prod')
const robotCanIndex = ['prod', 'production'].includes(staging) // mais pas preprod
const {escapeForHtml} = require('sesajstools')

const rawOptions = {headers: {'Content-Type': 'text/html'}}
const SimpleCrypto = require('simple-crypto-js').default

/**
 * Retourne le code html de la page pour afficher la ressource (à priori dans une iframe, pas de header / footer ici)
 * @param {Ressource} ressource
 * @returns {string}
 */
module.exports = function displayRessource (context, ressource) {
  if (!ressource) throw Error('Impossible d’afficher une ressource sans la fournir')
  const titre = escapeForHtml(ressource.titre)
  const titreForArg = ressource.titre.replace(/"/g, '“')

  Object.keys(ressource).forEach(p => {
    if (p.substr(0, 1) === '$') delete ressource[p]
  })
  const correction = ressource.parametres && ressource.parametres.correction
  if (correction !== undefined) {
    const simpleCrypto = new SimpleCrypto(ressource.rid)
    ressource.parametres.correction = simpleCrypto.encrypt(JSON.stringify(correction))
  }

  const page = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=EDGE"/>
  <meta charset="utf-8" />
  <meta name="robots" content="${robotCanIndex ? 'noodp' : 'noindex'}"/>
  <title>${titre}</title>
  <meta property="og:title" content="${titreForArg}"/>
</head>
<body class="iframe">
  <div id="root" role="document">
  <div id="errors"></div>
  <div id="pictoFeedback" class="feedbackOff"></div>
  <button id="boutonVu">Vu <img src="/medias/cocheVerte.png" /></button>
  <h1 id="titre">${titre}</h1>
  <div id="display">
    Vous devez avoir un navigateur avec javascript activé pour voir ce contenu.<br />
    Chargement en cours…
  </div>
<script type="text/javascript" src="/display.js?${version}"></script>
<script type="application/javascript">
try {
  if (typeof stdisplay === 'undefined') throw new Error('Le chargement a échoué, impossible de charger le module display');
  var options = {
    isDev: ${isDev},
    verbose: ${isDev}
  };
  if (window.location.hash === '#formateur') options.isFormateur = true
  stdisplay(${JSON.stringify(ressource)}, options);
} catch(error) {
  document.getElementById('errors').innerHTML = error.toString();
  if (console && console.error) console.error(error);
}
</script>
</div>
</body>
</html>
`
  context.raw(page, rawOptions)
}
