'use strict';

var _ = require('underscore')._;

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

// On ajoute toutes les methodes du repository à notre component
var ressourceRepository = require('./repository');
_.each(ressourceRepository, function(method, name) {
  // log.dev('ajoute au component ressource la méthode ' + name)
  ressourceComponent[name] = method;
});

// et on l'exporte
module.exports = ressourceComponent;
