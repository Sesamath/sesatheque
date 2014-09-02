'use strict';
/**
 * Component de gestion des types de contenu "Ressource".
 * @extends {lassi.Component}
 */
var ressourceComponent = lassi.Component();

/** durée de cache par défaut (écrasé par la conf) */
ressourceComponent.cacheTTL = 3600

ressourceComponent.initialize = function(next) {
  // on ajoute à la conf de l'appli la conf ressource qui est dans notre dossier
  var config = require('./config.js')
  this.application.settings.ressource = config
  if (config.cacheTTL) ressourceComponent.cacheTTL = lassi.main.encadre(config.cacheTTL, 60, 12*3600,
      'ttl de cache par défaut pour les entities ressource')
  log('ttl du cache ressource fixé à ' +ressourceComponent.cacheTTL)
  next();
}

// et on l'exporte
module.exports = ressourceComponent;
