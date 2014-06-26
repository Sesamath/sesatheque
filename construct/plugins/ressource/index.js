'use strict';

/**
 * Plugin de gestion des types de contenu "Ressource".
 * @extends {lassi.Plugin}
 * @constructor
 */
var ressourcePlugin = lassi.Plugin()
    .initialize(function() {
      this.application.config.ressource = require('./config.js');
    });

module.exports = ressourcePlugin;
