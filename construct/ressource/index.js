'use strict';

/**
 * Component de gestion des types de contenu "Ressource".
 * @extends {lassi.Component}
 * @constructor
 */
var component = lassi.Component()
    .initialize(function() {
      this.application.settings.ressource = require('./config.js');
    });

module.exports = component;
