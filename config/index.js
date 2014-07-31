/**
 * Configuration de l'application
 */

/**
 * On est config/index.js (hors build)
 */

/** Le dossier build */
var builddir = __dirname + '/../build';
/** La racine du projet */
var root  = __dirname + '/..';

var _ = require('underscore')._

var env = process.env.NODE_ENV || 'dev';
/**
 * Ce serait mieux de mettre ça ailleurs pour ne garder que du déclaratif ici,
 * mais une fois le logger renvoyé (par son constructeur appelé par lassi)
 * on peut plus lui changer ses params, faut donc créer ce writeStream avant d'appeler lassi
 */
var fs = require('fs');

var logAccess = root + '/logs/' + env + '.access.log';
var logAccessWriteStream = fs.createWriteStream(logAccess, {'flags': 'a'});
var morganSettings = {format:'default', options : {stream : logAccessWriteStream}}
if (env === 'dev') {
  morganSettings.format = ':date :method :url :status :response-time ms - :res[content-length] :post'
  //morganSettings.format = ':date :method :url :status :response-time ms - :res[content-length]'
  morganSettings.options.skip =  function (req) {
    var excluded = ['css', 'js', 'ico', 'png', 'jpeg']
    var i = req.url.lastIndexOf('.')
    var suffix = (i > 0) ? req.url.substr(i+1) : null // au moins un char avant le point
    return (suffix && excluded.indexOf(suffix) > -1)
  }
}
lassi.require('morgan').token('post', function (req, res) {
  return (_.isEmpty(req.body)) ? '': JSON.stringify(req.body)
})

/** La config exportée */
module.exports = {
  application : {
    name : "bibliotheque",
    mail : "tech@sesamath.net",
    staging: lassi.Staging.development
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
    cookie: {key: 'asqlSTsrl78lAsg'},
    session: {
      secret: 'asqlSTsrl78lAsg',
      saveUninitialized: true,
      resave: true
    },
    authentication: {}
  },
  // Configuration des plugins
  plugins : {
    session: false
  },
  root : root,
  logs : {
    access    : root + '/logs/' + env + '.access.log',
    error     : root + '/logs/' + env + '.error.log',
    errorData : root + '/logs/' + env + '.errorData.log',
    dev       : root + '/logs/dev.log',
    // mettre à true pour ajouter dans dev.log toutes les entrées / sorties du cache
    cacheEntries : false
  }
}
