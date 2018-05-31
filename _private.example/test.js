/**
 * paramètres locaux pour npm test
 */
const path = require('path')
const sesatheques = require('sesatheque-client/src/sesatheques')
const logDir = path.join(__dirname, '../logsTest')
// sert de préfixe de log, dbName et redisPrefix
const appName = 'testSesatheque'
const baseId = 'sesathequeTest'
const hostname = 'localhost'
const port = 3011
const host = `${hostname}:${port}`
const baseUrl = `http://${host}/`
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
    baseUrl,
    baseIdRegistrar: baseId,
    mail: 'sesatheque@example.com',
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
      key: 'xxx' // à changer obligatoirement
    },
    session: {
      secret: 'xxx' // à changer obligatoirement
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
  logs: {
    dir: logDir,
    debugExclusions: ['cache'],
    perf: 'perf.log'
  },
  lassiLogger,
  // pour tester le sso avec un sesalab, il faut ajouter ça
  // les modules à précharger avant bootstrap, ici pour fonctionner avec un sesalab
  extraModules: ['sesalab-sso'],

  // les dépendances à ajouter au composant principal, en premier
  // extraDependenciesFirst : ['sesasso-bibli'],
  // et en dernier
  // suivant extraModules
  extraDependenciesLast: ['sesalab-sso'],
}
