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


module.exports = function($flashMessage) {
  var _ = require('lodash')

  /**
   * Le listener sur afterRailUse est dans construct/index.js (il ajoute la gestion de CORS)
   */

  /**
   * Le listener de l'event beforeTransport, pour gérer les pages d'erreur et ajouter les msg flash
   */
  lassi.on('beforeTransport', function(context, data) {
    var reqHttp = context.request.method +' ' +context.request.originalUrl
    log.debug(
        'listener on beforeTransport sur '  +reqHttp +' (' +context.contentType +' status ' +context.status +') avec les data ',
        data,
        'beforeTransport',
        {noTrim:true}
    )
    console.log('listener on beforeTransport sur '  +reqHttp +' (' +context.contentType +' status ' +context.status +')')

    // l'api gère ses erreurs toute seule sur ses urls
    if (context.contentType !== 'application/json') {
      // mais si c'est une url qu'elle ne gère pas on le fait pour elle
      if (context.request.originalUrl.substr(0, 5) === '/api/') {
        log.error(new Error("requete " +reqHttp +" et contentType non json " +context.contentType), data)
        context.status = 404
        context.contentType = 'application/json'
        if (!data.error) data.error = 'not found'

      } else if (context.request.originalUrl.substr(0, 7) !== '/debug/') {
        // debug peut renvoyer ce qu'il veut on y touche pas, sinon
        // ça devrait être du html, on fixe 404 si pas de contenu
        if (!data.contentBloc && !context.status) {
          log.error('pas de status ni content => 404')
          context.status = 404
        }

        // et on ne gère que les erreurs
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
          log.debug(reqHttp +" en erreur " +context.status +", les data après modif", data)
          //log.debug("et le contexte", context)
        }

        // on ajoute d'éventuels messages flash si on est en html
        if (context.contentType === 'text/html') {
          var flashData = $flashMessage.getAndPurge(context)
          if (flashData) _.merge(data, flashData)
        }

      }
    }

    // et la mesure de perf dans le log
    if (context.perf && context.perf.msg) log.perf.out(context)
  })

  /**
   * Listener context pour mesure de perf (si on a précisé un log de perf dans la conf)
   */
  lassi.on('context', function(context) {
    if (log.perf.out) {
      context.perf = {
        msg  : '', // message envoyé à log.debug() dans le listener beforeTransport
        start: log.getElapsed(0)
      }
    }   
  })
}