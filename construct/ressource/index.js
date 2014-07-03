'use strict';

/**
 * Component de gestion des types de contenu "Ressource".
 * @extends {lassi.Component}
 * @constructor
 */
var ressourceComponent = lassi.Component();
ressourceComponent.initialize = function() {
  this.application.settings.ressource = require('./config.js');
}

// On ajoute toutes les methodes du repository à notre component
var ressourceRepository = require('./repository');
_.each(ressourceRepository, function(name, method) {
  ressourceComponent[name] = method;
});

// et on l'exporte
module.exports = ressourceComponent;
