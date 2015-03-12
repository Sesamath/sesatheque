/**
 * This file is part of Sesatheque.
 *   Copyright 2014-2015, Association Sésamath
 *
 * Sesatheque is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * Sesatheque is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Sesatheque (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de l'application Sésathèque, créée par l'association Sésamath.
 *
 * Sésathèque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

/**
 * Ajoute les liens de modif / visualisation suivant le contexte
 */
'use strict';
/*
module.exports = lassi.Decorator('menu')
    .renderTo('menu')
    .do(function(ctx, next) {
      var links = []
      // raccourci
      function hasPermission(permission) {
        return lassi.personne.hasPermission(permission, ctx)
      }

      // ajout
      if (hasPermission('create')) {
        links.push(ctx.link(lassi.action.ressource.add, 'Ajouter une ressource'))
      }
      // si on est sur une description, on a les liens contextuels
      if (ctx.action === lassi.action.ressource.describe || ctx.action === lassi.action.ressource.describeByOrigin) {
        // ctx.data ne contient plus le résultat de l'action mais le rendu qui va être envoyé au template
        var id = ctx.arguments.id || ctx.ressourceId
        if (id) {
          var arg = {id:id}
          if (hasPermission('update'))
            links.push(ctx.link(lassi.action.ressource.edit, 'Modifier cette ressource', arg))
          if (hasPermission('delete'))
            links.push(ctx.link(lassi.action.ressource.del, 'Supprimer cette ressource', arg))
          if (hasPermission('read')) {
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

*/