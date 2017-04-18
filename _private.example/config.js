var path = require('path')

/**
 * Nos paramètres locaux, dont connexion à la base de données, que l'on conserve hors git
 *
 * Dans un fichier js (et pas json) pour pouvoir mettre des commentaires
 *
 * Ce fichier devrait pouvoir être copié tel quel dans _private et fonctionner avec docker-compose.yml
 *
 * Pour une paire de sesatheques global/private (avec docker-compose-for-sesalab.yml)
 * prendre les js de _private.exemple-docker-sesamath
 */
module.exports = {
  application: {
    name: 'sesatheque', // utilisé en préfixe des message de log et dans qq message
    // identifiant de cette sésathèque, qui devrait être connu de sesatheque-client,
    // utilisé pour les rid des ressources créées ici
    baseId: 'localhost3001',
    // sesatheque de référence qui groupe les baseId avec lesquels on partage des ressources
    baseIdRegistrar: 'localhost3001',
    // si baseIdRegistrar connait baseId, faut mettre la valeur correspondante ici (ça permet de vérifier)
    // sert aussi pour les urls des composants statiques, ou pour construire des urls qu'on passe à l'extérieur
    // (sso par ex)
    baseUrl: 'https://localhost:3001/',
    mail: 'me@example.com',
    staging: 'dev' // prod ou dev
  },
  $entities: {
    database: {
      host: 'localhost',
      port: '3306',
      user: 'sesatheque',
      password: 'sesatheque',
      database: 'sesatheque',
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
    /* pour pgsql on avait dans les anciens lassi
    database: {
     client    : 'pg',
     connection: {
       host    : 'xxx',
       port    : '5432',
       user    : 'xxx',
       password: 'xxx',
       database: 'xxx'
       }
     }
     /* */
  },

  // ça c'est pour node qui va lancer l'appli
  $server: {
    hostname: 'localhost',
    // on peut indiquer un autre port ici que celui de baseUrl, cli.js en mettra un autre par exemple
    port: 3001
  },

  // options pour les middleware
  $rail: {
    cookie: {
      key: 'asNTr!l7Dqtsg' // en mettre un autre dans _private/config !
    },
    session: {
      secret: 'ap68!&nVGq§ot' // en mettre un autre dans _private/config !
    }
  },

  /* pour modifier le comportement par défaut on peut préciser ici qq overrides,
  cf app/config.js pour les valeurs par défaut
  par ex pour empêcher un formateur de créer des groupes ou des ressources ici */
  components: {
    personne: {
      roles: {
        formateur: {create: false, createGroupe: false}
      }
    }
  },

  // les logs
  logs: {
    dir: path.join(__dirname, '../logs_commun'),
    debugExclusions: ['cache'],
    perf: 'perf.log'
  },
  memcache: {host: '127.0.0.1', port: 11211},
  // noCache:true,
  // les modules à précharger avant bootstrap
  extraModules: ['sesalab-sso'],
  // les dépendances à ajouter au composant principal, en premier
  // extraDependenciesFirst : ['sesasso-bibli'],
  // et en dernier
  extraDependenciesLast: ['sesalab-sso'],
  apiTokens: [
    // mettre ici d'éventuels tokens utilisables par une autre appli pour poster sur notre api
  ],
  apiIpsAllowed: [
    // une éventuelle liste d'ip hors lan autorisées à utiliser un token
  ],

  // urls absolues des sésathèques utilisées par nos ressources
  // (pour les alias d'une sesatheque dans une autre, mis par ex par un sesalab)
  // les baseId doivent être les mêmes que ceux mis dans les sesalabs qui nous contactent,
  // et identiques à ceux de sesatheque-client/src/sesatheques.js s'ils y sont
  // si on est baseIdRegistrar on répondra sur /api/baseId/:id pour ces baseId
  // inutile d'ajouter la sesatheque courante (baseId:baseUrl), elle est toujours ajoutée à la liste au boot
  sesatheques: [
    {
      baseId: 'localhost3003', // doit être le même que dans sesatheque-client/src/sesatheques.js s'il y est
      baseUrl: 'http://localhost:3003/'
      // apiTokens: un token qu’elle utiliserait pour ajouter des ressources ici
      // (à priori des alias vers les siennes)
    }
    // on pourrait en mettre d'autres…
  ],
  // les sesalab qui nous causent (et propagent ici une authentification via sesalab-sso)
  // Attention, toutes les sésathèques que ces sesalab utilisent doivent être listées dans le module
  // sesatheque-client ou ci-dessus, pour qu'ils puissent créer des alias chez nous pointant
  // vers ces autres sésathèques
  sesalabs: [
    {
      name: 'mon sesalab local',  // pour d'éventuels affichage d'erreurs sur la page
      baseId: 'labomepLocal3002', // pas encore pris en compte
      baseUrl: 'https://localhost:3002/'
    }
    // il pourrait y en avoir plusieurs
  ]
}

// pour ajouter le SSO Sésamath, il faut installer sesasso-bibli avec
// npm install git+ssh://git@src.sesamath.net:sesasso-bibli
// (il faut avoir les droits sur ce dépôt qui n'est pas public)
