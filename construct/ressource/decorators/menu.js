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
        // ctx.data ne contient plus le résultat de l'action mais le rendu qui va être envoyé au template
        var id = ctx.arguments.id || ctx.ressourceId
        if (id) {
          var arg = {id:id}
          if (hasPerm('write'))
            links.push(ctx.link(lassi.action.ressource.edit, 'Modifier cette ressource', arg))
          if (hasPerm('del'))
            links.push(ctx.link(lassi.action.ressource.del, 'Supprimer cette ressource', arg))
          if (hasPerm('read')) {
            links.push(ctx.link(lassi.action.ressource.preview, 'Voir la ressource', arg))
            links.push(ctx.link(lassi.action.ressource.display, 'Voir la ressource (pleine page)', arg))
          }
        }
      }

      // voir
      if (ctx.action === lassi.action.ressource.describe || ctx.action === lassi.action.ressource.describeByOrigin) {
      }

      next(null, {links:links})
    })

