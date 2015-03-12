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

'use strict';

/**
 * Notre component principal, défini le layout et le rendu,
 * et ajoute des méthodes génériques à utiliser dans d'autres components
 * @constructor
 */
var mainComponent = lassi.component('main')

// On configure metas html et layout des erreurs lors de l'init du composant
mainComponent.config(function() {

  // les metas génériques du html
  lassi.transports.html.on('metas', function(metas) {
    metas.addCss('styles/main.css')
    //metas.addJs('vendors/jquery.min.js')
  })

  // la définition du layout à utiliser si c'est une erreur ou si c'est forcé (sinon, c'est au contrôleur de le faire)
  lassi.controllers.on('beforeTransport', function(data) {
    log('on beforeTransport on a les data', data)
    /* console.log('on beforeTransport on a les data')
    console.log(data) */

    if (data.$status && data.$status > 400) {
      data.$contentType = 'text/html'
      // erreur, 403 et 404 on leur layout, et on en a un autre pour les autres erreurs
      switch (data.$status) {
        case 404:
          data.$layout = 'layout-page404'
          break
        case 403:
          data.$layout = 'layout-page403'
          break
        default:
          data.$layout = 'layout-page-error'
      }
    } else if (data.forceLayout) {
      data.$contentType = 'text/html'
      data.$layout = data.forceLayout
    }
  });
})

  /**
   * On ajoute un dust.helper à l'initialisation du framework
   * Cf https://github.com/linkedin/dustjs/wiki/Dust-Tutorial#Writing_a_dust_helper
   *
   * context contient les propriétés stack,global,blocks,templateName,
   *     on peut récupérer les paramètres passés à la vue avec context.get('param')
   * bodies contient block
   * params liste les attributs passé au helper avec {@helper attrName1=...}
   * @see https://github.com/linkedin/dustjs/wiki/Dust-Tutorial#Writing_a_dust_helper
   * this.application.templateEngines.dust existe plus /
  this.application.templateEngines.dust.helper('dump', function (chunk, context, bodies, params) {
    return chunk.write('<pre class="debug">' + JSON.stringify(params, null, 2) + '</pre>');
  }); /**/


mainComponent.controller(function () {
  // tous nos controlleurs sont en html avec le même layout
  this.renderAs({
    $contentType: 'text/html',
    $layout: 'layout-page',
    $views: __dirname +'/views'
  })

  this.serve(__dirname +'/public')

  this.get('/', function (ctx) {
    log('le contexte dans le controleur /',ctx)
    ctx.next({
      $metas : {
        title  : "Bienvenue dans la bibliothèque Sésamath"
      },
      content : {
        $view : 'home',
        content: "Ce site est encore un prototype expérimental."
      }
    });
  })
})
