const config = require('./app/server/config')
/**
 * ici on n'exporte que des variables non-sensibles et qui peuvent être
 * exposées dans le browser
 */
const safeConfig = {
  version: config.version,
  application: {
    staging: config.application.staging,
    baseId: config.application.baseId,
    baseUrl: config.application.baseUrl
  },
  baseId: config.application.baseId,
  baseUrl: config.application.baseUrl,
  bugsnag: config.bugsnag,
  sesatheques: config.sesatheques.map(({baseId, baseUrl}) => ({baseId, baseUrl}))
}

// Exports un "loader" webpack
module.exports = function () {
  // Un peu étrange, ici on doit renvoyer le texte du code JS à injecter
  // dans le build webpack
  return `module.exports = ${JSON.stringify(safeConfig)}`
}
