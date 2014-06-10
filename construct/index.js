/**
 * Définition de l'application
 */
'use strict';

// Chargement de la configuration
var config = require('./config');

// Création de l'application
var lassi = require('lassi');
var application = lassi(config);

// Démarrage de l'application
application.boot(function() {});
