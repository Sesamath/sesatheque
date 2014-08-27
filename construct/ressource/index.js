'use strict';
/**
 * Component de gestion des types de contenu "Ressource".
 * @extends {lassi.Component}
 */
var ressourceComponent = lassi.Component();

ressourceComponent.initialize = function(next) {
  // on ajoute à la conf de l'appli la conf ressource qui est dans notre dossier
  this.application.settings.ressource = require('./config.js');
  next();
}

// et on l'exporte
module.exports = ressourceComponent;
