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

/**
 * Controleur de la route /api/auth/
 * @Controller controllerApiAuth
 */
module.exports = function (component) {
  component.controller(function ($auth, $accessControl, $ressourceRepository) {
    const controller = this
    /**
     * Renvoie en json les infos pour le bloc d'authentification et les droits sur une ressource éventuelle
     * (pour ajouter les boutons modifier / supprimer sur les pages publiques, utilisé par la méthode cliente page.refreshAuth)
     * @route GET /api/auth[?ressourceId=xxx]
     */
    controller.get('api/auth', function (context) {
      /**
       * @name context
       * @type {Context}
       * @private
       */
      const isLogged = $accessControl.isAuthenticated(context)
      const auth = {
        isLogged: isLogged,
        permissions: ''
      }
      if (isLogged) {
        auth.pid = $accessControl.getCurrentUserPid(context)
        auth.authBloc = $auth.getAuthBloc(context)
        if ($accessControl.hasPermission('create', context)) auth.permissions += 'C'
      }
      if (isLogged && context.get.ressourceId) {
        $ressourceRepository.load(context.get.ressourceId, function (error, ressource) {
          if (error) return log.error(error)
          if (ressource) {
            if ($accessControl.hasPermission('delete', context, ressource)) auth.permissions += 'D'
            if ($accessControl.hasPermission('update', context, ressource)) auth.permissions += 'W'
          }
          context.json(auth)
        })
      } else {
        context.json(auth)
      }
    })
    /**
     * retourne isLogged & roles
     * @route /api/auth/getRoles
     */
    controller.get('api/auth/getRoles', function (context) {
      const currentUser = $accessControl.getCurrentUser(context)
      const isLogged = !!currentUser
      const roles = (currentUser && currentUser.roles) || []
      return {
        isLogged,
        roles
      }
    })
  })
}
