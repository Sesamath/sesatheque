/**
 * Nos paramètres locaux, dont connexion à la base de données, que l'on conserve hors git
 *
 * Dans un fichier js (et pas json) pour pouvoir mettre des commentaires
 */

// pour la callback sesalabSso.loginCallback
var Personne = require('../constructors/Personne')

module.exports = {
  application: {
    baseUrl: 'http://example.com/',
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
  sesalabs: [
    'http://sesalab.example.com/'
  ],
  admin: {
    // user1:'password1',
    // user2:'password2'
  },
  // pour le module sesalab-sso si on l'a ajouté plus haut
  sesalabSso: {
    // on est client, on indique une liste de serveurs d'authentification
    // - que l'on pourra appeler pour s'authentifier
    // - qui pourront nous propager des login utilisateurs
    authServers: [
      {
        // url absolue avec / de fin
        baseUrl: 'http://sesalab.tld/',
        loginPage: 'debug/login',
        // pour demander un logout, page qui fera toutes les déconnexions en ajax et affichera le résultat
        logoutPage: 'debug/logout',
        errorPage: 'debug/error'
      }
    ],
    // une callback pour loguer un user ici, cette fonction sera appelée après un validate réussi,
    // le user est envoyé par le serveur d'authentification et mis au format User
    // on utilisera $sesalabSso.setLoginCallback dans sesatheque.config config car
    // $accessControl n'est pas encore dispo ici
    loginCallback: function (context, user, next) {
      throw new Error('Il fallait définir une callback de login avec $sesalabSso.setLoginCallback')
    },
    logoutCallback: function (context, next) {
      // on vire le user en session et on appelle next, avec une éventuelle erreur en cas de pb
      context.session.user = null
      next()
    }
  }
}

// pour installer sesasso-bibli, c'est
// npm install git+ssh://git@src.sesamath.net:npm-sesasso-bibli
// ça mettra le bon nom de module (sesasso-bibli) et installera la dépendance à sesasso
