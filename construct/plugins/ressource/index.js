'use strict';

/**
 * Plugin de gestion des types de contenu "Ressource".
 * @extends {Lassi.Plugin}
 * @constructor
 */
var Ressource = lassi.Plugin()
  .initialize(function() {
    console.log('constructeur du module ressource');
  });

module.exports = Ressource;
