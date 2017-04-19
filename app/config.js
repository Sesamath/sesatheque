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

/**
 * Configuration de l'application
 */
const path = require('path')
// const anLog = require('an-log')

const sjtObj = require('sesajstools/utils/object')
const sjtUrl = require('sesajstools/http/url')
const {reBaseUrl} = require('sesatheque-client/src/sesatheques')

/**
 * Retourne les éléments de list avec une baseUrl valide
 * (à laquelle on a éventuellement ajouté le slash de fin)
 * @param {Array} list
 * @return {Array} Liste dont tous les éléments ont une baseUrl valide
 */
function filterOnBaseUrl (list) {
  return list.map((item) => {
    if (item && typeof item.baseUrl === 'string') {
      // on ajoute un éventuel / de fin (c'est pas immutable, mais ici on s'en fout vraiment)
      if (item.baseUrl.substr(-1) !== '/') item.baseUrl += '/'
      if (reBaseUrl.test(item.baseUrl)) return item
    }
    console.error('item sans baseUrl valide', item)
  }).filter((item) => item)
}

/**
 * L'environnement d'execution est récupéré par NODE_ENV
 * Il peut valoir prod ou dev et sera mis à dev si NODE_ENV est absent
 */
const staging = (process.env.NODE_ENV === 'production') ? 'prod' : (process.argv[1].indexOf('mocha') !== -1) ? 'test' : 'dev'

/** La racine du projet */
const root = path.resolve(__dirname, '..')
const logDir = process.env.LOGS || root + '/logs'

// la conf privée pour surcharger cette conf par défaut (et ajouter les accès à la base)
const privateConfPath = [root, '_private']
if (process.env.SESATHEQUE_CONF && /^[^/]+$/.test(process.env.SESATHEQUE_CONF)) {
  // on peut préciser un autre fichier de conf via l'environnement
  // (utile pour faire tourner plusieurs instances de l'appli)
  privateConfPath.push(process.env.SESATHEQUE_CONF)
} else if (staging === 'test') {
  privateConfPath.push('test')
} else {
  privateConfPath.push('config')
}
const localConfig = require(path.join.apply(this, privateConfPath))
// la conf du composant ressource à part
const ressourceConfig = require('./ressource/config')

/** La config */
const config = {
  // dans localConf, sinon conf par défaut i.e. port 3000
  application: {
    name: 'bibliotheque',
    // ajouté en title
    title: 'Sésathèque',
    // h1 de la page d'accueil
    homeTitle: 'Bienvenue sur cette Sésathèque',
    // la référence pour valider des baseId, toutes les sesatheques enregistrées chez un registrar
    // peuvent référencer des items d'une autre du même registrar
    baseIdRegistrar: 'sesabibli',
    defaultViewsPath: 'app/views',
    // mis dans _private/config.js car dépendant de l'instance
    baseId: 'notConfigured', // l'id de cette sésathèque
    baseUrl: 'notConfigured',
    // mail: 'user@example.com',
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
  $rail: {
    public: true,
    // compression : {},
    cookie: {
      key: 'asqlSTsrl78lAsg'
    },
    bodyParser: {limit: '8mb'}, // la limite d'un post (100kb par défaut dans body-parser/index.js)
    session: {
      // name: 'mySessName',
      secret: 'asqlSTsrl78lAsg', // en mettre un autre dans _private/config !
      saveUninitialized: true,
      /* cookie : {
        httpOnly : false
      }, /* */
      resave: true
    },
    authentication: {}
  },
  components: {
    auth: {
      paths: {
        login: 'connexion',
        logout: 'deconnexion',
        externalLogout: 'deconnexion/externe'
      }
    },
    cache: {
      defaultTTL: 15 * 60,
      purgeDelay: 5 * 60
    },
    groupe: {
      cacheTTL: 20 * 60
    },
    // Permissions (cumulatives) pour chacun des rôles
    personne: {
      roles: {
        // les droits sont dans l'absolu, mais il peut y avoir des modifications liées au contexte
        // (on a toujours le droit de modifier un contenu dont on serait le seul auteur,
        // pas de droits read sur les ressources privées sauf les siennes, etc.)
        admin: {create: true, createAll: true, read: true, update: true, updateAuteurs: true, updateGroupes: true, delete: true, deleteVersion: true, index: true, publish: true, correction: true, createGroupe: true},
        editeur: {create: true, createAll: true, read: true, update: true, updateAuteurs: true, updateGroupes: true, delete: true, deleteVersion: true, index: true, publish: true, correction: true, createGroupe: true},
        indexateur: {index: true, createGroupe: true},
        formateur: {create: true, read: true, createGroupe: true},
        acces_correction: {correction: true},
        eleve: {read: true}
      },
      cacheTTL: 20 * 60
    },
    sesalabSso: {
      authServers: []
    },
    ressource: ressourceConfig
  },
  // urls absolues des sésathèques que l'on accepte de référencer (pour les alias, par ex quand
  // des sesalab connectés à plusieurs sésathèques mettent des ressources de l'une
  // dans des arbres de l'autre)
  // sous la forme baseId:baseUrl, ou nomQcq{id: baseId, baseUrl:laBaseHttpAbsolue, apiToken: leToken}
  // inutile d'ajouter la sesatheque courante (baseId:baseUrl), elle sera automatiquement ajoutée à la liste
  sesatheques: [],
  // une liste de domaines 'sesalab' autorisés à appeler l'api pour stocker des séries ou séquences
  // écraser cette propriété avec un tableau vide dans _private/config.js pour s'en passer
  sesalabs: [],
  // une liste de login / pass admin
  admin: {
    // foo:'passDeFoo'
  },

  // le reste est spécifique à sesatheque et ignoré par lassi
  // Cf _private.example/config.js

  // les différents logs
  logs: {
    dir: logDir,
    access: 'access.log',
    error: 'error.log',
    dataError: 'data.error.log',
    debug: 'debug.log',
    // perf      : 'perf.log', log les perfs si présent
    // sql       : 'sql.log', log les requetes sql si présent
    // ajouter les exclusions voulues parmi ['cache', 'resssourceRepository', 'personneRepository', 'accessControl']
    debugExclusions: []
  },
  // pour an-log, si on veut récupérer les logs sql
  lassiLogger: {
    '$entities': {
      logLevel: 'debug',
      renderer: {name: 'fileRenderer', target: logDir + '/entities.log'}
    }
  },
  varnish: false // mettre true s'il y a un varnish en frontal pour purger les urls mises en cache
}

// on ajoute nos params locaux (accès à la base et port,
// mais aussi tout ce qui est spécifique à une installation de sesatheque)
if (localConfig) sjtObj.merge(config, localConfig)

/**
 * À partir le là on a la conf locale, on vérifie et normalise un peu (autant signaler une erreur dès le boot)
 */

// on enlève le debug mysql en prod
if (config.application.staging === 'prod' && config.$entities.database.debug) {
  delete config.$entities.database.debug
}
// on ajoute toujours un slash de fin à baseUrl
if (config.application.baseUrl.substr(-1) !== '/') config.application.baseUrl += '/'

// idem pour les sesatheques, mais on ajoute un objet byId, plus simple à tester
config.sesathequesById = {}
if (Array.isArray(config.sesatheques) && config.sesatheques.length) {
  config.sesatheques = filterOnBaseUrl(config.sesatheques)
  config.sesatheques.forEach(s => { config.sesathequesById[s.baseId] = s.baseUrl })
} else {
  config.sesatheques = []
}

/**
 * On passe à la conf de sesalabSso, déduite du reste si on a mis des sesalabs
 * (dans ce cas on est obligatoirement client sso de ces sesalab,
 * ce qui n'empêcherait pas d'être client sso d'autres sesatheques qui implémenteraient un $sesalabSsoServer)
 */
if (Array.isArray(config.sesalabs) && config.sesalabs.length) config.sesalabs = filterOnBaseUrl(config.sesalabs)
else config.sesalabs = []
// pour valider du CORS
config.sesalabsByOrigin = {}
config.sesalabs.forEach(s => {
  const origin = s.baseUrl.substr(0, s.baseUrl.length - 1)
  config.sesalabsByOrigin[origin] = true
})
if (!config.components) config.components = {}
if (config.sesalabs.length) {
  if (!config.components.sesalabSso) config.components.sesalabSso = {}
  const confSso = config.components.sesalabSso
  confSso.authServers = Array.isArray(confSso.authServers && confSso.authServers.length) ? filterOnBaseUrl(confSso.authServers) : []
  // et on ajoute un authServer pour chaque sesalab
  config.sesalabs.forEach(function (sesalab) {
    const authServer = {
      name: sesalab.name || sjtUrl.getDomain(sesalab.baseUrl),
      baseUrl: sesalab.baseUrl,
      // les urls sur ce serveur, pour demander un login
      loginPage: 'sso/login',
      // pour une demande de logout (de sesalab et des autres sesatheques)
      logoutPage: 'sso/logout',
      // pour signaler une erreur
      errorPage: 'sso/error'
    }
    // on regarde s'il a pas déjà été défini, pour empêcher les doublons
    let existingIndex
    confSso.authServers.some(function (server, index) {
      if (server.name === authServer.name || server.baseUrl === authServer.baseUrl) {
        existingIndex = index
        sjtObj.merge(authServer, server)
        return true
      }
    })
    if (existingIndex) {
      confSso.authServers[existingIndex] = authServer
    } else {
      confSso.authServers.push(authServer)
    }
  })

  // loginCallback pour loguer un user ici, cette fonction sera appelée après un validate réussi,
  // le user est envoyé par le serveur d'authentification et mis au format User
  // on a pas accès au service $sesalabSsoClient ici, ça sera initialisé dans app/index.js
  // en attendant le component sesalab-sso met une fct qui renverra une erreu
  // confSso.loginCallback = function (context, user, next) { throw new Error('…') }
  // callback de logout, vire le user en session et on appelle next

  // pour le logout on peut déjà la fournir
  confSso.logoutCallback = function (context, next) {
    context.session.user = null
    next()
  }
  // et on ajoute le component sesalab-sso en dépendances
  if (!config.extraModules) config.extraModules = []
  config.extraModules.push('sesalab-sso')
  if (!config.extraDependenciesLast) config.extraDependenciesLast = []
  config.extraDependenciesLast.push('sesalab-sso')
}

module.exports = config
