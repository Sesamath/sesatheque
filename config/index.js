/**
 * Configuration de l'application
 */

/**
 * On est config/index.js (hors build)
 */

/** Le dossier build/application */
var appdir = __dirname + '/../build/application';
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
var morganFormat = (env === 'dev') ? 'dev' : 'default'

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
    logger        : { format: morganFormat, stream : logAccessWriteStream}, // pour morgan
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
    dev : root + '/logs/dev.log'
  }
}
