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

const {application: {baseUrl: myBaseUrl}} = require('../config')
const displayError = require('../ressource/displayError')

/**
 * Enregistre un authClient (de sesalab-sso) auprès du service $auth
 * Requis par l'appli au configure (src/index.js), qui passe les services utiles
 * (mais on est pas un service lassi, juste un module js classique)
 *
 * @param authName Un nom en clair pour le serveur d'authentification
 * @param authBaseId La baseId du serveur d'authentification
 */
module.exports = function (authName, authBaseId) {
  const $sesalabSsoClient = lassi.service('$sesalabSsoClient')
  const $auth = lassi.service('$auth')
  const $accessControl = lassi.service('$accessControl')

  /**
   * Renvoie les liens à mettre dans le panneau authentifié d'une personne loggée chez nous
   * @param {string} idAuthServer
   * @returns {Link[]} La liste de liens
   */
  function getSsoLinks (idAuthServer) {
    // sur une sesathèque on a pas encore de liens vers mon compte pour une personne authentifiée sur un sesalab
    return []
  }

  $sesalabSsoClient.setLoginCallback(function (context, user, next) {
    if (!user) return next(new Error('login sans user à connecter'))
    // log.debug('user avant login, reçu du validate', user, 'login', {max: 5000})
    // on lui file d'office le role formateur, parce que l'on sait que nos serveurs d'authentification
    // ne renvoient que des formateurs, sinon il faudrait controler d'apres authBaseId
    const userToLogin = Object.assign({roles: {formateur: true}}, user)
    // @todo à virer quand tout le monde sera avec la bonne version
    if (!userToLogin.pid && userToLogin.origine && userToLogin.idOrigine) {
      console.error('module sesalab-sso obsolete sur le serveur d’authentification, le mettre à jour en version > 1.0.5')
      userToLogin.pid = userToLogin.origine + '/' + userToLogin.idOrigine
      delete userToLogin.origine
      delete userToLogin.idOrigine
    }
    $accessControl.login(context, userToLogin, function (error, personne) {
      // log.debug('user après login', personne, 'login', {max: 5000})
      if (error) {
        next(error)
      } else if (personne) {
        // console.log('après login les permissions', personne.permissions)
        // on ajoute la source de l'authentification en session
        context.session.authBaseId = authBaseId
        next()
      } else {
        next(new Error('L’enregistrement de l’utilisateur sur ' + myBaseUrl + ' a échoué'))
      }
    })
  })

  $sesalabSsoClient.setLogoutCallback(function (context, next) {
    $accessControl.logout(context)
    next()
  })

  $sesalabSsoClient.setErrorCallback(displayError)

  // et on enregistre ce client (c'est ce addClient qui râlera si authBaseId est pas autorisée via la conf)
  $auth.addClient({
    name: authName,
    baseId: authBaseId,
    description: 'Authentification sur ' + authName,
    getLoginUrl: $sesalabSsoClient.getLoginUrl,
    getLogoutUrl: $sesalabSsoClient.getLogoutUrl,
    getSsoLinks: getSsoLinks,
    login: $sesalabSsoClient.login,
    logout: $sesalabSsoClient.logout
  })
}
