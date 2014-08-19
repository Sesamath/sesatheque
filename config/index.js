/**
 * Configuration de l'application
 */
console.log('lecture config appli')
var _ = require('underscore')._
var fs = require('fs');
var moment = require('moment')

/**
 * On est config/index.js (hors build)
 */

/** Le dossier build */
var builddir = __dirname + '/../build';
/** La racine du projet */
var root  = __dirname + '/..';

/**
 * L'environnement d'execution est récupéré par NODE_ENV
 * Il peut valoir production, integration ou development (les valeurs de lassi.Staging) et sera
 * mis à development par défaut
 */
var staging = process.env.NODE_ENV
// si pas fourni ou pas une valeur connue ce sera dev
if (!staging || !lassi.Staging[staging]) staging = lassi.Staging.development

/**
 * Ce serait mieux de mettre ça ailleurs pour ne garder que du déclaratif ici,
 * mais une fois le logger renvoyé (par son constructeur appelé par lassi)
 * on peut plus lui changer ses params, faut donc créer ce writeStream avant d'appeler lassi
 */
var logAccess = root + '/logs/' + staging + '.access.log';
var logAccessWriteStream = fs.createWriteStream(logAccess, {'flags': 'a'});
var morganSettings

if (staging === lassi.Staging.development) {
  lassi.require('morgan').token('post', function (req, res) {
    return (_.isEmpty(req.body)) ? '': JSON.stringify(req.body)
  })
  lassi.require('morgan').token('moment', function () {
    return moment().format('YYYY-MM-DD HH:mm:ss.SSS')
  })
  morganSettings = {
    format: ':moment :method :url :status :response-time ms - :res[content-length] :post',
    skip  : function (req) {
      var excluded = ['css', 'js', 'ico', 'png', 'jpeg']
      var i = req.url.lastIndexOf('.')
      var suffix = (i > 0) ? req.url.substr(i + 1) : null // au moins un char avant le point
      return (suffix && excluded.indexOf(suffix) > -1)
    },
    stream: logAccessWriteStream
  }
} else {
    morganSettings = {format:'default', options : {stream : logAccessWriteStream}, buffer:true}
}

/** La config exportée */
module.exports = {
  application : {
    name : "bibliotheque",
    mail : "tech@sesamath.net",
    staging: staging
  },
  entities: {
    // Configuration de la base de données
    database: require(root + '/_private/dbconfig')
  },
  renderer: {
    cache: false
  },
  layout  : {
    data : builddir + '/data',
    cache: builddir + '/data/cache'
  },
  rail    : {
    // cors : {origin: '*'},
    favicon       : '/assets/images/favicon.ico',
    logger        : morganSettings, // passé tel quel à morgan()
    public        : true,
    //compression : {},
    cookie: {
      key: 'asqlSTsrl78lAsg'
    },
    session: {
      secret: 'asqlSTsrl78lAsg',
      saveUninitialized: true,
      resave: true
    },
    authentication: {}
  },
  components: {
    // Configuration des roles (settings du composant personne)
    personne : {
      roles: {
        // en attendant de gérer modIndexation, modParametres et publish on utilise juste write
        admin    : ['add', 'delVersion', 'del', 'modIndexation', 'modParametres', 'publish', 'read', 'readProf', 'write'],
        editor   : ['add', 'modIndexation', 'modParametres', 'publish', 'readProf', 'write'],
        indexator: ['modIndexation', 'readProf'],
        prof     : ['readProf']
      }
    }
  },
  // le reste est spécifique à notre appli et ignoré par lassi
  // les différents logs
  logs : {
    access    : root + '/logs/' + staging + '.access.log',
    error     : root + '/logs/' + staging + '.error.log',
    errorData : root + '/logs/' + staging + '.errorData.log',
    dev       : root + '/logs/dev.log',
    // mettre à true pour ajouter dans dev.log toutes les entrées / sorties du cache
    cacheEntries : false
  }
}
