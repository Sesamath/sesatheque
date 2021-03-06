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
const { URL } = require('url')

const log = require('sesajstools/utils/log')
const sjtObj = require('sesajstools/utils/object')
const sjtUrl = require('sesajstools/http/url')

const {addSesatheque, reBaseUrl} = require('sesatheque-client/dist/server/sesatheques').default
// la conf du composant ressource à part
const configRessource = require('./ressource/config')
const {version} = require('../../package')
const checkConfigSesatheques = require('./checkConfigSesatheques')
const isTestEnv = process.argv.length > 1 && process.argv[1].includes('mocha')

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
    log.error(Error('sesatheque sans baseUrl valide'), item)
  }).filter((item) => item)
}

if (typeof window !== 'undefined') {
  // Ce fichier contient des infos sensible qu'on ne veut pas dans le code client
  // Normalement un require depuis du code client devrait passer par notre loader perso qui fait le ménage
  // mais on laisse ça en sécurité (oubli dans le pattern webpack pour ce config-loader)
  throw new Error('config.js should never be included in browser source code!')
}

/** La racine du projet */
const root = path.resolve(__dirname, '..', '..')
const logDir = process.env.LOGS || root + '/logs'

// la conf privée pour surcharger cette conf par défaut (et ajouter les accès à la base)
const privateConfPath = [root, '_private']
if (isTestEnv) {
  privateConfPath.push('test')
} else if (process.env.SESATHEQUE_CONF) {
  // on peut préciser un autre fichier de conf via l'environnement
  // (utile pour faire tourner plusieurs instances de l'appli)
  // on vérifie ici que y'a pas de slash dedans, pour signifier une erreur et arrêter là
  if (!/^[a-zA-Z0-9_-]+$/.test(process.env.SESATHEQUE_CONF)) throw new Error(`variable d’environnement SESATHEQUE_CONF invalide (${process.env.SESATHEQUE_CONF})`)
  privateConfPath.push(process.env.SESATHEQUE_CONF)
} else {
  privateConfPath.push('config')
}
const localConfig = require(path.join.apply(this, privateConfPath))

const toBeConfigured = 'toBeConfigured'

/**
 * Config par défaut
 */
const config = {
  version,
  // dans localConf, sinon conf par défaut i.e. port 3000
  application: {
    name: 'sesatheque',
    // ajouté en title
    title: 'Sésathèque',
    // h1 de la page d'accueil
    homeTitle: 'Bienvenue sur cette Sésathèque',
    // mis dans _private/config.js car dépendant de l'instance
    baseId: toBeConfigured, // l'id de cette sésathèque
    baseUrl: toBeConfigured,
    mail: toBeConfigured,
    // staging plus loin
    maintenance: {
      lockFile: '_private/maintenance.lock',
      message: 'Application en maintenance, merci d’essayer de nouveau dans quelques instants',
      staticDir: '_private/maintenance'
    }
  },
  $entities: {
    // mongo
    database: {
      host: 'localhost',
      port: 27017,
      // cf http://mongodb.github.io/node-mongodb-native/2.2/api/MongoClient.html#connect
      options: {
        poolSize: 10,
        reconnectTries: 1800 // 1/2h avec le reconnectInterval à 1000ms par défaut
      }
    }
  },
  $server: {
    port: process.env.PORT || 3001
  },
  $rail: {
    public: true,
    // compression : {},
    cookie: {
      key: toBeConfigured
    },
    // on veut pas du bodyParser de lassi
    // (on met les notres pour les limiter là où ils sont utiles)
    noBodyParser: true,
    // ça sera pour nos bodyParser
    bodyParser: {
      limit: '8mb' // limite d'un post (sinon 100kb par défaut)
    },
    session: {
      // name: 'mySessName',
      secret: toBeConfigured,
      saveUninitialized: true,
      /* cookie : {
        httpOnly : false
      }, /* */
      resave: true
    },
    authentication: {}
  },

  // le reste est spécifique à sesatheque et ignoré par lassi
  // Cf _private.example/config.js

  // une liste de tokens utilisables pour appeler l'api avec des droits en écriture
  apiTokens: [],

  // une liste d'autres serveurs d'authentification externes, {nom, baseId, baseUrl}
  authServers: [],

  // des paramètres pour nos composants
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
      /**
       * Les permissions possibles sont
       * create: créer une ressource
       * createAll: créer tout type de ressources (même celles non éditables)
       * read: lire une ressource (dépend de la ressource)
       * update: mettre une ressource
       * updateAuteurs: mettre à jour les auteurs
       * updateGroupes: mettre à jour les groupes d'une ressource
       * delete: effacer une ressource
       * deleteVersion: effacer une version
       * index: modifier le flag indexable ou les propriétés niveau / categorie / typeDocumentaire / typePedagogique
       * publish: modifier le flag publie
       * correction: accéder aux corrextions
       * createGroupe: créer un groupe
       */
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
    ressource: configRessource
  },

  // les différents logs
  logs: {
    dir: logDir,
    access: 'access.log',
    error: 'error.log',
    dataError: 'data.error.log',
    debug: 'debug.log',
    // perf      : 'perf.log', log les perfs si présent
    // ajouter les exclusions voulues parmi ['cache', 'resssourceRepository', 'personneRepository', 'accessControl']
    debugExclusions: []
  },

  // une liste de plugins à charger
  plugins: {
    internal: [],
    external: []
  },
  // et d'éventuelles options à leur passer
  pluginsOptions: {},

  // une liste de domaines 'sesalab' autorisés à appeler l'api pour stocker des séries ou séquences
  // sous la forme {nom, baseId, baseUrl}
  // écraser cette propriété avec un tableau vide dans _private/config.js pour s'en passer
  sesalabs: [],

  // urls absolues des sésathèques que l'on accepte de référencer (pour les alias, par ex quand
  // des sesalab connectés à plusieurs sésathèques mettent des ressources de l'une
  // dans des arbres de l'autre)
  // sous la forme baseId:baseUrl, ou nomQcq{id: baseId, baseUrl:laBaseHttpAbsolue, apiToken: leToken}
  // inutile d'ajouter la sesatheque courante (baseId:baseUrl), elle sera automatiquement ajoutée à la liste
  sesatheques: [],

  // mettre true s'il y a un varnish en frontal pour purger les urls mises en cache
  varnish: false
}

// on ajoute nos params locaux (accès à la base et port,
// mais aussi tout ce qui est spécifique à une installation de sesatheque)
if (localConfig) sjtObj.merge(config, localConfig)

// Le staging dépend de l'environnement d'execution
// - si on est lancé par mocha c'est toujours test
// - sinon on prend NODE_ENV
// - sinon config.application.staging
// - sinon dev

// -pre-prod- et pas preprod pour avoir le même nombre de lettre que production,
// pour préserver les source-map lors du passage en production
// (y'a un coup de sed sur les fichiers compilés par webpack, mais pas de recompil)
const knownStagings = ['production', '-pre-prod-', 'debug', 'dev', 'test']
let stagingConf = config.application.staging
if (stagingConf === 'prod') stagingConf = 'production'
if (stagingConf === 'preprod') stagingConf = '-pre-prod-'

let staging
if (isTestEnv) {
  staging = 'test'
} else if (process.argv.some(arg => arg.includes('webpack-dev-server'))) {
  staging = 'dev'
} else if (process.env.NODE_ENV === 'production') {
  // on laisse préprod si c'est ça qui était dans localConfig
  staging = stagingConf === '-pre-prod-' ? '-pre-prod-' : 'production'
} else if (knownStagings.includes(process.env.NODE_ENV)) {
  staging = process.env.NODE_ENV
} else if (knownStagings.includes(stagingConf)) {
  staging = stagingConf
} else {
  staging = 'production'
}
config.application.staging = staging

// pour bugsnag (il faudra mettre apiKey en private sinon il sera pas instancié
if (config.bugsnag && config.bugsnag.apiKey) {
  config.bugsnag.appVersion = version
  config.bugsnag.releaseStage = staging
  // on pourra ajouter endpoint si on veut traiter nous-même les retours
}

// si lassiLogger n'a pas été défini on l'ajoute maintenant,
// mais en utilisant logs.dir après override de _private
if (!config.lassiLogger) {
  // pour an-log, si on veut récupérer les logs db
  config.lassiLogger = {
    $entities: {
      logLevel: config.application.staging === 'production' ? 'warning' : 'debug',
      renderer: {name: 'file', target: config.logs.dir + '/entities.log'}
    }
  }
}

/**
 * À partir le là on a la conf locale, on vérifie et normalise un peu (autant signaler une erreur dès le boot)
 */
const isConfigured = (obj, path = '') => {
  if (typeof obj === 'object') {
    Object.entries(obj).forEach(([prop, value]) => {
      const currentPath = `${path}.${prop}`
      if (typeof value === 'object') return isConfigured(value, currentPath)
      if (value === toBeConfigured) throw new Error(`La propriété ${currentPath} doit être configurée`)
    })
  }
}
isConfigured(config, 'config')
// on vérifie quand même ça aussi (au cas où ce serait une chaîne vide)
if (!config.application.baseId) throw new Error('config.application.baseId manquant')
if (!config.application.baseUrl) throw new Error('config.application.baseUrl manquant')
// on ajoute toujours un slash de fin à baseUrl
if (config.application.baseUrl.substr(-1) !== '/') config.application.baseUrl += '/'

// on garanti que sesatheques est un tableau
if (!config.sesatheques) config.sesatheques = []
if (!Array.isArray(config.sesatheques)) {
  console.error(new Error('config.sesatheques doit être un Array'))
  config.sesatheques = []
}
// s'il y a du contenu il doit être conforme
if (config.sesatheques.length) {
  // check baseUrl valides (avec ajout slash de fin s'il manque)
  config.sesatheques = filterOnBaseUrl(config.sesatheques)
  const errors = checkConfigSesatheques(config.sesatheques, true)
  // en cas d'erreur on throw pour arrêter le boot
  if (errors.length) {
    errors.forEach(log.error)
    throw new Error('il y a des erreurs dans les sésathèques en configuration')
  } else {
    // on s'ajoute à la liste
    if (!config.sesatheques.some(st => st.baseId === config.application.baseId)) {
      config.sesatheques.push({baseId: config.application.baseId, baseUrl: config.application.baseUrl})
    }
    // on ajoute chaque sésathèque au registrar, si elle est déjà connue :
    // - avec cette baseUrl ça renvoie false mais ne gêne pas
    // - avec une autre baseUrl ça throw
    config.sesatheques.forEach(({baseId, baseUrl}) => addSesatheque(baseId, baseUrl))
  }
}

// faut aussi s'ajouter nous-même, au cas où sesatheque-client ne nous connaîtrait pas
addSesatheque(config.application.baseId, config.application.baseUrl)

/**
 * On passe à la conf de sesalabSso, déduite du reste si on a mis des sesalabs
 * (dans ce cas on est obligatoirement client sso de ces sesalab,
 * ce qui n'empêcherait pas d'être client sso d'autres sesatheques qui implémenteraient un $sesalabSsoServer)
 */
if (!config.sesalabs) config.sesalabs = []
if (!Array.isArray(config.sesalabs)) {
  console.error(new Error('config.sesalabs doit être un Array'))
  config.sesalabs = []
}
if (config.sesalabs.length) config.sesalabs = filterOnBaseUrl(config.sesalabs)

// pour valider du CORS, les baseUrl sans slash de fin
config.sesalabsByOrigin = {}
config.sesalabs.forEach(({baseUrl}) => {
  const origin = baseUrl.substr(0, baseUrl.length - 1)
  config.sesalabsByOrigin[origin] = true
})
if (!config.components) config.components = {}

// s'il y a des sesalab on génère la config du component sesalab-sso
if (config.sesalabs.length) {
  if (!config.components.sesalabSso) config.components.sesalabSso = {}
  const confSso = config.components.sesalabSso
  const hasLocalConf = Array.isArray(confSso.authServers) && confSso.authServers.length
  confSso.authServers = hasLocalConf ? filterOnBaseUrl(confSso.authServers) : []
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
  const name = 'sesalab-sso'
  if (!config.extraModules) config.extraModules = []
  if (!config.extraModules.includes(name)) config.extraModules.push(name)
  if (!config.extraDependenciesLast) config.extraDependenciesLast = []
  if (!config.extraDependenciesLast.includes(name)) config.extraDependenciesLast.push(name)
}

// on indique à webpack s'il doit mettre un devServer et où
if (staging === 'dev') {
  // le port utilisé par le navigateur ne doit pas changer (pour que le sso fonctionne et ne
  // pas avoir à changer baseUrl), on décale le port de node et on l'indique à devServer
  if (typeof config.$server.port !== 'number') config.$server.port = Number(config.$server.port)
  const frontPort = config.$server.port
  if (!Number.isInteger(frontPort)) throw new Error('Il faut préciser un port dans config.$server.port')
  const newNodePort = frontPort + 20 // arbitraire, en test on décale de 10
  const url = new URL(config.application.baseUrl)
  const defaultDevServer = {
    host: url.hostname, // sans le port, mais ça marche pas (ça reste localhost), faut le préciser avec --host dans l'appel pour que ce soit vraiment pris en compte
    port: frontPort
  }
  if (url.port) url.port = newNodePort
  const proxyUrl = url.toString().replace(/\/$/, '') // sans slash de fin
  config.devServer = Object.assign({}, defaultDevServer, config.devServer, { proxy: { '/': proxyUrl } })
  config.$server.port = newNodePort
}

module.exports = config
