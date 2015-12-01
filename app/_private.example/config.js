/**
 * Nos paramètres locaux, dont connexion à la base de données, que l'on conserve hors git
 *
 * Dans un fichier js (et pas json) pour pouvoir mettre des commentaires
 */

module.exports = {
  application : {
    baseUrl : 'http://example.com',
    mail : "me@example.com",
    staging: 'dev' // prod ou dev
  },
  $entities : {
    database: {
      // @see http://knexjs.org/#Installation-client pour la syntaxe de entities.database
      host: "",
      port: "",
      user: "",
      password: "",
      database: "",
      connectTimeout : 1000,
      trace : true, // true par défaut, mettre false en prod ?
      // cf https://github.com/felixge/node-mysql/#pool-options
      connectionLimit : 50,
      waitForConnections : true, // avec true, si les 50 sont occupées on met en queue jusqu'à queueLimit
      acquireTimeout : 1000,
      queueLimit : 100,
      debug : false // mysql2 distingue pas, et c'est très verbeux de mettre à true
      // debug: ['ComQueryPacket', 'ErrorPacket'] // Cf node_modules/mysql/lib/protocol/packets/ pour la liste
    }
    /* pour pgsql on avait dans les anciens lassi
    database: {
     client    : "pg",
     connection: {
       host    : "xxx",
       port    : "5432",
       user    : "xxx",
       password: "xxx",
       database: "xxx"
       }
     }
     /* */
  },
  $server : {
    hostname : 'example.com',
    port : process.env.PORT || 3001
  },
  logs : {
    debugExclusions : ['cache'],
    perf : 'perf.log'
  }, /* */
  memcache : '127.0.0.1:11211',
  //noCache:true,
  // les modules à précharger avant bootstrap
  extraModules : ['myExtraModule'],
  // les dépendances à ajouter au composant principal, en premier
  //extraDependenciesFirst : ['sesasso-bibli'],
  // et en dernier
  extraDependenciesLast : ['myExtraComponent'],
  apiTokens : [
    'token1',
    'token2',
  ],
  sesalabs : [
    "http://labomep.example.com/"
  ],
  admin : {
    //user1:"password1",
    //user2:"password2"
  }
}

// pour installer sesasso-bibli, c'est
// npm install git+ssh://git@src.sesamath.net:npm-sesasso-bibli
// ça mettra le bon nom de module (sesasso-bibli) et installera la dépendance à sesasso
