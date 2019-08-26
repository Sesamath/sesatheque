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

const {isEmpty} = require('lodash')
const modLog = require('an-log')('$auth')

const displayError = require('../ressource/displayError')
/**
 * Service d'authentification, qui sert de proxy vers les différents authClient enregistrés
 * @service $auth
 */
module.exports = function (component) {
  component.service('$auth', function ($accessControl) {
    /**
     * Vérifie qu'un service d'authentification est conforme pour pouvoir l'ajouter
     * @private
     * @param {AuthClient} authClient
     */
    function checkValidClient (authClient) {
      const msg = 'Service d’authentification invalide, il manque '
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
     * Retourne l'url de retour (pour revenir ici après une connexion ou déconnexion)
     * @private
     * @param {Context} context
     * @return {string}
     */
    function getUrlRetour (context) {
      // si on est sur /connexion ou /deconnexion faudra revenir sur la home après (dé)connexion,
      // sinon la page courante
      const currentUrl = context.request.originalUrl
      // sauf si on est sur l'api, dans ce cas on renvoie ((s))
      if (/\/api\//.test(currentUrl)) return '((s))'
      return currentUrl.replace(/\/(:?de)?connexion/, '')
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
     * Inscrit un client d'authentification
     * Chaque service d'authentification devra appeler cette méthode pour s'inscrire en passant un objet AuthClient
     * @param {AuthClient} authClient
     * @memberOf $auth
     */
    function addClient (authClient) {
      try {
        checkValidClient(authClient)
        if (isEmpty(clients)) {
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
    function deferController (initController) {
      modLog('adding', 'controller')
      if (isEmpty(clients)) deferredInitController = initController
      else initController()
    }

    /**
     * Retourne les infos pour le bloc d'authentification
     * @memberOf $auth
     * @param {Context} context
     * @returns {object} authBloc, avec les propriétés user, ssoLinks, loginLink, loginLinks, logoutLink
     */
    function getAuthBloc (context) {
      const authBloc = {}
      if ($accessControl.isAuthenticated(context)) {
        // menu authentifié
        const {pid, nom, prenom} = $accessControl.getCurrentUser(context)
        authBloc.user = {pid, nom, prenom}
        // éventuels liens spécifiques au sso
        authBloc.ssoLinks = getSsoLinks(context)
        // lien de logout
        authBloc.logoutLink = {
          href: getLogoutUrl(context),
          icon: 'sign-out-alt',
          value: 'Déconnexion'
        }
      } else {
        const loginLinks = getLoginLinks(context)
        if (loginLinks.length > 1) {
          // y'en a plusieurs, un bouton pour ouvrir le menu
          authBloc.loginLink = {
            href: '#',
            icon: 'sign-in-alt',
            value: 'Connexion'
          }
          // et les liens
          authBloc.loginLinks = loginLinks
        } else if (loginLinks.length === 1) {
          // y'en a qu'un, un seul bouton
          authBloc.loginLink = {
            href: loginLinks[0].href,
            icon: 'sign-in-alt',
            value: 'Connexion'
          }
        }
        // sinon, aucun lien, authBloc reste vide et la vue ne sera pas rendue
      }

      return authBloc
    }

    /**
     * Retourne la liste des urls de login possible (une par SSO enregistré)
     * @memberOf $auth
     * @param context
     * @param urlRetour
     */
    function getLoginLinks (context) {
      const urlRetour = getUrlRetour(context)
      // lien(s) de connexion
      const loginLinks = []
      Object.keys(clients).forEach(baseId => {
        const client = clients[baseId]
        const url = client.getLoginUrl && client.getLoginUrl(context, urlRetour)
        if (url) {
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

      return loginLinks
    }

    /**
     * Retourne le lien de logout
     * @param context
     * @return {string}
     */
    function getLogoutUrl (context) {
      if (!$accessControl.isAuthenticated(context)) return
      const urlRetour = getUrlRetour(context)
      let url
      try {
        const client = getClient(context)
        url = client && client.getLogoutUrl && client.getLogoutUrl(context, urlRetour)
      } catch (error) {
        log.error(error)
      }
      if (!url) url = `/deconnexion?redirect=${encodeURIComponent(urlRetour)}`

      return url
    }

    /**
     * Retourne le nom du client (pour affichage à l'utilisateur)
     * @param context
     * @return {AuthClient|String}
     */
    function getName (context) {
      const client = getClient(context)
      return client && client.name
    }

    /**
     * Renvoie les liens à mettre dans le panneau authentifié d'une personne loggée
     * @memberOf $auth
     * @param {Context} context
     * @returns {Link[]} La liste de liens
     */
    function getSsoLinks (context) {
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
    function login (context) {
      if ($accessControl.isAuthenticated(context)) {
        if (context.get.redirect) context.redirect(context.get.redirect)
        else displayError(context, 'Utilisateur déjà connecté')
      } else {
        const client = getClient(context)
        if (client instanceof Error) {
          displayError(context, client)
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
    function logout (context) {
      if ($accessControl.isAuthenticated(context)) {
        $accessControl.logout(context)
        var client = getClient(context)
        if (client instanceof Error) displayError(context, client)
        else client.logout(context)
      } else {
        log.debug('Pas de user en session', context.session)
        displayError(context, 'Pas d’utilisateur connecté (donc personne à déconnecter)')
      }
    }

    return {
      addClient,
      deferController,
      getAuthBloc,
      getLogoutUrl,
      getLoginLinks,
      getName,
      getSsoLinks,
      login,
      logout
    }
  })
}
