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
const path = require('path')

const baseId = 'sesathequeTest'
const appName = baseId
const hostname = 'localhost'
const port = 3011
const baseUrl = `http://${hostname}:${port}/`

const logDir = path.join(__dirname, '..', `logs.${baseId}`)

// en test, on veut tous les logs lassi en fichier (pour pas poulluer la sortie mocha)
const getLoggerConf = suffix => ({
  logLevel: 'error',
  renderer: {
    name: 'file',
    target: `${logDir}/lassi.${suffix}.log`
  }
})
const lassiLogger = {}
;[appName, '$auth', '$cache', 'EntityDefinition', 'lassi', '$server', 'lassi-actions', 'lassi-components', 'lassi-services', '$rail', '$updates'].forEach(p => { lassiLogger[p] = getLoggerConf(p) })

module.exports = {
  application: {
    // OBLIGATOIRE identifiant de cette sésathèque, utilisé pour les rid des ressources créées ici
    baseId,
    // OBLIGATOIRE
    baseUrl,
    // utilisé en préfixe des message de log et dans qq messages
    name: appName,
    // ajouté en title
    title: 'Bibliothèque',
    // h1 de la page d'accueil
    homeTitle: 'Bienvenue sur cette Bibliothèque (test)',
    // OBLIGATOIRE, pour les envois de notification (du système)
    mail: 'sesatheque@example.com',
    // ATTENTION, dev décale le port utilisé par node de 20 pour que le port prévu puisse
    // être utilisé par webpack-dev-server
    // Important de mettre test pour la conf de test !
    staging: 'test' // avec dev ça décale le port de 20 pour être utilisé avec webpack-dev-server
  },

  // pour redis, prefix obligatoire
  $cache: {
    redis: {
      prefix: baseId
    }
  },

  // connexion mongoDb, pour lassi, à préciser
  $entities: {
    database: {
      host: 'localhost',
      port: '27017',
      name: '',
      user: '',
      password: ''
    }
  },
  // options pour les middlewares
  $rail: {
    accessLog: {
      logFile: `${logDir}/access.log`,
      withSessionTracking: true
    },
    cookie: {
      // OBLIGATOIRE, à préciser avec une chaîne aléatoire complexe
      key: 'toBeConfigured'
    },
    session: {
      // OBLIGATOIRE, à préciser avec une chaîne aléatoire complexe
      secret: 'toBeConfigured'
    }
  },

  // ça c'est pour node qui va lancer l'appli, utilisé par lassi
  $server: {
    hostname,
    // port d'écoute de nodeJs, on peut indiquer ici un autre port ici que celui de baseUrl
    // (si y'a un proxy, ou par ex pour cli.js qui en mettra un autre)
    port
  },

  // éventuels tokens utilisables par une autre appli pour poster sur notre api
  // pour les tests unitaires il faut au moins un token (utilisé par le serveur testé et le client qui teste)
  apiTokens: [
    'nsXpo736nSG#8sg*2a8/bFp(A'
  ],

  // pas de bugsnag en test

  // les modules à précharger avant bootstrap
  // (plus la peine d'ajouter sesalab-sso, il est ajouté automatiquement s'il y a un sesalab en conf)
  // extraModules: [],

  // les dépendances à ajouter au composant principal, en premier
  // extraDependenciesFirst : [],
  // et en dernier (en fonction de extraModules)
  // extraDependenciesLast: [],

  // pour des logs particuliers en test
  lassiLogger,

  // les logs, accessLog géré par lassi et déclaré dans $rail plus haut
  logs: {
    dir: logDir,
    // le module log utilise des channels, on peut en exclure ici
    debugExclusions: ['cache'],
    // à éviter en production, sauf pour des mesures ponctuellement
    perf: 'perf.log'
  },

  // pas besoin des plugins en test

  // pas besoin de déclarer de sésalab pour les tests
  // sesalabs: [],

  // ni d'autre sesatheques
  // sesatheques: [],
  // préciser true si y'a un varnish au dessus de nodeJs,
  // notamment pour purger les url en cas de modif (json par ex)
  varnish: false
}
