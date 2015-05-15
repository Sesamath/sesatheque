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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

/**
 * Configuration de l'application
 */
var tools = require('../construct/tools')
var localConfig = require('../_private/config')
var ressourceConfig = require('../construct/ressource/config')

/** La racine du projet */
var root  = __dirname + '/..';

/**
 * L'environnement d'execution est récupéré par NODE_ENV
 * Il peut valoir production, integration ou dev et sera
 * mis à dev par défaut
 */
var staging = process.env.NODE_ENV || 'dev'

/** La config */
var settings = {
  // dans localConf, sinon conf par défaut i.e. port 3000
  application : {
    name : "bibliotheque",
    mail : "tech@sesamath.net",
    staging: staging
  },
  /* dans localConf
  $entities: {
    database: {
      host...
    }
  },
  $server {
    port:process.env.PORT || 3001
  }
   */
  $rail    : {
    public        : true,
    //compression : {},
    cookie: {
      key: 'asqlSTsrl78lAsg'
    },
    bodyParser : {limit:'8mb'}, // la limite d'un post (100kb par défaut dans body-parser/index.js)
    session: {
      secret: 'asqlSTsrl78lAsg',
      saveUninitialized: true,
      resave: true
    },
    authentication: {}
  },
  components: {
    cache : {
      defaultTTL: 15*60,
      purgeDelay: 5*60
    },
    // Permissions (cumulatives) pour chacun des rôles
    personne : {
      roles: {
        // les droits sont dans l'absolu, mais il peut y avoir des modifications liées au contexte
        // (on a toujours le droit de modifier un contenu dont on serait le seul auteur,
        // pas de droits read sur les ressources privées sauf les siennes, etc.)
        admin      : {'create':true, 'read':true, 'update':true, 'delete':true, 'deleteVersion':true, 'index':true, 'publish':true, 'correction':true}, // jshint ignore:line
        editeur    : {'create':true, 'read':true, 'update':true, 'delete':true, 'deleteVersion':true, 'index':true, 'publish':true, 'correction':true}, // jshint ignore:line
        indexateur : {'index':true},
        prof       : {'create':true, 'read':true},
        acces_correction : {'correction':true},
        eleve      : {'read':true}
      },
      cacheTTL: 20*60
    },
    ressource : ressourceConfig
  },

  // le reste est spécifique à sesatheque et ignoré par lassi
  // Cf _private.example/config.js

  // les différents logs
  logs : {
    dir       : process.env.LOGS || root + '/logs',
    access    : 'access.log',
    error     : 'error.log',
    errorData : staging + 'errorData.log',
    debug     : 'debug.log',
    // ajouter les exclusions voulues parmi ['cache', 'resssourceRepository', 'personneRepository', 'accessControl']
    debugExclusions : []
  }
}

// on ajoute nos params locaux (accès à la base et port,
// mais aussi tout ce qui est spécifique à une installation de sesatheque)
if (localConfig) tools.merge(settings, localConfig)

// on enlève le debug mysql en prod
if (settings.application.staging === 'production' && settings.$entities.database.connection.debug) {
  delete settings.$entities.database.connection.debug
}

// Pour ajouter des composants spécifiques à une installation, pour gérer l'authentification par exemple,
// cf _private.example/config.js

module.exports = settings
