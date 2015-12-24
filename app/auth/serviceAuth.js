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

/**
 * service $auth, pour centraliser l'authentification (chaque module d'authentification devra y inscrire son client)
 */

var _ = require('lodash')
var baseUrl = require('../config').application.baseUrl
var modLog = require('an-log')('$auth')

module.exports = function ($accessControl, $views) {
  /**
   * Vérifie qu'un service d'authentification est conforme pour pouvoir l'ajouter
   * @private
   * @param {AuthClient} authClient
   */
  function checkValidClient(authClient) {
    var msg = "Service d'authentification invalide, il manque "
    if (typeof authClient.name !== "string") throw new Error(msg +"name")
    if (clients[authClient.name]) throw new Error("Le client " +authClient.name +" est déjà enregistré")
    if (typeof authClient.description !== "string") throw new Error(msg +"description")
    if (typeof authClient.login !== "function") throw new Error(msg +"login")
    if (typeof authClient.validate !== "function") throw new Error(msg +"validate")
    if (typeof authClient.logout !== "function") throw new Error(msg +"logout")
  }

  /**
   * Retourne le authClient pour ce contexte, ou une erreur si on l'a pas trouvé
   * @private
   * @param {Context} context
   * @returns {AuthClient|Error}
   */
  function getClient(context) {
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
  function getOrigine(context) {
    var origine = context.get.origine || context.post.origine || defaultClient
    if (origine) {
      if (!clients[origine]) origine = new Error("Aucun client d'authentification " +origine +" n'a été enregistré")
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
  var defaultClient

  /**
   * Le controleur en attente de client
   * @private
   */
  var deferredInitController

  /**
   * Service d'authentification, proxy vers les différents authClient enregistrés
   * @service $auth
   */
  var $auth = {};

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
        defaultClient = authClient.name
        // on peut activer le controleur
        if (deferredInitController) deferredInitController()
      }
      clients[authClient.name] = authClient
      modLog("has registered", "authClient" +authClient.name)
    } catch (error) {
      log.error(error)
    }
  }

  /**
   * Redirige vers le serveur d'authentification pour savoir si on y est connecté (reviendra sur /validation?origine=…)
   * @param {Context}       context
   * @param {errorCallback} next
   * @memberOf $auth
   */
  $auth.check = function (context, next) {
    try {
      var user = $accessControl.getCurrentUser(context)
      if (user) {
        throw new Error("Utilisateur déjà connecté")
      } else if (context.session.user && context.session.user.lastCheck) {
        var origine = getOrigine(context)
        if (origine instanceof Error) {
          throw origine
        } else {
          var client = getClient(context)
          client.check(context, baseUrl +'validation?origine=' +origine, baseUrl+'deconnexion')
        }
      }
    } catch (error) {
      next(error)
    }
  }

  /**
   * Lance  initController() si un client est déjà enregistré ou le garde en attente pour le lancer au premier client qui s'enregistre
   * @memberOf $auth
   * @param {function} initController
   */
  $auth.deferController = function (initController) {
    modLog("adding", "controller")
    if (_.isEmpty(clients)) deferredInitController = initController
    else initController()
  }

  /**
   * Retourne les infos pour le bloc d'authentification
   * @memberOf $auth
   * @param {Context} context
   * @returns {object}
   */
  $auth.getAuthBloc = function(context) {
    var authBloc = {}
    var urlRedirect
    if ($accessControl.isAuthenticated(context)) {
      // on veut pas rediriger sur la connexion après déconnexion
      urlRedirect = context.request.originalUrl.replace("connexion", "")
      authBloc.user = {
        nom: context.session.user.nom,
        prenom: context.session.user.prenom,
      }
      authBloc.ssoLinks = $auth.getSsoLinks(context)
      authBloc.logoutLink = {
        href : "/deconnexion?redirect=" +encodeURIComponent(urlRedirect),
        icon : "sign-out",
        value: "Déconnexion"
      }
    } else {
      // on veut pas rediriger sur deconnexion après connexion
      urlRedirect = context.request.originalUrl.replace("deconnexion", "")
      // faut envoyer au moins une propriété sinon la vue n'est pas rendue (ici on en a une mais sinon faut mettre un foo:bar qcq)
      authBloc.loginLink = {
        href : "/connexion?redirect=" +encodeURIComponent(urlRedirect),
        icon : "sign-in",
        value: "Connexion"
      }
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
      else links = client.getSsoLinks(personne.idOrigine)
    }

    return links
  }

  /**
   * Redirige vers la connexion du serveur d'authentification (elle est déjà faite dans sesatheque)
   * ou affiche une erreur
   * @memberOf $auth
   * @param {Context} context
   */
  $auth.login = function (context) {
    var user = $accessControl.getCurrentUser(context)
    if (user) {
      $views.printError(context, new  Error("Utilisateur déjà connecté"))
    } else {
      var client = getClient(context)
      if (client instanceof Error) {
        $views.printError(context, client)
      } else {
        var urlValidate = baseUrl +'validation'
        if (context.get.redirect) urlValidate += '?redirect=' +encodeURIComponent(context.get.redirect)
        var urlLogout = baseUrl+'deconnexion'
        client.login(context, urlValidate, urlLogout)
      }
    }
  }

  /**
   * Redirige vers la déconnexion du serveur d'authentification (elle est déjà faite dans sesatheque)
   * ou affiche une erreur
   * @memberOf $auth
   * @param {Context} context
   */
  $auth.logout = function (context) {
    var user = $accessControl.getCurrentUser(context)
    if (user) {
      $accessControl.logout(context)
      var client = getClient(context)
      if (client instanceof Error) $views.printError(context, client)
      else client.logout(context)
    } else {
      log.debug("Pas de user en session", context.session)
      $views.printError(context, new Error("Pas d'utilisateur connecté (donc personne à déconnecter)"))
    }
  }

  /**
   * Répond à une demande de déconnexion du serveur d'authentification
   * (forward vers authClient ou affiche une erreur au format json|html|txt suivant accept)
   * @memberOf $auth
   * @param {Context} context
   * @param {Error}   error
   */
  $auth.logoutFromRemote = function (context, error) {
    try {
      if (error) throw error
      var user = $accessControl.getCurrentUser(context)
      if (user) {
        $accessControl.logout(context)
        var client = getClient(context)
        // ce serait bizarre d'avoir un user connecté sans client, au cas où…
        if (client instanceof Error) throw client
        client.logoutFromRemote(context)
      } else {
        throw new Error("Aucun utilisateur connecté")
      }
    } catch (error) {
      $views.outputError(context, error, "iframe")
    }
  }

  /**
   * Valide une authentification (au retour du serveur SSO) et rappelle next(error, personne)
   * @memberOf $auth
   * @param {Context}    context
   * @param {personneCallback} next
   */
  $auth.validate = function (context, next) {
    var client = getClient(context)
    if (client instanceof Error) {
      $views.printError(context, client)
    } else {
      client.validate(context, function (error, personne) {
        if (error) {
          next(error)
        } else {
          if (!personne) personne = {}
          personne.origine = getOrigine(context)
          personne.lastCheck = new Date()
          $accessControl.login(context, personne, next)
        }
      })
    }
  }

  return $auth
}