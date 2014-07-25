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
  // Notre gestion du cache
  lassi.register('cache', require('./cache.js'))
});

// et on lance le boot
application.boot();
