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
const version = require('../../package.json').version

let homeContent
const homeContentFile = path.join(__dirname, '../../_private/home.inc.html')
if (fs.existsSync(homeContentFile)) {
  homeContent = fs.readFileSync(homeContentFile)
  if (homeContent) {
    homeContent = homeContent.toString()
  } else {
    log.error(`${homeContentFile} existe mais sans contenu`)
  }
}
if (!homeContent) homeContent = 'Ce site est encore un prototype expérimental.'

/**
 * Controleur du composant main pour les routes "statiques"
 * @Controller controllerMain
 */
module.exports = function (mainComponent) {
  mainComponent.controller(function ($rail) {
    // l'appli express
    const app = $rail.get()
    // nos ressources statiques génériques
    const expressOptions = {
      fsPath: path.join(__dirname, '..', 'build'),
      maxAge: config.application.staticMaxAge || '7d'
    }

    this.serve('/', expressOptions)

    /**
     * La home
     * @route GET /
     */
    this.get('/', function (context) {
      context.layout = 'page'
      context.html({
        $metas: {
          title: config.application.homeTitle
        },
        contentBloc: {
          $view: 'contents',
          contents: [homeContent]
        },
        version: version
      })
    })

    // lassi ne gère pas les requêtes head. nginx en frontal le fait pour nous,
    // mais on veut répondre sur / pour le monitoring local (avec monit, 'protocol http' => head)
    app.head('/', (req, res) => res.send())
  })
}
