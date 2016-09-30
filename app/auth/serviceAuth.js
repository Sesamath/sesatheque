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

var _ = require('lodash')
var sjtUrl = require('sesajstools/utils/url')
var modLog = require('an-log')('$auth')

module.exports = function ($accessControl, $ressourcePage) {
  /**
   * Vérifie qu'un service d'authentification est conforme pour pouvoir l'ajouter
   * @private
   * @param {AuthClient} authClient
   */
  function checkValidClient (authClient) {
    var msg = "Service d'authentification invalide, il manque "
    if (typeof authClient.name !== 'string') throw new Error(msg + 'name')
    if (clients[authClient.name]) throw new Error('Le client ' + authClient.name + ' est déjà enregistré')
    if (typeof authClient.description !== 'string') throw new Error(msg + 'description')
    if (typeof authClient.login !== 'function') throw new Error(msg + 'login')
    if (typeof authClient.logout !== 'function') throw new Error(msg + 'logout')
  }

  /**
   * Retourne le authClient pour ce contexte, ou une erreur si on l'a pas trouvé
   * @private
   * @param {Context} context
   * @returns {AuthClient|Error}
   */
  function getClient (context) {
    var client
    var origine = getOrigine(context)
    if (origine instanceof Error) client = origine
    else client = clients[origine]

    return client
  }

  /**
   * Retourne l'origine pour ce contexte, ou une erreur si on l'a pas trouvé
   * @private
   * @param {Context} context
   * @returns {string|Error}
   */
  function getOrigine (context) {
    var origine = context.session.authOrigine || context.get.origine || context.post.origine || defaultOrigine
    if (origine) {
      if (!clients[origine]) origine = new Error("Aucun client d'authentification " + origine + " n'a été enregistré")
    } else {
      origine = new Error("Aucun client d'authentification n'a été enregistré")
    }

    return origine
  }

  /**
   * La liste des clients d'authentification inscrits
   * @private
   */
  var clients = {}

  /**
   * Le client par défaut (l'origine qui sera utilisée si rien n'est précisé dans le contexte)
   * @private
   * @type {string}
   */
  var defaultOrigine

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
        defaultOrigine = authClient.name
        // on peut activer le controleur
        if (deferredInitController) deferredInitController()
      }
      clients[authClient.name] = authClient
      modLog('has registered', 'authClient ' + authClient.name)
    } catch (error) {
      log.error(error)
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
   * @returns {object}
   */
  $auth.getAuthBloc = function (context) {
    var authBloc = {}
    // si on est sur /connexion ou /deconnexion on revient sur la home, sinon la page courante
    var urlRetour = context.request.originalUrl.replace(/\/(:?de)?connexion/, '')
    if ($accessControl.isAuthenticated(context)) {
      // menu authentifié
      authBloc.user = {
        oid: context.session.user.oid,
        nom: context.session.user.nom,
        prenom: context.session.user.prenom
      }
      // éventuels liens spécifiques au sso
      authBloc.ssoLinks = $auth.getSsoLinks(context)
      // lien de logout
      var client = getClient(context)
      var urlLogout = client.getLogoutUrl && client.getLogoutUrl(context) || '/deconnexion?redirect=' + encodeURIComponent(urlRetour)
      authBloc.logoutLink = {
        href: urlLogout,
        icon: 'sign-out',
        value: 'Déconnexion'
      }
    } else {
      // lien(s) de connexion
      var loginLinks = []
      _.forOwn(clients, function (client) {
        var url = client.getLoginUrl && client.getLoginUrl(context)
        if (url) {
          url = sjtUrl.complete(url, {redirect: urlRetour})
          loginLinks.push({
            href: url,
            icon: 'arrow-right',
            value: client.description
          })
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
    if (personne) {
      var client = getClient(context)
      if (client instanceof Error) log.error(client)
      else if (client.getSsoLinks) links = client.getSsoLinks(personne.idOrigine)
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
