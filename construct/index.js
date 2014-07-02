/**
 * Définition de l'application
 */
'use strict';

// pour les logs
var log = require('./log.js'); // jshint ignore:line

// Récupération du module lassi
require('lassi');
// après ce 1er appel lassi est une var globale

// underscore que l'on va mettre en global aussi parce que l'on est fainéant
var underscore_ = require('underscore')._;
if (GLOBAL._ && GLOBAL._ !== underscore_) {
  console.error("_ existe en GLOBAL mais ce n'est pas underscore._");
}
GLOBAL._ = underscore_;

// et nos loggers
GLOBAL.log = log;

// Construction de l'application
lassi.Application().boot();

/* On laisse ça ici même si le boot a à peine démarré, en attendant de savoir écouter onBoot */
console.log("Boot de l'application Bibliothèque");
log.dev('BOOT');
