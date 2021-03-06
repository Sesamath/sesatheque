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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

const displayError = require('../ressource/displayError')

/**
 * Controleur pour gérer l'authentification
 * @controller controllerAuth
 * @extends Controller
 */
module.exports = function (component) {
  component.controller(function ($auth, $accessControl) {
    function redirectOrError (context) {
      context.layout = 'page'
      if (context.get.redirect) context.redirect(context.get.redirect)
      else displayError(context, 'Utilisateur déjà connecté')
    }

    const controller = this

    // on diffère la création des routes à l'ajout du premier client
    $auth.deferController(function () {
      /**
       * connexion, redirige vers le serveur d'authentification par défaut ou précisé par ?source=xxx
       * @route GET /connexion
       */
      controller.get('connexion', function (context) {
        if ($accessControl.isAuthenticated(context)) {
          redirectOrError(context)
        } else {
          $auth.login(context)
        }
      })

      /**
       * Déconnexion ici (action de l'utilisateur sur ce site),
       * et redirection vers la déconnexion du serveur sso (qui rappellera son client ici)
       * On est juste là en fallBack, normalement le lien de déconnexion pointe directement sur
       * l'url de déconnexion de notre serveur d'authentification (ou ici si on l'a pas trouvé,
       * pour au moins déconnecter localement)
       * @route GET /deconnexion
       */
      controller.get('deconnexion', function (context) {
        if ($accessControl.isAuthenticated(context)) {
          $auth.logout(context)
        } else {
          context.layout = 'page'
          displayError(context, 'Utilisateur déjà déconnecté (ou jamais connecté)')
        }
      })

      /**
       * Valide un retour du serveur d'authentification (qui peut répondre que l'on est pas connecté)
       * @route GET /validation
       */
      controller.get('validation', function (context) {
        if ($accessControl.isAuthenticated(context)) return redirectOrError(context)
        $auth.validate(context, function (error) {
          if (error) return displayError(context, error)
          const uri = context.get.redirect || '/'
          context.redirect(uri)
        })
      })

      /**
       * Controleur sur toutes les routes html pour peupler le authBloc (faut passer après les contrôleurs html),
       * @route GET /*
       */
      controller.get('*', function (context) {
        // si on est pas concerné on passe au suivant sans rien faire
        if (context.layout !== 'page') return context.next()
        const data = {
          authBloc: $auth.getAuthBloc(context)
        }
        data.authBloc.$view = 'auth'
        context.next(null, data)
      })
    }) // deferController
  })
}
