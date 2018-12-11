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
    mail: 'sesatheque@example.com',
    maintenance: {
      lockFile: '_private/maintenance.lock',
      message: 'Application en maintenance, merci d’essayer de nouveau dans quelques instants',
      staticDir: '_private/maintenance'
    },
    staging: 'test' // avec dev ça décale le port de 20 pour être utilisé avec webpack-dev-server
  },

  // config des services lassi
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
      password: 'mocha',
      options: {
        poolSize: 10,
        reconnectTries: 1800 // 1/2h avec le reconnectInterval à 1000ms par défaut
      }
    }
  },
  // options pour les middlewares
  $rail: {
    accessLog: {
      logFile: `logs/${baseId}.access.log`,
      withSessionTracking: true
    },
    cookie: {
      key: 'xxx' // à changer obligatoirement
    },
    session: {
      secret: 'xxx' // à changer obligatoirement
    }
  },
  $server: {
    hostname,
    port
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
  // extraDependenciesFirst : [],
  // et en dernier (adapter suivant extraModules)
  extraDependenciesLast: ['sesalab-sso']
}
