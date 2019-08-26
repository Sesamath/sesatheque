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

const {isEntity} = require('../lib/tools')

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
      if (context.session.user) log(Error('Il y avait déjà un utilisateur en session'))
      if (!isEntity(personne, 'EntityPersonne')) throw Error('user n’est pas une entity Utilisateur')
      if (typeof personne.values !== 'function') throw Error('$session.login veut une entity')
      context.session.user = personne.values()
    }

    /**
     * Supprime l'utilisateur en session
     * @param {Context} context
     */
    function logout (context) {
      context.session.user = null
    }

    /**
     * Renomme un groupe dans le user en session
     * (ne vérifie pas que newName existait déjà car ça devrait pas être possible de renommer un groupe
     * vers un nom existant, la sauvegarde en base a planté avant d'arriver là)
     * @param {Context} context
     * @param {string} oldName
     * @param {string} newName
     */
    function renameGroup (context, oldName, newName) {
      if (!context.session.user) return
      if (!context.session.user.groupesMembre) context.session.user.groupesMembre = []
      if (!context.session.user.groupesSuivis) context.session.user.groupesSuivis = []
      context.session.user.groupesMembre = context.session.user.groupesMembre.map(nom => nom === oldName ? newName : nom)
      context.session.user.groupesSuivis = context.session.user.groupesSuivis.map(nom => nom === oldName ? newName : nom)
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
     * Met à jour
     * @param context
     * @param personne
     */
    function updateCurrentUser (context, personne) {
      if (!context.session.user) throw Error('Aucun utilisateur en session, impossible de mettre à jour')
      if (!isEntity(personne, 'EntityPersonne')) throw Error('personne n’est pas une EntityPersonne')
      const values = personne.values()
      if (context.session.user.oid !== values.oid) {
        log.error(Error(`updateCurrentUser avec ${values.oid} alors qu’on a en session ${context.session.user.oid}`))
        throw Error('L’utilisateur en session ne correspond pas, impossible de mettre à jour')
      }
      Object.entries(values).forEach(([k, v]) => {
        context.session.user[k] = v
      })
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
      renameGroup,
      setAuthBaseId,
      updateCurrentUser
    }
  })
}
