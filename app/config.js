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

"use strict"

/**
 * Configuration de l'application
 */
var tools = require("./tools")
// la conf privée pour surcharger cette conf par défaut (et ajouter les accès à la base)
var privateConfModule = __dirname + "/_private/"
if (process.env.SESATHEQUE_CONF && /^[^\/]+$/.test(process.env.SESATHEQUE_CONF)) {
  // on peut préciser un autre fichier de conf via l'environnement (utile pour faire tourner plusieurs instances de l'appli)
  privateConfModule += process.env.SESATHEQUE_CONF
} else {
  privateConfModule += "config"
}
var localConfig = require(privateConfModule)

// la conf du composant ressource à part
var ressourceConfig = require("./ressource/config")

/** La racine du projet */
var root  = __dirname +'/..'

/**
 * L'environnement d'execution est récupéré par NODE_ENV
 * Il peut valoir prod ou dev et sera mis à dev si NODE_ENV est absent
 */
var staging = (process.env.NODE_ENV === "production") ? "prod" : "dev"

/** La config */
var settings = {
  // dans localConf, sinon conf par défaut i.e. port 3000
  application : {
    name : "bibliotheque",
    // mis dans _private/config.js car dépendant de l'instance
    baseUrl      : "http://.../",
    mail : "user@example.com",
    staging: staging
  },
  /* dans _private aussi
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
      key: "asqlSTsrl78lAsg"
    },
    bodyParser : {limit:"8mb"}, // la limite d'un post (100kb par défaut dans body-parser/index.js)
    session: {
      //name: "mySessName",
      secret: "asqlSTsrl78lAsg",
      saveUninitialized: true,
      /* cookie : {
        httpOnly : false
      }, /* */
      resave: true
    },
    authentication: {}
  },
  components: {
    auth : {
      paths : {
        login         :"connexion",
        logout        :"deconnexion",
        externalLogout:"deconnexion/externe"
      }
    },
    cache : {
      defaultTTL: 15*60,
      purgeDelay: 5*60
    },
    groupe : {
      cacheTTL: 20*60
    },
    // Permissions (cumulatives) pour chacun des rôles
    personne : {
      roles: {
        // les droits sont dans l'absolu, mais il peut y avoir des modifications liées au contexte
        // (on a toujours le droit de modifier un contenu dont on serait le seul auteur,
        // pas de droits read sur les ressources privées sauf les siennes, etc.)
        admin      : {create:true, createAll:true, read:true, update:true, updateAuteurs:true, updateGroupes:true, delete:true, deleteVersion:true, index:true, publish:true, correction:true, createGroupe:true}, // jshint ignore:line
        editeur    : {create:true, createAll:true, read:true, update:true, updateAuteurs:true, updateGroupes:true, delete:true, deleteVersion:true, index:true, publish:true, correction:true, createGroupe:true}, // jshint ignore:line
        indexateur : {index:true, createGroupe:true},
        prof       : {create:true, read:true, createGroupe:true},
        acces_correction : {correction:true},
        eleve      : {read:true}
      },
      cacheTTL: 20*60
    },
    ressource : ressourceConfig
  },
  // une liste de domaines "sesalab" pouvant servir de source d'authentification et stocker chez nous, cf /api/connexion
  sesalabs : [
    "https://www.labomep.net/"
  ],
  // une liste de login / pass admin
  admin : {
    // foo:"passDeFoo"
  },

  // le reste est spécifique à sesatheque et ignoré par lassi
  // Cf _private.example/config.js

  // les différents logs
  logs : {
    dir       : process.env.LOGS || root + "/logs",
    access    : "access.log",
    error     : "error.log",
    errorData : staging + "errorData.log",
    debug     : "debug.log",
    //perf      : "perf.log", log les perfs si présent
    //sql       : "sql.log", log les requetes sql si présent
    // ajouter les exclusions voulues parmi ["cache", "resssourceRepository", "personneRepository", "accessControl"]
    debugExclusions : []
  },
  // pour an-log, si on veut récupérer les logs sql
  lassiLogger : {
    '$entities': {
      logLevel: 'debug',
      renderer: {name: 'fileRenderer', target:'./logs/entities.log'}
    }
  },
  varnish : false // mettre true s'il y a un varnish en fromtal pour purger les urls mises en cache
}

// on ajoute nos params locaux (accès à la base et port,
// mais aussi tout ce qui est spécifique à une installation de sesatheque)
if (localConfig) tools.merge(settings, localConfig)

// on enlève le debug mysql en prod
if (settings.application.staging === "prod" && settings.$entities.database.debug) {
  delete settings.$entities.database.debug
}
// on ajoute toujours un slash de fin à baseUrl
if (settings.application.baseUrl.substr(-1) !== "/") settings.application.baseUrl += "/"

// Pour ajouter des composants spécifiques à une installation, pour gérer l'authentification par exemple,
// cf _private.example/config.js

module.exports = settings
