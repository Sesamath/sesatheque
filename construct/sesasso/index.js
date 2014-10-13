/**
 * Un component qui déclare un décorateur (pour choper ?connexion et ?deconexion
 * et un controleur qui sera appelé en ajax par le sso
 */
'use strict';

var sesaSsoComponent = lassi.Component()

sesaSsoComponent.initialize = function(next) {
  // On ajoute le lien de connexion que l'on gère, pour les accessDenied
  if (this.application.settings.components && this.application.settings.components.personne)
    this.application.settings.components.personne.connectLink = '<br /><a href="/?connexion">Me connecter</a>'
  next()
}

module.exports = sesaSsoComponent
