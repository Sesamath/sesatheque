'use strict';

/**
 * Pour la déconnexion locale, appelée en jsonp par le serveur sso
 */

var controller = lassi.Controller('sesasso');

controller.respond('json') // en fait du jsonp

controller
    .Action('deconnexion')
    .renderWith('deconnexion')
    .do(function (ctx, next) {
      var id = ctx.get.id || 'id_inconnu'
      log.dev("ds act deco")
      var deconnexion = false
      if (ctx.session.user && ctx.session.user.id) {
        // on efface la session
        ctx.session.user = {}
        deconnexion = true
      }
      next(null, {id:id, deconnexion:deconnexion})
    })

module.exports = controller;