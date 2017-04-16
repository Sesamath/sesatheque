/**
 * paramètres locaux pour npm test
 */
const path = require('path')
const logDir = path.join(__dirname, '../logsTest')
const appName = 'testSesatheque'
const port = 3011
const hostname = 'bibliotheque.local'
const host = hostname + ':' + port

const getLoggerConf = suffix => ({
  logLevel: 'debug',
  renderer: {
    name: 'fileRenderer',
    target: logDir + '/lassi' + suffix + '.log'
  }
})

module.exports = {
  application: {
    name: appName,
    baseId: 'sesathequetest',
    baseUrl: 'http://' + host + '/',
    baseIdRegistrar: 'sesathequetest',
    mail: 'tech@sesamath.net',
    staging: 'dev' // prod ou dev
  },
  $entities: {
    database: {
      host: 'localhost',
      port: '3306',
      user: 'mocha',
      password: 'mocha',
      database: 'mocha',
      connectTimeout: 1000,
      trace: true, // true par défaut, mettre false en prod ?
      // cf https://github.com/felixge/node-mysql/#pool-options
      connectionLimit: 3,
      waitForConnections: true, // avec true, si les 50 sont occupées on met en queue jusqu'à queueLimit
      acquireTimeout: 1000,
      queueLimit: 100,
      // avec mysql on pouvait mettre
      // debug: ['ComQueryPacket', 'ErrorPacket'] // Cf node_modules/mysql/lib/protocol/packets/ pour la liste
      // mais mysql2 distingue pas, et c'est très verbeux de mettre à true
      debug: false
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
  memcache: {host: '127.0.0.1', port: 11211, prefix: 'bib_'},
  sesatheques: [
    {baseId: 'biblilocal3001', baseUrl: 'http://bibliotheque.local:3001/'},
    {baseId: 'communlocal3003', baseUrl: 'http://commun.local:3003/'}
  ],
  sesalabs: [
    {
      name: 'Sésalab local',
      baseId: 'lablocal',
      baseUrl: 'http://sesalab.local:3002/'
    }
  ],
  lassiLogger: {
    [appName]: getLoggerConf('App'),
    '$auth': getLoggerConf('Auth'),
    lassi: getLoggerConf('Internal'),
    'lassi-actions': getLoggerConf('Actions'),
    'lassi-components': getLoggerConf('Components'),
    'lassi-services': getLoggerConf('Services')
  }
}
