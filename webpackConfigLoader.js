const config = require('./app/server/config')
const version = require('./package').version
/**
 * ici on n'exporte que des variables non-sensibles et qui peuvent être
 * exposées dans le browser
 */
const safeConfig = {
  bugsnag: config.bugsnag,
  application: {
    staging: config.application.staging
  },
  version
}

// Exports un "loader" webpack
module.exports = function () {
  // Un peu étrange, ici on doit renvoyer le texte du code JS à injecter
  // dans le build webpack
  return `module.exports = ${JSON.stringify(safeConfig)}`
}
