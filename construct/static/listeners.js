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
  var tools = require('../tools')

  //var config = require('../ressource/config')

  /********************************************************************************************************
   * Le listener sur afterRailUse est dans construct/index.js car il ajoute des trucs au rail (CORS & logs)
   */

  /**
   * Gére les pages d'erreur et ajoute les msg flash
   * @param context
   * @param data
   */
  function beforeTransportListener(context, data) {
    /**
     * Ajoute à data nos params par défaut s'il n'existent pas et met le contentType html
     * @param title Le titre à mettre s'il n'y en avait pas
     * @param errorMsg Le message d'erreur s'il n'y en avait pas
     */
    function prepareErrorHtmlData(title, errorMsg) {
      var defaultData = {
        $metas     : {
          title: title
        },
        $views     : __dirname + '/views',
        errors: [errorMsg]
      }
      tools.complete(data, defaultData)
      context.contentType = 'text/html'
      log.debug('on a généré des data pour une erreur ' +context.status, data, 'beforeTransport', {max:2000})
    } // prepareErrorHtmlData

    var reqHttp = context.request.method +' ' +context.request.parsedUrl.pathname +(context.request.parsedUrl.search||'')
    var isApi = (context.request.originalUrl.substr(0, 5) === '/api/')
    var isHtml = !!context.layout
    // on fixe déjà ça
    if (isHtml) {
      if (context.contentType !== 'text/html') context.contentType = 'text/html'
      data.$layout = __dirname +'/views/layout-' +context.layout
    }

    /* on envoie toutes les réponses dans le log de debug */
    if (!isProd) log.debug(
        'listener on beforeTransport sur '  +reqHttp +' (' +context.contentType +' status ' +context.status +') avec les data ',
        data,
        'beforeTransport',
        {max:2000}
    ) /* */

    /**
     * Gestion des erreurs (lassi ne l'a pas encore fait)
     */
    // erreurs 500
    if (context.error) {
      // un truc a planté et c'est lassi qui l'a récupéré mais pas notre code
      // (il doit manipuler les data mais pas affecter context.error)
      log.error('erreur 500 sur ' +reqHttp, context.error)
      context.status = 500
      // on façonne notre erreur 500
      if (isApi) {
        context.contentType = 'application/json'
        if (!data.error) data.error = context.error.toString()
      } else {
        prepareErrorHtmlData('Erreur interne', 'Erreur interne :\n' +context.error.toString().replace('Error: ', ''))
      }
      delete context.error //pour que lassi ne génère pas son erreur 500 en text/plain

    } else {
      // erreur 404 ?
      if (!context.status && ( (isHtml && _.isEmpty(data.contentBloc)) || (isApi && _.isEmpty(data)) ) ) {
        context.status = 404
        log.debug(reqHttp + ' : pas de status ni content => 404')
      }
      // et on gère ici les erreurs à rendre en html ou en json
      if (context.status && context.status > 400 && (isApi || isHtml)) {
        log.debug('erreur ' +context.status +(isApi ? ' api' : ' html'), data)
        var title, msg
        switch (context.status) {
          case 404:
            msg = data.content || "Cette page n'existe pas"
            break
          case 401:
          case 403:
            if (data.content) msg = data.content
            else if (context.session && context.session.user && context.session.user.oid) msg = 'Droits insuffisants'
            else msg = "Authentification requise"
            break
          default:
            title = 'erreur ' +context.status
            msg = data.content || "Ooops, une erreur " +context.status +' est survenue'
        }
        if (!title) title = msg
        // si lassi a mis ça on le vire (on vient de gérer msg)
        if (data.content) delete data.content
        if (isApi) {
          context.contentType = 'application/json'
          if (!data.error) data.error = msg
        } else {
          prepareErrorHtmlData(title, msg)
        }
      }
    }
    // fin du traitement des erreurs

    if (isHtml) {
      // on ajoute d'éventuels messages flash si on est en html (erreur ou pas)
      var flashData = $flashMessage.getAndPurge(context)
      if (flashData) _.merge(data, flashData)
      // et vérifie que errors et warnings on une vue en absolu
      if (data.errors) data.errors.$view = __dirname +'/views/errors'
      if (data.warnings) data.warnings.$view = __dirname +'/views/warnings'
    }

    log('fin de beforeTransport avec les data', data, {trim:5000})
    //log('fin de beforeTransport avec le layout' + data.$layout)
    //log('fin de beforeTransport avec la session', context.session, {trim:5000})
  }

  lassi.on('beforeTransport', beforeTransportListener)
}