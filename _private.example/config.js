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
    // utilisé en préfixe des message de log et dans qq messages
    name: 'sesatheque',
    // identifiant de cette sésathèque, utilisé pour les rid des ressources créées ici
    baseId: 'localhost3001',
    // sesatheque de référence pour les baseId avec lesquels on partage des ressources
    baseIdRegistrar: 'localhost3001',
    // si baseIdRegistrar connait baseId, faut mettre la valeur correspondante ici (ça permet de vérifier)
    // sert aussi pour les urls des composants statiques, ou pour construire des urls qu'on passe à l'extérieur
    // (sso par ex)
    baseUrl: 'https://localhost:3001/',
    mail: 'me@example.com',
    staging: 'dev' // prod ou dev
  },
  // @todo : à virer, ce setting ne sert que pour la migration MySQL => MongoDB, il pourra être supprimé par la suite.
  databaseMysql: {
    // à préciser
    host: 'xxx',
    port: '3306',
    user: 'xxx',
    password: 'xxx',
    database: 'xxx',
    connectTimeout: 1000,
    connectionLimit: 50,
    // avec true, si les N connectionLimit sont occupées, on met en queue jusqu'à queueLimit
    waitForConnections: true,
    acquireTimeout: 1000,
    queueLimit: 100,
    // mysql2 distingue pas, et c'est très verbeux de mettre à true
    debug: false
  },
  $entities: {
    // connexion mongoDb, à préciser
    database: {
      host: 'localhost',
      port: '27017',
      name: 'bibliotheque',
      user: 'bibliotheque',
      password: 'xxx'
    }
  },

  // ça c'est pour node qui va lancer l'appli, utilisé par lassi
  $server: {
    hostname: 'localhost',
    // on peut indiquer un autre port ici que celui de baseUrl, cli.js en mettra un autre par exemple
    port: 3001
  },

  // options pour les middlewares
  $rail: {
    cookie: {
      // à préciser avec une chaîne aléatoire complexe
      key: 'xxx' // en mettre un autre dans _private/config !
    },
    session: {
      // à préciser avec une chaîne aléatoire complexe
      secret: 'xxx' // en mettre un autre dans _private/config !
    }
  },

  /* pour modifier le comportement par défaut on peut préciser ici qq overrides,
  cf app/config.js pour les valeurs par défaut
  par ex pour empêcher un formateur de créer des groupes ou des ressources ici on peut mettre ça */
  components: {
    personne: {
      roles: {
        formateur: {create: false, createGroupe: false}
      }
    }
  },

  // les logs
  logs: {
    dir: path.join(__dirname, '../logs'),
    // le module log utilise des channels, on peut en exclure ici
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
      // apiToken: un token à utiliser par cette sesathèque pour lire des ressources restreintes chez elle
      // (à priori pour créer des alias vers ces ressources)
      // ce token devra être mis dans sa conf dans la liste des apiTokens
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
