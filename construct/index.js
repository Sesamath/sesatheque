/**
 * Définition de l'application
 */
'use strict';

// Récupération du module lassi
var lassi = require('lassi');

// Récupération de la configuration du projet
var config = require('./config');

// Construction de l'application
var application = lassi.Application(config);

// Démarrage de l'application
application.boot(function() {
  console.log("Boot de l'application Bibliothèque");
});
