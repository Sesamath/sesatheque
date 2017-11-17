/**
 * paramètres locaux pour npm test
 */
const path = require('path')
const sesatheques = require('sesatheque-client/src/sesatheques')
const logDir = path.join(__dirname, '../logsTest')
const appName = 'testSesatheque'
const port = 3011
const hostname = 'bibliotheque.local'
const host = hostname + ':' + port

// on ajoute cette sesatheque
const baseId = 'sesathequetest'
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
    baseUrl,
    baseIdRegistrar: 'sesathequetest',
    mail: 'tech@sesamath.net',
    staging: 'dev' // prod ou dev
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
  $server: {
    hostname: hostname,
    port: port
  },
  logs: {
    dir: logDir,
    debugExclusions: ['cache'],
    perf: 'perf.log'
  }, /* */

  // urls absolues des autres sésathèques utilisées par nos ressources (pour les alias ou sesalab)
  sesatheques: {
    communlocal: 'http://commun.local:3003/'
  },
  // les sesalab qui nous causent (et propagent ici une authentification)
  // Attention, toutes les sésathèques qu'ils utilisent doivent être listées dans le module
  // sesatheque-client ou ci-dessus, pour qu'ils puissent créer des alias chez nous pointant
  // sur ces autres sésathèques
  sesalabs: [
    {
      name: 'Sésalab local',
      baseId: 'lablocal',
      baseUrl: 'http://sesalab.local:3002/'
    }
  ],
  lassiLogger
}
