/**
 * controller file is part of Sesatheque.
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

'use strict'

/**
 * Un service de gestion des menus, pour que chaque composant puisse ajouter des entrées à un menu
 * et calculer le tout au beforeTransport
 * L'ajout doit être fait dans chaque composant car les entrées dépendent souvent de service du composant
 * (donc on ne peut pas avoir un controleur dans main pour gérer les menus car les services sont pas encore dispo).
 */
module.exports = function ($accessControl, $routes) {
  return {
    beforeTransport : function (context, data) {
      // on ne s'occupe que des pages html avec layout pour ajouter nos menus
      if (context.layout === 'page') {
        // menu navigation, sur toutes les pages
        var links = []
        // lien ajout
        if ($accessControl.hasPermission('create', context)) {
          links.push({href:$routes.getAbs('add'), value :'Ajouter une ressource', icon : "note_add"})
        }
        // un lien vers la recherche
        links.push({href: $routes.getAbs('search', null, context), value: 'Recherche', icon : 'search'})
        data.navigation = {
          // chemin absolu car on sait pas quel est le dossier $views courant
          $view : __dirname +'/views/navigation',
          links : links
        }

        // les liens contextuels à une ressource
        if (context.ressource && context.ressource.oid) {
          links = []
          var ressource = context.ressource
          var oid       = context.ressource.oid
          if ($accessControl.hasPermission('read', context, oid)) {
            links.push({href:$routes.getAbs('describe', ressource), value :'Description', icon:'description', selected:(context.tab === 'describe')})
            links.push({href:$routes.getAbs('preview', ressource), value :'Aperçu', icon:'pageview', selected:(context.tab === 'preview')})
            links.push({href:$routes.getAbs('display', ressource), value :'Voir', icon:'open_in_new', attrs:'target="_blank"'})
          }
          if ($accessControl.hasPermission('update', context, oid))
            links.push({href:$routes.getAbs('edit', oid), value :'Modifier', icon:"mode_edit", selected:(context.tab === 'edit')})
          if (oid && $accessControl.hasPermission('read', context, oid) && $accessControl.hasPermission('create', context))
            links.push({
              href:$routes.getAbs('add') +'?clone=' +oid,
              value :'Dupliquer', icon:'call_split',
              selected:(context.tab === 'add' && context.request.originalUrl.indexOf('clone=') > -1)
            })
          if ($accessControl.hasPermission('delete', context))
            links.push({href:$routes.getAbs('delete', oid), value :'Supprimer', icon:'delete', selected:(context.tab === 'delete')})

          data.actions = {
            $view : __dirname +'/views/actions',
            links : links
          }
        } // liens contextuels

      } // context.layout
    }
  }
}
