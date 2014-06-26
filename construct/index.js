/**
 * Définition de l'application
 */
'use strict';

// Récupération du module lassi (pas encore en var globale car c'est son 1er appel)
var lassi = require('lassi'); // jshint ignore:line

// Récupération de la configuration du projet
var config = require('./config');

// Construction de l'application
lassi.Application(config)
  .configure(config)
  .boot(function() {
    console.log("Boot de l'application Bibliothèque");
  });
