'use strict';
/**
 * Component ressource
 */

/**
 * Component de gestion des types de contenu "Ressource".
 * @extends {lassi.Component}
 * @constructor
 */
var ressourceComponent = lassi.Component();

ressourceComponent.initialize = function(next) {
  this.application.settings.ressource = require('./config.js');
  next();
}

// et on l'exporte
module.exports = ressourceComponent;
