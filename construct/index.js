/**
 * Définition de l'application
 */
'use strict';

console.log("Démarrage de la bibliothèque : appel de " +__filename +" avec les arguments ")
console.log(process.argv)
console.log("et l'environnement")
console.log(process.env)

var _ = require('underscore')._

// Récupération du module lassi que l'on met en global
// (il le fait déjà mais le déclarer ici fait plaisir à mon IDE)
GLOBAL.lassi = require('lassi')

// nos loggers
GLOBAL.log = require('./log.js') // jshint ignore:line

// nos vérificateurs d'assertions
GLOBAL.assert = require('./assert.js')

// Construction de l'application
var application = lassi.Application()

// on ajoute memcache
log('Memcache sur ' +application.settings.memcache)
lassi.tools.cache.addEngine(new lassi.cache.MemcacheEngine(application.settings.memcache))

// on déclenchera ça quand le boot sera fini
application.on('boot', function () {
  console.log("Boot de l'application " + application.name)
  log.dev('BOOT')
  /* on a une tache gulp reset pour ça, on ne vide plus systématiquement les sessions au démarrage
  if (lassi.sessions && application.settings.staging !== lassi.Staging.production) {
    log.dev('Purge des sessions récupérées')
    lassi.sessions = {}
  } */
});

// pour les logs morgan, on ajoute nos tokens et le WriteStream ici
/* */
application.on('beforeRailUse', function(name, settings) {
  if (name=='logger') {
    console.log('beforeRailUse logger')
    // sert à rien de modifier settings, pas pris en compte car asynchrone
    // on laisse tout ça là quand même pour le passer éventuellement dans une fct + tard
    // sinon faudrait utiliser seq pour ne pas sortir de la fct tant qu'on a pas notre stream
    return

    log.dev('settings morgan dans beforeRailUse', settings)
    // les settings pour morgan
    var fs = require('fs')
    var logAccess = application.settings.logs.access
    var logAccessWriteStream = fs.createWriteStream(logAccess, {'flags': 'a'})
    // les tokens
    var moment = require('moment')
    var morgan = lassi.require('morgan')
    morgan.token('post', function (req) {
      return (_.isEmpty(req.body)) ? '': JSON.stringify(req.body)
    })
    morgan.token('moment', function () {
      return moment().format('YYYY-MM-DD HH:mm:ss.SSS')
    })
    settings = {
      format: ':moment :method :url :status :response-time ms - :res[content-length] :post',
      options : {
        skip  : function (req) {
          var excluded = ['css', 'js', 'ico', 'png', 'jpeg']
          var i = req.url.lastIndexOf('.')
          var suffix = (i > 0) ? req.url.substr(i + 1) : null // au moins un char avant le point
          return (suffix && excluded.indexOf(suffix) > -1)
        },
        stream: logAccessWriteStream
      }
    }
    log.dev('settings modifiés', settings)
  } // on pourrait préciser la limite d'upload ici (name === 'body-parser') mais elle est dans la conf
})

/* application.on('loaded', function (type, name, instance) {
  if (type === 'middleware' && name === 'logger') {
    console.log(instance.toString())
  }
}) */

// et on lance le boot
application.boot()
