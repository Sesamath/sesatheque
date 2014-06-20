/**
 * Configuration de l'application
 */

/** le dossier build/application */
var appdir = __dirname + '/..';
/** Le dossier build */
var builddir = appdir + '/..';

/** La config exportée */
module.exports = {
  root : appdir,
  entities : {
    // Configuration de la base de données
    database : require(builddir + '/../_private/dbconfig')
  },
  renderer : {
    cache : false
  },
  layout : {
    data: builddir + '/data',
    cache: builddir + '/data/cache'
  }
}
