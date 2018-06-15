var path = require('path')

/**
 * Nos paramètres locaux, dont connexion à la base de données, que l'on conserve hors git,
 * dans un fichier js (et pas json) pour pouvoir mettre des commentaires
 *
 * Il contient toutes les clés utilisées ou utilisables, certaines sont initialisées ici
 * avec leur valeur par défaut. Les clés obligatoires sont mentionnées
 *
 * Ce fichier devrait pouvoir être copié tel quel dans _private et fonctionner avec docker-compose.yml
 * (après avoir complété les champs obligatoires)
 *
 * Pour une paire de sesatheques global/private (avec docker-compose-for-sesalab.yml)
 * prendre les js de _private.exemple-docker-sesamath
 */
module.exports = {
  application: {
    // utilisé en préfixe des message de log et dans qq messages
    name: 'sesatheque', // OBLIGATOIRE
    // identifiant de cette sésathèque, utilisé pour les rid des ressources créées ici
    baseId: 'localhost3001', // OBLIGATOIRE
    baseUrl: 'http://localhost:3001/', // OBLIGATOIRE
    // pour les envois de notification (du système)
    mail: '', // OBLIGATOIRE
    // utilisé par le SSO (sesasso-bibli et sesalab-sso), prod|dev
    staging: 'dev', // OBLIGATOIRE
    // délai de conservation en cache, peut être élevé car on change l'url à chaque publication de version
    staticMaxAge: '7d',
    maintenance: {
      lockFile: '_private/maintenance.lock',
      message: 'Application en maintenance, merci d’essayer de nouveau dans quelques instants',
      staticDir: '_private/maintenance'
    }
  },

  // pour redis, prefix obligatoire
  $cache: {
    redis: {
      prefix: 'sesatheque'
    }
  },

  // connexion mongoDb, pour lassi, à préciser
  $entities: {
    database: {
      host: 'localhost',
      port: '27017',
      name: 'sesatheque',
      user: '',
      password: '',
      // cf http://mongodb.github.io/node-mongodb-native/2.2/api/MongoClient.html#connect
      options: {
        poolSize: 10,
        reconnectTries: 1800 // 1/2h avec le reconnectInterval à 1000ms par défaut
      }
    }
  },

  // options pour les middlewares
  $rail: {
    cookie: {
      // à préciser avec une chaîne aléatoire complexe
      key: '' // OBLIGATOIRE
    },
    session: {
      // à préciser avec une chaîne aléatoire complexe
      secret: '' // OBLIGATOIRE
    }
  },

  // ça c'est pour node qui va lancer l'appli, utilisé par lassi
  $server: {
    hostname: 'localhost',
    // port d'écoute de nodeJs, on peut indiquer ici un autre port ici que celui de baseUrl
    // (si y'a un proxy, ou par ex pour cli.js qui en mettra un autre)
    port: 3001
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

  // noCache:true,
  // les modules à précharger avant bootstrap, ici pour fonctionner avec un sesalab
  extraModules: ['sesalab-sso'],

  // les dépendances à ajouter au composant principal, en premier
  // extraDependenciesFirst : ['sesasso-bibli'],
  // et en dernier
  // suivant extraModules
  extraDependenciesLast: ['sesalab-sso'],

  // éventuels tokens utilisables par une autre appli pour poster sur notre api
  apiTokens: [
  ],

  // éventuelle liste d'ip hors lan autorisées à utiliser un token
  apiIpsAllowed: [
  ],

  // urls absolues des sésathèques utilisées par nos ressources
  // (pour les alias d'une sesatheque dans une autre, mis par ex par un sesalab)
  // les baseId doivent être les mêmes que ceux mis dans les sesalabs qui nous contactent,
  // et identiques à ceux de sesatheque-client/src/sesatheques.js s'ils y sont
  // si on est baseIdRegistrar on répondra sur /api/baseId/:id pour ces baseId
  // inutile d'ajouter la sesatheque courante (baseId:baseUrl), elle est toujours ajoutée à la liste au boot
  sesatheques: [
    {
      baseId: 'localhost3002', // doit être le même que dans sesatheque-client/src/sesatheques.js s'il y est
      baseUrl: 'http://localhost:3002/'
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
      // pour d'éventuels affichage d'erreurs sur la page
      name: 'mon sesalab local',
      // sert de préfixe au pid des personnes qui viennent de ce sesalab
      baseId: 'sesalabLocal3000',
      // c'est ce qu'il nous envoie lorsqu'il boot, et on lui renvoie le baseId qu'on lui a attribué
      baseUrl: 'https://localhost:3000/'
    }
    // il pourrait y en avoir plusieurs
  ]
}

// pour ajouter le SSO Sésamath, il faut installer sesasso-bibli et l'ajouter dans son _private
// le plus simple est de conserver ce module hors node_modules
// (pour éviter qu'il se fasse dégager à chaque install),
// donc dans le dossier _private (il faut avoir les droits sur le dépôt qui n'est pas public)
// cd _private
// git clone git@src.sesamath.net:sesasso-bibli
// cd sesasso-bibli
// yarn install
//
// et ensuite ajouter dans ce fichier, au début
// const sesassoPath = path.resolve(__dirname, 'sesasso-bibli')
// et plus loin dans la config
// extraModules: [sesassoPath],
// ou bien (si on veut aussi du sso avec un sesalab)
// extraModules: [sesassoPath, 'sesalab-sso'],
// et
// extraDependenciesLast: ['sesasso-bibli'],
