/**
 * paramètres locaux pour npm test
 */
const path = require('path')
const uuid = require('an-uuid')
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
    staging: 'test'
  },
  $cache: {
    redis: {
      host: 'redis',
      port: 6379,
      prefix: appName
    }
  },
  $entities: {
    // connexion mongoDb
    database: {
      host: 'mongo',
      port: 27017,
      name: appName
    }
  },
  $rail: {
    cookie: {
      key: uuid()
    },
    session: {
      secret: uuid()
    }
  },
  $server: {
    hostname: hostname,
    port: port
  },
  // pour les tests unitaires il faut au moins un token
  apiTokens: [
    uuid()
  ],
  logs: {
    dir: logDir,
    debugExclusions: ['cache'],
    perf: 'perf.log'
  },
  lassiLogger
}
