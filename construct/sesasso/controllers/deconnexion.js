'use strict'

/**
 * Pour la page de déconnexion locale appelée en ajax par le serveur sso
 */

var controller = lassi.Controller('sesasso');

controller.respond('html');

controller
    .Action('deconnexion')
    .renderWith('deconnexion')
    .do(function (ctx, next) {
      var msg 
      if (lassi.session.user) {
        lassi.session.user = {}
        msg = 'déconnexion effectuée'
      } else msg = "Cet utilisateur n'était pas connecté"
      next(null, {msg:msg})
    })

module.exports = controller;