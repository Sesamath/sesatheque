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

'use strict'
/*global lassi*/

/**
 * Notre component principal, défini
 * - le layout et les vues
 * - les controleurs des pages statiques
 * @constructor
 */
var staticComponent = lassi.component('static')

// On configure le layout des erreurs lors de l'init du composant
staticComponent.config(function() {
  // la définition du layout à utiliser si c'est une erreur ou si c'est forcé (sinon, c'est au contrôleur de le faire)
  lassi.on('beforeTransport', function(context, data) {
    log('on beforeTransport (dans static), sur ' +context.request.method +' ' +context.request.originalUrl +
        ' avec les data (' +context.contentType +' ' +context.status +')', data)
    if (/\.css$/.exec(context.request.originalUrl)) {
      log(new Error("on passe dans beforeTransport sur du css"))
      log('beforeTransport le context ', context)
      log('beforeTransport la requête ', context.request)
      log('beforeTransport la réponse ', context.response)
    }

    // l'api gère ses erreurs toute seule sur ses urls
    if (context.contentType !== 'application/json') {
      // mais si c'est une url qu'elle ne gère pas on le fait pour elle
      if (context.request.originalUrl.substr(0, 5) === '/api/') {
        log.error("requete sur " +context.request.originalUrl +" et réponse non json " +context.contentType, data)
        context.status = 404
        context.contentType = 'application/json'
        if (!data.error) data.error = 'not found'
      } else {
        // ça doit être du html, 404 si pas de contenu
        if (!data.contentBloc && !context.status) {
          log.error('pas de status ni content => 404')
          context.status = 404
        }
        // et on n'affecte que les erreurs
        if (context.status && context.status > 400) {
          // lassi a mis du plain sur les erreurs
          context.contentType = 'text/html'
          // et une string dans data
          if (typeof data !== 'object') data = {}
          // ou data.content
          if (data.content) delete data.content
          // on ajoute layout et vue pour cette erreur
          if (!data.$metas) data.$metas = {}
          data.$views = __dirname +'/views'
          if (!data.$layout) data.$layout = 'layout-page'
          if (!data.contentBloc) data.contentBloc = {}
          data.contentBloc.$view = 'error'

          // reste à choisir le texte d'erreur à afficher
          var msg
          switch (context.status) {
            case 404: msg = "Cette page n'existe pas"; break
            case 403: msg = "Authentification requise"; break
            default: msg = "Ooops, une erreur est survenue (" +context.status +')'
          }
          data.contentBloc.error = msg
          data.$metas.title = msg
          log("c'est une erreur, les data après modif", data)
          //log("et le contexte", context)
        }
      }
    }
  })
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


staticComponent.controller(function ($flashMessages, $settings) {
  var baseData = {
    $metas : {},
    $views : __dirname +'/views',
    $layout : 'layout-page'
  }
  var isProd = $settings.get('application.staging', 'dev') === 'production';

  // nos ressources statiques génériques
  this.serve(__dirname +'/public')
isProd = true
  // pour nos tests qx
  if (isProd) {
    //this.serve('qx/script',   __dirname +'/../qxApps/tree/build/script');
    //this.serve('qx/resource', __dirname +'/../qxApps/tree/build/resource');
    this.serve('qx', __dirname +'/../qxApps/tree/build');
  } else {
    this.serve('qooxdoo',            __dirname +'/../qxApps/qooxdoo');
    this.serve('qx/script', __dirname +'/../qxApps/tree/source/script');
    this.serve('qx/resource',        __dirname +'/../qxApps/tree/source/resource');
    this.serve('qx/source/class',    __dirname +'/../qxApps/tree/source/class');
  }

  // home
  this.get('/', function (context) {
    var data = baseData
    // log('le contexte dans le controleur de static, action /',context)
    data.$metas.title  = "Bienvenue dans la bibliothèque Sésamath"
    // ce contentBloc est le nom du bloc du layout qui récupèrera le rendu de la vue
    data.contentBloc = {
      $view : 'home',
      // ce content est la variable passée au template dust
      content : "Ce site est encore un prototype expérimental."
    }
    context.html(data)
  })

  // gestion des messages flash
  this.get('*', function (context) {
    if (context.request.url.indexOf('/api/') === 0) return context.next()
    var data = $flashMessages.getData(context)
    context.next(null, data)
  })
})

staticComponent.service('$flashMessages', function() {
  return {
    add : function (context, message, level) {
      var cssClass = 'flash'
      if (level) cssClass += '-' +level
      if (!context.session.flashMessages) context.session.flashMessages = []
      context.session.flashMessages.push({
        cssClass : cssClass,
        value : message
      })
    },
    getData : function (context) {
      var data
      if (context.session.flashMessages) {
        data = {
          flashBloc : {
            $view : 'flash',
            messages : context.session.flashMessages
          }
        }
        delete context.session.flashMessages
      }

      return data
    }
  }
})

/**
 * En dev on ajoute des routes de debug
 */
if (lassi.settings.application.staging !== 'production') {
  staticComponent.controller(function () {
    require('./controllerDebug')(this)
  })
}
