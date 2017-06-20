var path = require('path')

/**
 * Config de sesathequeGlobal pour une paire de sesatheques global/private (avec docker-compose-for-sesalab.yml)
 * Fichier à copier dans _private/commun.js
 */
module.exports = {
  application: {
    name: 'sesathequePrivate', // utilisé en préfixe des message de log et dans qq message
    baseId: 'localhost3003', // identifiant de cette sésathèque, qui devrait être connu de sesatheque-client
    baseIdRegistrar: 'localhost3003', // sesatheque de référence qui groupe les baseId avec lesquels on partage des ressources
    baseUrl: 'http://commun.local:3003/', // si baseIdRegistrar connait baseId, faut mettre la valeur correspondante ici
    mail: 'me@example.com',
    // pour que cette sesathèque ait ses propres js (webpack les compile en mettant baseUrl
    // en dur dedans pour le chargement async), il faut un override ici
    webpackOutput: 'publicCommun',
    staging: 'dev' // prod ou dev
  },
  $entities: {
    database: {
      host: 'mysql-private',
      port: '3306',
      user: 'stcommun',
      password: 'stcommun',
      database: 'stcommun',
      connectTimeout: 1000,
      trace: true, // true par défaut, mettre false en prod ?
      // cf https://github.com/felixge/node-mysql/#pool-options
      connectionLimit: 50,
      waitForConnections: true, // avec true, si les 50 sont occupées on met en queue jusqu'à queueLimit
      acquireTimeout: 1000,
      queueLimit: 100,
      debug: false // mysql2 distingue pas, et c'est très verbeux de mettre à true
      // debug: ['ComQueryPacket', 'ErrorPacket'] // Cf node_modules/mysql/lib/protocol/packets/ pour la liste
    }
  },
  $server: {
    hostname: 'localhost',
    port: 3003
  },
  $rail: {
    cookie: {
      key: 'asNTr!l7Dqtsg' // en mettre un autre dans _private/config !
    },
    session: {
      secret: 'ap68!&nVGq§ot' // en mettre un autre dans _private/config !
    }
  },
  logs: {
    dir: path.join(__dirname, '../logs_commun'),
    debugExclusions: ['cache'],
    perf: 'perf.log'
  },
  memcache: {host: 'memcache', port: 11211},
  // noCache:true,
  // les modules à précharger avant bootstrap
  extraModules: ['sesalab-sso'],
  // les dépendances à ajouter au composant principal, en premier
  // extraDependenciesFirst : ['sesasso-bibli'],
  // et en dernier
  extraDependenciesLast: ['sesalab-sso'],
  apiTokens: [
    // mettre ici d'éventuels tokens utilisables pour poster sur notre api (sans session préalable)
    // ici celui de sesathequeGlobal
    'VRYm7GT1h8L7&BJE§Uul!dWX/CCqmSZEpad'
  ],
  apiIpsAllowed: [
    // une éventuelle liste d'ip hors lan autorisées à utiliser les tokens
  ],

  // urls absolues des sésathèques utilisées par nos ressources
  // (pour les alias d'une sesatheque dans une autre, mis par ex par un sesalab)
  // les baseId doivent être les mêmes que ceux mis dans les sesalabs qui nous contactent,
  // et identiques à ceux de sesatheque-client/src/sesatheques.js s'ils y sont
  // si on est baseIdRegistrar on répondra sur /api/baseId/:id pour ces baseId
  // inutile d'ajouter la sesatheque courante (baseId:baseUrl), elle est toujours ajoutée à la liste au boot
  sesatheques: [
    {
      baseId: 'localhost3001', // doit être le même que dans sesatheque-client/src/sesatheques.js s'il y est
      baseUrl: 'http://localhost:3001/'
      // apiTokens: un token à utiliser pour son api
    }
    // on pourrait en mettre d'autres…
  ],
  // les sesalab qui nous causent (et propagent ici une authentification)
  // Attention, toutes les sésathèques qu'ils utilisent doivent être listées dans le module
  // sesatheque-client ou ci-dessus, pour qu'ils puissent créer des alias chez nous pointant
  // sur ces autres sésathèques
  sesalabs: [ {
    name: 'mon sesalab local',
    baseId: 'sesalabLocal',
    baseUrl: 'http://remplacer-par-ip-reseau:3002/'
  }],
  admin: {
    // user1:'password1',
    // user2:'password2'
  }
  // pour sesalabSso, config.js l'ajoute tout seul si on a mis des sesalabs
}

// pour installer sesasso-bibli, c'est
// npm install git+ssh://git@src.sesamath.net:npm-sesasso-bibli
// ça mettra le bon nom de module (sesasso-bibli) et installera la dépendance à sesasso
