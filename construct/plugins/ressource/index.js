'use strict';

/**
 * Plugin de gestion des types de contenu "Ressource".
 * @extends {Lassi.Plugin}
 * @constructor
 */
var plugin = lassi.Plugin()
  .initialize(function() {
    console.log('constructeur du module ressource');
    var ressource = lassi.entity.Ressource.create({
      titre: 'Un machin...'
    }).store();
  });

module.exports = plugin;
