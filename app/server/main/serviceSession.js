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

module.exports = function (component) {
  component.service('$session', function () {
    /**
     * Retourne le baseId du client d'authentification courant
     * @param context
     * @return {string|undefined}
     */
    const getAuthBaseId = (context) => context.session.authBaseId

    /**
     * Retourne le user courant (undefined si on est pas loggé)
     * @param {Context} context
     * @return {Personne|undefined}
     */
    const getCurrentPersonne = (context) => context.session.user

    /**
     * Affecte un utilisateur en session (props groupesMembre, groupesSuivis, nom, oid, pid, prenom, roles)
     * @param {Context} context
     * @param {Personne} personne
     * @throws {Error} Si y'avait déjà un user en session ou si personne n'a pas les propriétés minimales
     */
    function login (context, personne) {
      if (context.session.user) throw Error('Il y avait déjà une utilisateur en session')
      // on vérifie qu'il a au moins ces propriétés
      ;['groupesMembre', 'groupesSuivis', 'nom', 'oid', 'pid', 'prenom', 'roles', 'permissions'].forEach(prop => {
        if (!personne.hasOwnProperty(prop)) throw new Error(`Paramètres invalides (${prop} manquant)`)
      })
      context.session.user = personne
    }

    /**
     * Supprime l'utilisateur en session
     * @param {Context} context
     */
    function logout (context) {
      context.session.user = null
    }

    /**
     * Affecte authBaseId
     * @param context
     * @param baseId
     */
    function setAuthBaseId (context, baseId) {
      context.session.authBaseId = baseId
    }

    /**
     * Service de gestion de la session (ça devrait être le seul endroit qui modifie context.session)
     * @service $session
     */
    return {
      getAuthBaseId,
      getCurrentPersonne,
      login,
      logout,
      setAuthBaseId
    }
  })
}
