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

/**
 * Ce serait mieux de mettre ça ailleurs pour ne garder que du déclaratif ici,
 * mais une fois le logger renvoyé (par son constructeur appelé par lassi)
 * on peut plus lui changer ses params, faut donc créer ce writeStream avant d'appeler lassi
 */
var fs = require('fs');
var env = process.env.NODE_ENV || 'dev';

var logAccess = root + '/logs/' + env + '.access.log';
var logAccessWriteStream = fs.createWriteStream(logAccess, {'flags': 'a'});
var morganOptions = {format:'default', stream : logAccessWriteStream}
if (env === 'dev') {
  morganOptions.format = ':date :method :url :status :response-time ms - :res[content-length] :post'
  morganOptions.skip =  function (req) {
    var excluded = ['css', 'js', 'ico', 'png', 'jpeg']
    var i = req.url.lastIndexOf('.')
    var suffix = (i > 0) ? req.url.substr(i+1) : null // au moins un char avant le point
    return (suffix && excluded.indexOf(suffix) > -1)
  }
}

/** La config exportée */
module.exports = {
  application : {
    name : "bibliotheque",
    mail : "tech@sesamath.net",
    staging : "development"
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
    favicon       : '/assets/images/favicon.ico',
    logger        : morganOptions, // passé tel quel à morgan()
    public        : true,
    authentication: true
  },
  // Configuration des plugins
  plugins : {
    session: false
  },
  root : root,
  logs : {
    access : logAccess,
    error : root + '/logs/' + env + '.error.log',
    errorData : root + '/logs/' + env + '.errorData.log',
    dev : root + '/logs/dev.log',
    cacheEntries : false
  }
}
