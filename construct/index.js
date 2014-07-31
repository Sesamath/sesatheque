/**
 * Définition de l'application
 */
'use strict';

// Récupération du module lassi que l'on met en global
// (il le fait déjà mais le déclarer ici fait plaisir à mon IDE)
GLOBAL.lassi = require('lassi');

// nos loggers
GLOBAL.log = require('./log.js'); // jshint ignore:line

// nos vérificateurs d'assertions
GLOBAL.assert = require('./assert.js');

// Construction de l'application
var application = lassi.Application();

// on déclenchera ça quand le boot sera fini
application.on('boot', function(){
  console.log("Boot de l'application " + application.name);
  log.dev('BOOT');
});

/*/ pour créer un token morgan
application.on('beforeRailUse', function(name, settings) {
  if (name=='logger') {
    log.dev('settings morgan dans beforeRailUse', settings)
    lassi.require('morgan').token('post', function (req, res) {
      return (_.isEmpty(req.body)) ? '': JSON.stringify(req.body)
    });
  }
})

/* application.on('loaded', function (type, name, instance) {
  if (type === 'middleware' && name === 'logger') {
    console.log(instance.toString())
  }
}) */

// et on lance le boot
application.boot();
