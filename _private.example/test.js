/**
 * paramètres locaux pour npm test
 */
const path = require('path')
const sesatheques = require('sesatheque-client/src/sesatheques')
const logDir = path.join(__dirname, '../logsTest')
const appName = 'testSesatheque'
const port = 3011
const hostname = 'sesatheque.local'
const host = hostname + ':' + port

// on ajoute cette sesatheque
const baseId = 'sesathequeTest'
const baseUrl = 'http://' + host + '/'
sesatheques.addSesatheque(baseId, baseUrl)

const getLoggerConf = suffix => ({
  logLevel: 'error',
  renderer: {
    name: 'file',
    target: logDir + '/lassi' + suffix + '.log'
  }
})
const lassiLogger = {}
;[appName, '$auth', '$cache', 'EntityDefinition', 'lassi', '$server', 'lassi-actions', 'lassi-components', 'lassi-services', '$rail', '$updates'].forEach(p => { lassiLogger[p] = getLoggerConf(p) })

module.exports = {
  application: {
    name: appName,
    baseId,
    baseIdRegistrar: baseId,
    baseUrl,
    mail: 'you@example.com',
    staging: 'test'
  },
  $cache: {
    redis: {
      prefix: appName
    }
  },
  $entities: {
    // connexion mongoDb
    database: {
      host: 'localhost',
      port: '27017',
      name: appName,
      user: 'mocha',
      password: 'mocha'
    }
  },
  $rail: {
    cookie: {
      key: 'a23G6!C0#zsB3gxba43g'
    },
    session: {
      secret: 'C0#zsB3gxba43!gy3i5xo' // OBLIGATOIRE
    }
  },
  $server: {
    hostname: hostname,
    port: port
  },
  // pour les tests unitaires il faut au moins un token
  apiTokens: [
    'nsXpo736nSG#8sg*2a8/bFp(A'
  ],
  // les modules à précharger avant bootstrap, ici pour fonctionner avec un sesalab
  extraModules: ['sesalab-sso'],

  // les dépendances à ajouter au composant principal, en premier
  // extraDependenciesFirst : ['sesasso-bibli'],
  // et en dernier
  // suivant extraModules
  extraDependenciesLast: ['sesalab-sso'],
  logs: {
    dir: logDir,
    debugExclusions: ['cache'],
    perf: 'perf.log'
  },
  lassiLogger
}
