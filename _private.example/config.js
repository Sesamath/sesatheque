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

const baseId = 'toBeConfigured'
const hostname = 'toBeConfigured'
const port = 1234
const baseUrl = `http://${hostname}:${port}/`

const logDir = path.join(__dirname, '..', `logs.${baseId}`)

module.exports = {
  application: {
    // OBLIGATOIRE identifiant de cette sésathèque, utilisé pour les rid des ressources créées ici
    baseId,
    // OBLIGATOIRE
    baseUrl,
    // utilisé en préfixe des message de log et dans qq messages
    name: 'Sesatheque',
    // ajouté en title
    title: 'Sésathèque',
    // h1 de la page d'accueil
    homeTitle: 'Bienvenue sur cette Sésathèque',
    // OBLIGATOIRE, pour les envois de notification (du système)
    mail: 'toBeConfigured',
    // ATTENTION, dev décale le port utilisé par node de 20 pour que le port prévu puisse
    // être utilisé par webpack-dev-server
    staging: 'dev'
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
      port: 27017,
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
  apiTokens: [
  ],

  // éventuelle liste d'ip hors lan autorisées à utiliser un token
  apiIpsAllowed: [
  ],

  // préciser éventuellement une clé pour utiliser bugsnag
  bugsnag: {
    apiKey: ''
  },

  /* pour modifier le comportement par défaut de nos components, on peut préciser ici qq overrides,
  cf app/config.js pour les valeurs par défaut
  par ex pour empêcher un formateur de créer des groupes ou des ressources ici on peut mettre ça */
  components: {
    personne: {
      roles: {
        formateur: {create: false, createGroupe: false}
      }
    }
  },

  // les modules à précharger avant bootstrap
  // (plus la peine d'ajouter sesalab-sso, il est ajouté automatiquement s'il y a un sesalab en conf)
  // extraModules: [],

  // les dépendances à ajouter au composant principal, en premier
  // extraDependenciesFirst : [],
  // et en dernier (en fonction de extraModules)
  // extraDependenciesLast: [],

  // pour configurer les logs lassi
  // cf _private.example/test.js

  // les logs, accessLog géré par lassi et déclaré dans $rail plus haut
  logs: {
    dir: logDir,
    // le module log utilise des channels, on peut en exclure ici
    debugExclusions: ['cache'],
    // à éviter en production, sauf pour des mesures ponctuellement
    perf: 'perf.log'
  },

  // mettre à true pour éventuellement supprimer le cache redis, déconseillé même en dev
  // noCache: false,

  // la liste des plugins que l'on veut activer (pour la visualisation et d'édition des ressources)
  plugins: {
    // la liste des plugins à activer qui sont dans le repo principal (app/plugins/<plugin>)
    internal: ['mental', 'serie', 'sequenceModele'],
    // la liste des plugins externes à activer
    external: {
      // mettre le nom du module en clé, 
      // pour la valeur mettre true pour utiliser url et version déclarés dans le package.json
      // (en peerDependencies, si le plugin y est déclaré bien sûr)
      // ou l'url de la source
      '@sesatheque-plugins/arbre': true,
      '@sesatheque-plugins/iep': true,
      '@sesatheque-plugins/j3p': true,
      '@sesatheque-plugins/mathgraph': true,
      '@sesatheque-plugins/qcm': true,
      '@sesatheque-plugins/url': true
      // un plugin existant dans les peerDependencies mais dont on veut une autre version
      // '@sesatheque-plugins/url': 'git+https://framagit.org/Sesamath/sesatheque-plugin-url.git#1.0.4',
      // et des plugins privés que l'on veut ajouter, avec leurs url et leur version
      // (attention, pnpm accepte une version mais pas un commit hash, yarn râle si c'est pas un commit)
      // '@sesatheque-plugins/xxx': 'git+https://framagit.org/user/sesatheque-plugin-xxx.git#1.0.3'
    }
  },

  // les sesalab qui nous causent (et propagent ici une authentification via sesalab-sso)
  // Attention, toutes les sésathèques que ces sesalab utilisent doivent être listées dans le module
  // sesatheque-client ou ci-dessus, pour qu'ils puissent créer des alias chez nous pointant
  // vers ces autres sésathèques
  sesalabs: [{
    // pour d'éventuels affichage d'erreurs sur la page
    name: 'mon sesalab local',
    // sert de préfixe au pid des personnes qui viennent de ce sesalab
    // NE PAS LE MODIFIER SANS METTRE À JOUR LA BASE
    baseId: 'sesalabLocal3000',
    // c'est ce qu'il nous envoie lorsqu'il boot, et on lui renvoie le baseId qu'on lui a attribué
    baseUrl: 'https://localhost:3000/'
  }],

  // urls absolues des sésathèques utilisées par nos ressources
  // (pour les alias d'une sesatheque dans une autre, mis par ex par un sesalab)
  // les baseId doivent être les mêmes que ceux mis dans les sesalabs qui nous contactent,
  // et identiques à ceux de sesatheque-client/src/sesatheques.js s'ils y sont
  // si on est baseIdRegistrar on répondra sur /api/baseId/:id pour ces baseId
  // inutile d'ajouter la sesatheque courante (baseId:baseUrl), elle est toujours ajoutée à la liste au boot
  sesatheques: [{
    baseId: 'localhost3002',
    baseUrl: 'http://localhost:3002/'
    // le token à utiliser par la sesathèque courante pour lire des ressources restreintes sur cette sésathèque externe
    // (à priori pour créer des alias vers ces ressources)
    // ce token devra être mis dans sa conf dans la liste des apiTokens
    // apiToken: 'xxx'
  }],

  // préciser true si y'a un varnish au dessus de nodeJs,
  // notamment pour purger les url en cas de modif (json par ex)
  varnish: false
}

// pour ajouter le SSO Sésamath, il faut installer sesasso-bibli et l'ajouter dans son _private
// le plus simple est de conserver ce module hors node_modules
// (pour éviter qu'il se fasse dégager à chaque install),
// donc dans le dossier _private (il faut avoir les droits sur le dépôt qui n'est pas public)
// cd _private
// git clone git@src.sesamath.net:sesasso-bibli
// cd sesasso-bibli
// pnpm install
//
// et ensuite ajouter dans ce fichier de config, au début
// const sesassoPath = path.resolve(__dirname, 'sesasso-bibli')
// et plus loin dans la config
// extraModules: [sesassoPath],
// ou bien (si on veut aussi du sso avec un sesalab)
// extraModules: [sesassoPath, 'sesalab-sso'],
// et
// extraDependenciesLast: ['sesasso-bibli'],
