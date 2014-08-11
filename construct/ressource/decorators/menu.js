/**
 * Ajoute les liens de modif / visualisation suivant le contexte
 */
'use strict'

module.exports = lassi.Decorator('menu')
    .renderTo('menu')
    .do(function(ctx, next) {
      var links = []

      // édition
      if (ctx.session.user && ctx.session.user.roles && ctx.session.user.roles.indexOf('editor')) {
        // on est authentifié avec les droits d'edition
        links.push(ctx.link(lassi.action.ressource.add, 'Ajouter une ressource'))
        // on est sur une description
        if (ctx.action === lassi.action.ressource.describe || ctx.action === lassi.action.ressource.describeByOrigin) {
          links.push(ctx.link(lassi.action.ressource.edit, 'Modifier cette ressource'))
          links.push(ctx.link(lassi.action.ressource.del, 'Supprimer cette ressource'))
        }
      }

      // voir
      if (ctx.action === lassi.action.ressource.describe || ctx.action === lassi.action.ressource.describeByOrigin) {
        links.push(ctx.link(lassi.action.ressource.preview, 'Voir la ressource', ctx.arguments))
        links.push(ctx.link(lassi.action.ressource.display, 'Voir la ressource (pleine page)', ctx.arguments))
      }

      next(null, {links:links})
    })

