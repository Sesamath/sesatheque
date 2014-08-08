/**
 * Un component qui déclare un décorateur (pour choper ?connexion et ?deconexion
 * et un controleur qui sera appelé en ajax par le sso
 */
'use strict'

var sslSesaComponent = lassi.Component()

sslSesaComponent.initialize = function(next) {
  next()
}

module.exports = sslSesaComponent
