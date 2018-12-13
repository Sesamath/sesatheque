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

const path = require('path')

const {application: {staticMaxAge}} = require('../config')
const {displayReactPage} = require('./reactPage')
const {displayObsoletePage} = require('./obsoletePage')

const envSesathequeConf = process.env.SESATHEQUE_CONF

const root = path.resolve(__dirname, '..', '..', '..')

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
      maxAge: staticMaxAge || '7d'
    }
    // cf conf webpack, si y'a un SESATHEQUE_CONF ça build dans build.*
    if (envSesathequeConf) expressOptions.fsPath += '.' + envSesathequeConf
    this.serve('/', expressOptions)
    // et les ressources statiques qui bougent pas (CopyWebpackPlugin arrive pas à les copier, y'en a trop)
    expressOptions.fsPath = path.join(root, 'app', 'assets')
    this.serve('/', expressOptions)

    // le source react pour toutes ses routes
    // (en dev on sera pas appelé car c'est webpack-dev-server qui gère)
    // cf app/client-react/App.js pour ne pas oublier de routes

    // On continue à passer ici par un contrôleur pour toutes les pages statiques, même si à première
    // vue ce serait plus intelligent de construire ça au build avec html-webpack-plugin et le servir
    // en statique (via le serve qui précède), car les 3 routes dynamiques demandent un contrôleur et
    // représentent > 90% des requêtes, pas la peine de doublonner du code pour optimiser un peu les
    // 10% qui restent.
    const reactRoutes = [
      '/',
      '/autocomplete',
      '/mentionsLegales',
      '/ressource/ajouter',
      '/ressource/modifier/:oid',
      '/ressource/apercevoir/:oid',
      '/ressource/decrire/:oid',
      '/ressource/rechercher',
      '/ressources'
    ]
    reactRoutes.forEach(route => this.get(route, displayReactPage))

    // page destinée aux navigateurs non pris en charge
    this.get('/navigateurObsolete', displayObsoletePage)

    // lassi ne gère pas les requêtes head. nginx en frontal le fait pour nous,
    // mais on veut répondre sur / pour le monitoring local (avec monit, 'protocol http' => head)
    app.head('/', (req, res) => res.send())
  })
}
