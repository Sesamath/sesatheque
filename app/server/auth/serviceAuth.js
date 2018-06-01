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

const _ = require('lodash')
const sjtUrl = require('sesajstools/http/url')
const modLog = require('an-log')('$auth')

module.exports = function ($accessControl, $ressourcePage) {
  /**
   * Vérifie qu'un service d'authentification est conforme pour pouvoir l'ajouter
   * @private
   * @param {AuthClient} authClient
   */
  function checkValidClient (authClient) {
    let msg = 'Service d’authentification invalide, il manque '
    if (typeof authClient.baseId !== 'string') throw new Error(msg + 'baseId')
    if (clients[authClient.baseId]) throw new Error(`Le client ${authClient.baseId} est déjà enregistré`)
    if (typeof authClient.description !== 'string') throw new Error(msg + 'description')
    if (typeof authClient.login !== 'function') throw new Error(msg + 'login')
    if (typeof authClient.logout !== 'function') throw new Error(msg + 'logout')
  }

  /**
   * Retourne le authClient pour ce contexte, ou une erreur si on l'a pas trouvé
   * @private
   * @param {Context} context
   * @returns {AuthClient}
   * @throws {Error} si on a pas de authBaseId
   */
  function getClient (context) {
    const origine = getBaseId(context)
    return clients[origine]
  }

  /**
   * Retourne le authBaseId pour ce contexte, ou lance une erreur si on l'a pas trouvé
   * @private
   * @param {Context} context
   * @returns {string}
   * @throws {Error} si on a pas trouvé de authBaseId
   */
  function getBaseId (context) {
    const baseId = context.session.authBaseId || context.get.origine || context.post.origine
    if (!baseId) throw new Error('Aucun client d’authentification n’a été enregistré')
    if (!clients[baseId]) throw new Error(`Aucun client d’authentification sur ${baseId} n’a été enregistré`)

    return baseId
  }

  /**
   * La liste des clients d'authentification inscrits
   * @private
   */
  var clients = {}

  /**
   * Le controleur en attente de client
   * @private
   */
  var deferredInitController

  /**
   * Service d'authentification, qui sert de proxy vers les différents authClient enregistrés
   * @service $auth
   */
  var $auth = {}

  /**
   * Inscrit un client d'authentification
   * Chaque service d'authentification devra appeler cette méthode pour s'inscrire en passant un objet AuthClient
   * @param {AuthClient} authClient
   * @memberOf $auth
   */
  $auth.addClient = function (authClient) {
    try {
      checkValidClient(authClient)
      if (_.isEmpty(clients)) {
        // faut activer le controleur
        if (deferredInitController) deferredInitController()
      }
      clients[authClient.baseId] = authClient
      modLog('has registered', `authClient ${authClient.baseId}`)
    } catch (error) {
      log.error(error, authClient)
    }
  }

  /**
   * Lance  initController() si un client est déjà enregistré ou le garde en attente pour le lancer au premier client qui s'enregistrera
   * @memberOf $auth
   * @param {function} initController
   */
  $auth.deferController = function (initController) {
    modLog('adding', 'controller')
    if (_.isEmpty(clients)) deferredInitController = initController
    else initController()
  }

  /**
   * Retourne les infos pour le bloc d'authentification
   * @memberOf $auth
   * @param {Context} context
   * @returns {object} authBloc, avec les propriétés user, ssoLinks, loginLink, loginLinks, logoutLink
   */
  $auth.getAuthBloc = function (context) {
    const authBloc = {}
    // si on est sur /connexion ou /deconnexion faudra revenir sur la home après (dé)connexion,
    // sinon la page courante
    const urlRetour = context.request.originalUrl.replace(/\/(:?de)?connexion/, '')
    if ($accessControl.isAuthenticated(context)) {
      // menu authentifié
      const {pid, nom, prenom} = $accessControl.getCurrentUser(context)
      authBloc.user = {pid, nom, prenom}
      // éventuels liens spécifiques au sso
      authBloc.ssoLinks = $auth.getSsoLinks(context)
      let client
      try {
        client = getClient(context)
      } catch (error) {
        log.error(error)
      }
      // lien de logout
      authBloc.logoutLink = {
        href: (client && client.getLogoutUrl && client.getLogoutUrl(context)) || '/deconnexion?redirect=' + encodeURIComponent(urlRetour),
        icon: 'sign-out-alt',
        value: 'Déconnexion'
      }
    } else {
      // lien(s) de connexion
      var loginLinks = []
      Object.keys(clients).forEach(baseId => {
        const client = clients[baseId]
        let url = client.getLoginUrl && client.getLoginUrl(context)
        if (url) {
          url = sjtUrl.complete(url, {redirect: urlRetour})
          const link = {
            href: url,
            icon: 'arrow-right',
            value: client.description
          }
          if (!link.value) {
            log.error(`client ${client.baseId} sans description`, client)
            link.value = `login sur ${client.baseId}`
          }
          loginLinks.push(link)
          // pour le moment labomep2 ne gère pas ça
          // } else {
          //   log.error(`client ${client.baseId} sans getLoginUrl`, client)
        }
      })
      if (loginLinks.length > 1) {
        // y'en a plusieurs, un bouton pour ouvrir le menu
        authBloc.loginLink = {
          href: '#',
          icon: 'sign-in',
          value: 'Connexion'
        }
        // et les liens
        authBloc.loginLinks = loginLinks
      } else if (loginLinks.length === 1) {
        // y'en a qu'un, un seul bouton
        authBloc.loginLink = {
          href: loginLinks[0].href,
          icon: 'sign-in',
          value: 'Connexion'
        }
      }
      // sinon, aucun lien, authBloc reste vide et la vue ne sera pas rendue
    }

    return authBloc
  }

  /**
   * Renvoie les liens à mettre dans le panneau authentifié d'une personne loggée
   * @memberOf $auth
   * @param {Context} context
   * @returns {Link[]} La liste de liens
   */
  $auth.getSsoLinks = function (context) {
    var links = []
    var personne = $accessControl.getCurrentUser(context)
    if (personne && personne.pid) {
      try {
        const client = getClient(context)
        if (client.getSsoLinks) {
          const slashPos = personne.pid.indexOf('/')
          const authBaseId = slashPos > 0 && personne.pid.substr(slashPos + 1)
          links = client.getSsoLinks(authBaseId)
        } else {
          log.error(`client ${client.baseId} sans getSsoLinks`)
        }
      } catch (error) {
        log.error(error)
      }
    }

    return links
  }

  /**
   * Redirige vers la connexion du serveur d'authentification
   * ou affiche une erreur
   * @memberOf $auth
   * @param {Context} context
   */
  $auth.login = function (context) {
    if ($accessControl.isAuthenticated(context)) {
      if (context.get.redirect) context.redirect(context.get.redirect)
      else $ressourcePage.printError(context, new Error('Utilisateur déjà connecté'), 200)
    } else {
      var client = getClient(context)
      if (client instanceof Error) {
        $ressourcePage.printError(context, client)
      } else {
        client.login(context)
      }
    }
  }

  /**
   * Déconnecte localement puis redirige vers la déconnexion du serveur d'authentification (qui rappellera logoutFromRemote)
   * ou affiche une erreur
   * @memberOf $auth
   * @param {Context} context
   */
  $auth.logout = function (context) {
    if ($accessControl.isAuthenticated(context)) {
      $accessControl.logout(context)
      var client = getClient(context)
      if (client instanceof Error) $ressourcePage.printError(context, client)
      else client.logout(context)
    } else {
      log.debug('Pas de user en session', context.session)
      $ressourcePage.printError(context, new Error("Pas d'utilisateur connecté (donc personne à déconnecter)"))
    }
  }

  return $auth
}
