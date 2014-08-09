'use strict'

/**
 * Pour la déconnexion locale, appelée en jsonp par le serveur sso
 */

var controller = lassi.Controller('sesasso');

controller.respond('json') // en fait du jsonp

controller
    .Action('deconnexion')
    .renderWith('deconnexion')
    .do(function (ctx, next) {
      var id = 'id_inconnu'
      log.dev("ds act deco")
      if (ctx.session.user && ctx.session.user.id) {
        // le sso s'attend à récupérer l'id (Cf ssl:/sesamath/pages/identification_deconnexion.js)
        id = ctx.session.user.id
        // on efface en session
        ctx.session.user = {}
        // et on envoie
        log.dev("on a id " +id)
      }
      next(null, {id:id})
    })

module.exports = controller;