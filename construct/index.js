/**
 * Définition de l'application
 */
'use strict';

var _ = require('underscore')._

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

// pour les logs morgan, on ajoute nos tokens et le WriteStream ici
/*
application.on('beforeRailUse', function(name, settings) {
  if (name=='logger') {
    // les settings pour morgan
    var fs = require('fs');
    var logAccess = application.settings.logs.access;
    var logAccessWriteStream = fs.createWriteStream(logAccess, {'flags': 'a'});
    settings = { format : ':date :method :url :status :response-time ms - :res[content-length] :post' }
    settings.options = {
      stream : logAccessWriteStream,
      skip :  function (req) {
        var excluded = ['css', 'js', 'ico', 'png', 'jpeg']
        var i = req.url.lastIndexOf('.')
        var suffix = (i > 0) ? req.url.substr(i+1) : null // au moins un char avant le point
        return (suffix && excluded.indexOf(suffix) > -1)
      }
    }
    log.dev('settings morgan dans beforeRailUse', settings)
    // et nos tokens
    lassi.require('morgan').token('post', function (req, res) {
      return (_.isEmpty(req.body)) ? '': JSON.stringify(req.body)
    });
    return settings
  }
})

/* application.on('loaded', function (type, name, instance) {
  if (type === 'middleware' && name === 'logger') {
    console.log(instance.toString())
  }
}) */

// et on lance le boot
application.boot();
