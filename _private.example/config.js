/**
 * Nos paramètres locaux, dont connexion à la base de données, que l'on conserve hors git
 *
 * Dans un fichier js (et pas json) pour pouvoir mettre des commentaires
 */
module.exports = {
  application: {
    name: 'nomDeCetteAppli',
    baseId: 'xxx', // identifiant de cette sésathèque, qui devrait être connu de
    baseIdRegistrar: '…', // sesatheque de référence qui groupe les baseId avec lesquels on partage des ressources
    baseUrl: 'https://example.com/',
    mail: 'me@example.com',
    staging: 'dev' // prod ou dev
  },
  $entities: {
    database: {
      // @see http://knexjs.org/#Installation-client pour la syntaxe de entities.database
      host: '',
      port: '',
      user: '',
      password: '',
      database: '',
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
  $server: {
    hostname: 'example.com',
    port: process.env.PORT || 3001
  },
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
  par ex pour empêcher un formateur de créer des groupes ou des ressources
  components: {
    personne: {
      roles: {
        formateur: {create: false, createGroupe: false}
      }
    }
  },
   */
  logs: {
    debugExclusions: ['cache'],
    perf: 'perf.log'
  }, /* */
  memcache: {host: '127.0.0.1', port: 11211},
  // noCache:true,
  // les modules à précharger avant bootstrap
  extraModules: ['sesalab-sso'],
  // les dépendances à ajouter au composant principal, en premier
  // extraDependenciesFirst : ['sesasso-bibli'],
  // et en dernier
  extraDependenciesLast: ['sesalab-sso'],
  apiTokens: [
    'token1',
    'token2'
  ],
  apiIpsAllowed: [
    // une éventuelle liste d'ip hors lan autorisées à utiliser les tokens
  ],
  // urls absolues des sésathèques utilisées par nos ressources
  // (pour les alias d'une sesatheque dans une autre, mis par ex par un sesalab)
  // ces noms doivent être les mêmes que ceux mis dans les sesalabs qui nous contactent
  // si on est baseIdRegistrar on répondra sur /api/baseId/:id pour ces baseId
  // inutile d'ajouter la sesatheque courante (baseId:baseUrl), elle sera automatiquement ajoutée à la liste
  sesatheques: {
    // sesatheque des ressources présentées à gauche dans un sesalab
    idSesatheque1: 'https://…/',
    // sesatheque des ressources personnelles des utilisateurs d'un sesalab
    idSesatheque2: 'https://…/'
    // autre sesatheque dont on peut référencer des items
    // …
  },
  // les sesalab qui nous causent (et propagent ici une authentification)
  // Attention, toutes les sésathèques qu'ils utilisent doivent être listées dans le module
  // sesatheque-client ou ci-dessus, pour qu'ils puissent créer des alias chez nous pointant
  // sur ces autres sésathèques
  sesalabs: [ {
    name: 'un nom pour ce sesalab',
    baseUrl: 'https://sesalab.example.com/'
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
