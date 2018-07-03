const config = require('./app/server/config')
const version = require('./package').version
/**
 * ici on n'exporte que des variables non-sensibles et qui peuvent être
 * exposées dans le browser
 */
const safeConfig = {
  application: {
    staging: config.application.staging
  },
  baseId: config.application.baseId,
  bugsnag: config.bugsnag,
  sesatheques: config.sesatheques.map(({baseId, baseUrl}) => ({baseId, baseUrl})),
  version
}

// Exports un "loader" webpack
module.exports = function () {
  // Un peu étrange, ici on doit renvoyer le texte du code JS à injecter
  // dans le build webpack
  return `module.exports = ${JSON.stringify(safeConfig)}`
}
