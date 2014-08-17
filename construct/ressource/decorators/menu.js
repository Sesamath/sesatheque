/**
 * Ajoute les liens de modif / visualisation suivant le contexte
 */
'use strict';

module.exports = lassi.Decorator('menu')
    .renderTo('menu')
    .do(function(ctx, next) {
      var links = []
      // raccourci
      function hasPerm(permission) {
        return lassi.personne.hasPermission(permission, ctx)
      }

      // ajout
      if (hasPerm('add')) {
        links.push(ctx.link(lassi.action.ressource.add, 'Ajouter une ressource'))
      }
      // si on est sur une description, on a les liens contextuels
      if (ctx.action === lassi.action.ressource.describe || ctx.action === lassi.action.ressource.describeByOrigin) {
        if (hasPerm('write'))
          links.push(ctx.link(lassi.action.ressource.edit, 'Modifier cette ressource', ctx.arguments))
        if (hasPerm('del'))
          links.push(ctx.link(lassi.action.ressource.del, 'Supprimer cette ressource', ctx.arguments))
        if (hasPerm('read')) {
          links.push(ctx.link(lassi.action.ressource.preview, 'Voir la ressource', ctx.arguments))
          links.push(ctx.link(lassi.action.ressource.display, 'Voir la ressource (pleine page)', ctx.arguments))
        }
      }

      // voir
      if (ctx.action === lassi.action.ressource.describe || ctx.action === lassi.action.ressource.describeByOrigin) {
      }

      next(null, {links:links})
    })

