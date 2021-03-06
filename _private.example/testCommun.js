/**
 * paramètres locaux pour npm test
 */
const path = require('path')
const logDir = path.join(__dirname, '../logs.test')
const appName = 'testSesatheque'
const port = 3013
const hostname = 'sesatheque.local'
const host = hostname + ':' + port

// on ajoute cette sesatheque
const baseId = 'bibliLocalTest'
const baseUrl = 'http://' + host + '/'

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
      key: 'C0#zsB3gxba43ga2G6!pXE'
    },
    session: {
      secret: 'C0#gy3i5xo!zsB3gxba43' // OBLIGATOIRE
    }
  },
  $server: {
    port: port
  },

  // autres params pour notre appli
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
  // logs
  logs: {
    dir: logDir,
    debugExclusions: ['cache'],
    perf: 'perf.log'
  },

  // noCache:true,
  // urls absolues des autres sésathèques utilisées par nos ressources (pour les alias ou sesalab)
  sesatheques: {
    bibliLocalTest: 'http://commun.local:3011/'
  },
  // les sesalab qui nous causent (et propagent ici une authentification)
  // Attention, toutes les sésathèques qu'ils utilisent doivent être listées dans le module
  // sesatheque-client ou ci-dessus, pour qu'ils puissent créer des alias chez nous pointant
  // sur ces autres sésathèques
  sesalabs: [
    {
      name: 'Labomep local de test',
      baseId: 'labomepLocalTest',
      baseUrl: 'http://labomep.local:3012/'
    }
  ],
  lassiLogger
}
