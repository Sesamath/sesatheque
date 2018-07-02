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
 *
 * along with Sesatheque (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de l'application Sésathèque, créée par l'association Sésamath.
 *
 * Sésathèque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'
const sjt = require('sesajstools')
const appConfig = require('../config')
const request = require('request')

/**
 * Controleur /ressource/ pour les utilisateurs authentifiés.
 *
 * Toutes ses routes exposées ici seront traitées par le controleur {@link controllerPublic} si on est pas authentifié (via une redirection interne)
 *
 * @controller controllerRessource
 */
module.exports = function (component) {
  component.controller('ressource', function ($ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $personneControl, $ressourcePage, $routes, $ressourceFetch) {
    /**
     * Affiche une 401 avec Authentification requise en html
     * @private
     * @param {Context} context
     * @param {string} [message='Authentification requise']
     * @returns {boolean} true si authentifié
     */
    function denied (context, message) {
      if (!message) message = 'Authentification requise'
      $ressourcePage.printError(context, message, 401)
    }

    /**
     * Appelle next si on est authentifié ou redirige vers la même url en public
     * @private
     * @param {Context}  context Le contexte
     * @param {function} next    Sera appelée sans arguments si on est authentifié
     */
    function redirectPublicOrContinue (context, next) {
      if ($accessControl.isAuthenticated(context)) next()
      else context.redirect(context.request.originalUrl.replace('ressource/', 'public/'), 302)
    }

    /**
     * Vérifie les droits avant d'appeler $ressourcePage.prepareAndSend
     * @private
     * @param {Context} context
     * @param error
     * @param ressource
     * @param view
     * @param options
     */
    function send (context, error, ressource, view, options) {
      if (ressource && !$accessControl.hasReadPermission(context, ressource)) {
        ressource = null // prepare & send renverra son 404 habituel
      }
      $ressourcePage.prepareAndSend(context, error, ressource, view, options)
    }

    const controller = this

    /**
     * Iframe de connexion pour loguer un user d'un sesalab localement, appelle sendMessage avec {action:'connexion',success:{boolean}[,error:msgErreur]}
     * Dupliqué dans app/connexion, qu'il remplace vu que pas mal de navigateurs déconnent pour affecter le cookie en xhr
     * @todo Remettre son usage en route via sesatheque-client:getPerso, qui pourrait proposer d'ouvrir un nouvel onglet pour reconnecter
     * @Route GET /ressource/connexion
     * @param {string} origine L'url de la racine du sesalab appelant (qui doit être déclaré dans le config de la sésathèque), avec préfixe http ou https
     * @param {string} token   Le token de sesalab qui servira à récupérer le user
     */
    controller.get('connexion', function (context) {
      function end (error) {
        var retour = {
          action: 'connexion',
          success: !error
        }
        if (error) retour.error = error.toString()
        var data = {
          jsBloc: {
            $view: 'js',
            jsCode: 'if (parent.postMessage) parent.postMessage(' + sjt.stringify(retour) + ', "*")'
          }
        }
        context.html(data)
      }

      var token = context.get.token
      var origine = context.get.origine
      var timeout = 5000

      context.layout = 'iframe'
      context.status = 200 // sinon le listener va traduire l'absence de contenu par une 404

      if (token && origine) {
        if (origine.substr(-1) !== '/') origine += '/'
        if (appConfig.sesalabsByOrigin[origine]) {
          var postOptions = {
            url: origine + 'api/utilisateur/check-token',
            json: true,
            content_type: 'charset=UTF-8',
            timeout: timeout,
            form: {
              token: token
            }
          }
          // on ne garde que le nom de domaine en origine
          var domaine = /https?:\/\/([a-z.0-9]+(:[0-9]+)?)/.exec(origine)[1] // si ça plante fallait pas mettre n'importe quoi en config
          request.post(postOptions, function (error, response, body) {
            if (error) {
              end(error)
            } else if (body.error) {
              end(new Error(body.error))
            } else if (body.ok && body.utilisateur) {
              // on peut connecter
              $accessControl.loginFromSesalab(context, body.utilisateur, domaine, function (error) {
                log.debug('dans cb loginFromSesalab on a en session', context.session.user)
                if (error) end(error)
                else end()
              })
            } else {
              var msg = 'réponse du sso sesalab incohérente (ko sans erreur) sur ' + postOptions.url
              error = new Error(msg)
              log.debug(msg, body)
              end(error)
            }
          })
        } else {
          end(new Error('Origine ' + origine + 'non autorisée à se connecter ici'))
        }
      } else {
        end(new Error('token ou origine manquant'))
      }
    })

    /**
     * Page display (voir en pleine page, à priori pour mettre en iframe)
     * @route GET /ressource/voir/:oid
     */
    controller.get($routes.get('display', ':oid'), function (context) {
      context.layout = 'iframe'
      redirectPublicOrContinue(context, function () {
        var oid = context.arguments.oid
        $ressourceRepository.load(oid, function (error, ressource) {
          send(context, error, ressource, 'display')
        })
      })
    })

    /**
     * Page display (voir en pleine page, à priori pour mettre en iframe)
     * @route GET /ressource/voir/:origine/:idOrigine
     */
    controller.get($routes.get('display', ':origine', ':idOrigine'), function (context) {
      context.layout = 'iframe'
      redirectPublicOrContinue(context, function () {
        var origine = context.arguments.origine
        var idOrigine = context.arguments.idOrigine
        $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
          send(context, error, ressource, 'display')
        })
      })
    })

    /**
     * Importe une ressource (via du js client qui appelera l'api
     * @route GET /ressource/import
     */
    controller.get('import', function (context) {
      context.layout = 'page'
      if ($accessControl.isAuthenticated(context)) {
        var data = {
          $metas: {
            title: 'Importer une ressource'
          },
          titre: 'Import d’une ressource',
          contentBloc: {
            $view: 'import'
          },
          jsBloc: {
            $view: 'js',
            jsFiles: ['/import.js'],
            jsCode: 'stimport()'
          }
        }
        context.html(data)
      } else {
        denied(context)
      }
    })

    /**
     * Un proxy pour les pages externes en https
     * @route GET /ressource/urlProxy
     */
    controller.get('urlProxy/:url', function (context) {
      // decodeURIComponent est déjà passé sur les arguments
      const url = context.arguments.url
      return $ressourceFetch.fetchURL(url, `urlProxy${url}`, context)
    })
  })
}
