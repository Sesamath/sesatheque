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
var baseUrl = require('../config').application.baseUrl

// module js pour enregistrer un authClient auprès du service $auth,
// on est requis par l'appli au configure (src/index.js) qui nous passe les services dont on a besoin
module.exports = function (authServerName, $sesalabSsoClient, $auth, $accessControl, $page) {
  /**
   * Renvoie les liens à mettre dans le panneau authentifié d'une personne loggée chez nous
   * @param {string} idAuthServer
   * @returns {Link[]} La liste de liens
   */
  function getSsoLinks (idAuthServer) {
    // pas encore de liens vers mon compte
    return []
  }

  $sesalabSsoClient.setLoginCallback(function (context, user, next) {
    // on lui file d'office le role formateur, parce que l'on sait que nos serveurs d'authentification ne renvoient
    // que des formateurs, sinon il faudrait controler d'apres user.origine
    // (qui est le domaine du serveur d'authentification)
    if (!user.roles) user.roles = {}
    user.roles.formateur = true
    $accessControl.login(context, user, function (error, personne) {
      if (error) {
        next(error)
      } else if (personne) {
        // on ajoute la source de l'authentification en session
        context.session.authOrigine = authServerName
        next()
      } else {
        next(new Error('L’enregistrement de l’utilisateur sur ' + baseUrl + ' a échoué'))
      }
    })
  })

  $sesalabSsoClient.setLogoutCallback(function (context, next) {
    $accessControl.logout(context)
    next()
  })

  $sesalabSsoClient.setErrorCallback($page.printError)

  // et on enregistre ce client
  $auth.addClient({
    name: authServerName,
    description: 'Authentification sur ' + authServerName,
    getLoginUrl: $sesalabSsoClient.getLoginUrl,
    getLogoutUrl: $sesalabSsoClient.getLogoutUrl,
    getSsoLinks: getSsoLinks,
    login: $sesalabSsoClient.login,
    logout: $sesalabSsoClient.logout
  })
}
