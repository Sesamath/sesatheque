/**
 * Ce décorateur récupère les flashMessages en session s'il y en a et les envoie à son bloc
 * Attention, si une autre action qui passe après nous (un autre décorateur) lance une redirection ils seront perdus
 */
'use strict'

module.exports = lassi.Decorator('flash')
    .renderTo('flashBloc')
    .do(function(ctx, next) {
      if (ctx.session.flash) {
        var data = ctx.session.flash
        // on effacera ces données juste avant le rendu
        // (comme ça s'il n'y a pas de rendu à cause d'une redirection ça ne sera pas perdu)
        ctx.application.transports.html.on('layout', function() {
          delete ctx.session.flash
        })
        next(data)
      } else next()
    });
