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
 * Ce fichier ne sert pas directement dans sesatheque, il est là pour servir de modèle à l'implémentation d'un
 * client d'authentification (et sert aussi pour jsdoc ou l'autocomplétion)
 */

/**
 * Un modèle pour un client SSO qui devra s'inscrire dans la sésathèque via $auth.addClient(authClient)
 * @constructor
 */
function AuthClient() {
  /**
   * Le nom du service
   * @type {string}
   */
  var name = undefined

  /**
   * Un peu de texte qui sera affiché à l'utilisateur pour lui permettre de choisir son serveur d'authentification si plusieurs sont enregistrés
   * @type {string}
   */
  var description = undefined
}

/**
 * Redirige vers le serveur d'authentification qui redirigera vers urlValidate sans demander de login si l'utilisateur n'était pas connecté
 * (pour savoir si l'utilisateur serait connecté sur son serveur sans l'être encore ici)
 * @param {Context} context
 * @param {string}  urlValidate
 * @param {string}  urlLogout
 */
AuthClient.prototype.check = function (context, urlValidate, urlLogout) {

}

/**
 * Renvoie les liens à mettre dans le panneau authentifié d'une personne loggée chez nous
 * @param {string} userId
 * @returns {Link[]} La liste de liens
 */
AuthClient.prototype.getSsoLinks = function (userId) {

}

/**
 * Redirige vers le serveur d'authentification qui devra rappeler urlValidate en GET,
 * en ajoutant des paramètres de son choix que validate devra traiter
 * @param {Context} context
 * @param {string}  urlValidate L'url que le serveur d'authentification devra rappeler après authentification
 * @param {string}  urlLogout   L'url que le serveur d'authentification pourra rappeler si l'utilisateur s'est déconnecté du serveur
 *                              (pour propager le logout ici, sesatheque rappellera alors la méthode logoutFromRemote)
 */
AuthClient.prototype.login = function (context, urlValidate, urlLogout) {

}

/**
 * Redirige vers la déconnexion du serveur d'authentification (elle est déjà faite dans sesatheque)
 * @param {Context} context
 */
AuthClient.prototype.logout = function (context) {

}

/**
 * Répond à une demande de déconnexion du serveur d'authentification via context.json
 * @param {Context} context
 * @param {string}  [errorMsg] Un message d'erreur si la déconnexion n'a pas pu être faite localement
 */
AuthClient.prototype.logoutFromRemote = function (context, errorMsg) {

}
/**
 * Valide une authentification (au retour du serveur SSO) et rappelle next(error, personne)
 * @param {Context}          context
 * @param {personneCallback} next
 */
AuthClient.prototype.validate = function (context, next) {

}

module.exports = AuthClient
