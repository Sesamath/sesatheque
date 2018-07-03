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

const config = require('../config')

const envSesathequeConf = process.env.SESATHEQUE_CONF

let homeContent

const root = path.resolve(__dirname, '..', '..', '..')

const homeContentFile = path.join(root, '_private', 'home.inc.html')
if (fs.existsSync(homeContentFile)) {
  homeContent = fs.readFileSync(homeContentFile)
  if (homeContent) {
    homeContent = homeContent.toString()
  } else {
    log.error(`${homeContentFile} existe mais sans contenu`)
  }
}
if (!homeContent) homeContent = 'Site en construction.'

/**
 * Controleur du composant main pour les routes "statiques"
 * @Controller controllerMain
 */
module.exports = function (mainComponent) {
  mainComponent.controller(function ($rail) {
    // l'appli express
    const app = $rail.get()
    // nos ressources statiques générées par webpack
    const expressOptions = {
      fsPath: path.join(root, 'build'),
      maxAge: config.application.staticMaxAge || '7d'
    }
    if (envSesathequeConf) expressOptions.fsPath = path.join(expressOptions.fsPath, envSesathequeConf)
    this.serve('/', expressOptions)
    // et les ressources statiques qui bougent pas (CopyWebpackPlugin arrive pas à les copier, y'en a trop)
    expressOptions.fsPath = path.join(root, 'app', 'assets')
    this.serve('/', expressOptions)

    const buildDir = envSesathequeConf ? `build/${envSesathequeConf}` : 'build'
    const reactPagePath = path.resolve(root, buildDir, 'index.html')
    const reactPage = fs.readFileSync(reactPagePath)
    // pour la page html react, c'est la même sur toutes les routes
    const sendReactPage = (context) => {
      const options = {
        headers: {
          'Content-Length': Buffer.byteLength(reactPage, 'utf8'),
          'Content-Type': 'text/html'
        }
      }
      context.raw(reactPage, options)
    }

    // cf app/client-react/App.js pour ne pas en oublier
    const reactRoutes = [
      // '/', inutile car /build/index.html passe avant
      '/mentionsLegales',
      '/ressource/ajouter',
      '/ressource/modifier/:oid',
      '/ressource/apercevoir/:oid',
      '/ressource/decrire/:oid',
      '/ressource/rechercher',
      '/ressource/ajouter',
      '/ressources'
    ]

    reactRoutes.forEach(route => this.get(route, sendReactPage))

    // lassi ne gère pas les requêtes head. nginx en frontal le fait pour nous,
    // mais on veut répondre sur / pour le monitoring local (avec monit, 'protocol http' => head)
    app.head('/', (req, res) => res.send())
  })
}
