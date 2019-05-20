/**
 * controller file is part of Sesatheque.
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
/* global log */
'use strict'

const flow = require('an-flow')
const {getNormalizedName} = require('../lib/normalize')

// nos 3 cas
const suivis = ['groupesSuivis']
const membre = ['groupesMembre']
const both = ['groupesMembre', 'groupesSuivis']

/**
 * Helper des controleurs de groupe (api et html)
 * @private
 */
module.exports = function (component) {
  component.service('$groupe', function ($session, $accessControl, $groupeRepository, $personneRepository) {
    // méthodes privées

    /**
     * Ajoute un groupe à l'utilisateur courant
     * @private
     * @param {Context} context
     * @param {string} nom Nom du groupe
     * @param {string[]} groupTypes tableau dont les éléments ne peuvent être que les strings groupesMembre ou groupesSuivis
     * @param {callbackPersonne} next
     */
    function addGroup (context, nom, groupTypes, next) {
      loadCurrentUser(context, function (error, me) {
        if (error) return next(error)
        let hasChanged = false
        groupTypes.forEach(prop => {
          if (!me[prop]) me[prop] = []
          if (me[prop].includes(nom)) {
            log.debug(`Le groupe ${nom} était déjà dans ${prop} pour le user ${me.oid}`)
          } else {
            log.debug('groupe ' + nom + ' ajouté à ' + prop)
            me[prop].push(nom)
            hasChanged = true
          }
        })
        if (hasChanged) saveCurrentUser(context, me, next)
        else next(null, me)
      })
    }

    /**
     * Retourne le nom du groupe (helper des fcts qui prennent un argument groupe|groupeNom)
     * @private
     * @param {string|Groupe} groupe Le groupe ou son nom
     * @returns {string} undefined si groupe n'est ni une string ni un objet avec une propriété nom
     */
    function getNom (groupe) {
      if (typeof groupe === 'string') return groupe
      if (groupe && groupe.nom) return groupe.nom
      log.error('getNom appelé avec un paramètre incorrect', groupe)
    }

    /**
     * Récupère le user courant en bdd
     * @private
     * @param {Context} context
     * @param {callbackPersonne} next
     */
    function loadCurrentUser (context, next) {
      const myOid = $accessControl.getCurrentUserOid(context)
      if (!myOid) throw Error('Pas d’utilisateur en session')
      $personneRepository.load(myOid, next)
    }

    /**
     * Retire un groupe à l'utilisateur courant
     * @private
     * @param {Context} context
     * @param {string} nom Nom du groupe
     * @param {string[]} groupTypes tableau dont les éléments ne peuvent être que les strings groupesMembre ou groupesSuivis
     * @param {callbackPersonne} next
     */
    function removeGroup (context, nom, groupTypes, next) {
      loadCurrentUser(context, function (error, me) {
        if (error) return next(error)
        let hasChanged = false
        groupTypes.forEach(prop => {
          // shortcut aucun groupe
          if (!me[prop] || !me[prop].length) return
          const newGroupes = me[prop].filter((groupeNom) => groupeNom !== nom)
          if (newGroupes.length === me[prop].length) return
          hasChanged = true
          me[prop] = newGroupes
        })
        if (hasChanged) saveCurrentUser(context, me, next)
        else next(new Error(`Vous n’étiez pas dans le groupe ${nom}`))
      })
    }

    /**
     * Met a jour le user courant en session et bdd
     * @private
     * @param {Context} context
     * @param {Personne} me
     * @param {callbackPersonne} next
     */
    function saveCurrentUser (context, me, next) {
      $session.updateCurrentUser(context, me)
      $personneRepository.save(me, next)
    }

    // méthodes exportées

    /**
     * Ajoute gestionnairesNames au groupe (en allant chercher les noms en bdd)
     * @param {Context} context
     * @param {Groupe} groupe
     * @param {groupeCallback} next
     */
    function addGestionnairesNames (context, groupe, next) {
      flow().seq(function () {
        // on veut les noms des gestionnaires
        const gestionnaires = groupe.gestionnaires || []
        $personneRepository.loadByOids(gestionnaires, this)
      }).seq(function (personnes) {
        groupe.gestionnairesNames = personnes.map((p, i) => {
          if (p) return `${p.prenom} ${p.nom}`
          // il est pas ou plus en base, faut quand même renvoyer une string
          const oid = groupe.gestionnaires[i]
          log.dataError(Error(`Le gestionnaire ${oid} du groupe ${groupe.oid} n’existe plus`))
          return `${oid} inconnu`
        })
        next(null, groupe)
      }).catch(next)
    }

    /**
     * Renvoie true si c'est le même index de groupe (après passage du normalizer)
     * @param {string} nom1
     * @param {string} nom2
     * @return {boolean}
     */
    function areEquals (nom1, nom2) {
      if (typeof nom1 !== 'string' || typeof nom2 !== 'string') throw Error('paramètres invalides')
      return getNormalizedName(nom1) === getNormalizedName(nom2)
    }

    /**
     * Ajoute un groupe suivi pour l'utilisateur courant
     * @param {Context} context
     * @param {string} nom Nom du groupe
     * @param {callbackPersonne} next
     */
    function followGroup (context, nom, next) {
      addGroup(context, nom, suivis, next)
    }

    /**
     * Retire un groupe suivi pour l'utilisateur courant
     * @param {Context} context
     * @param {string} nom Nom du groupe
     * @param {callbackPersonne} next
     */
    function ignoreGroup (context, nom, next) {
      removeGroup(context, nom, suivis, next)
    }

    /**
     * Retourne true si on suit ce groupe
     * @param context
     * @param {string|Groupe} groupe Le groupe ou son nom
     * @returns {boolean}
     */
    function isFollowed (context, groupe) {
      const groupesSuivis = $accessControl.getCurrentUserGroupesSuivis(context)
      const nom = getNom(groupe)
      if (nom && groupesSuivis.length) return groupesSuivis.includes(nom)
      return false
    }

    /**
     * Retourne true si on est gestionnaire du groupe
     * @param context
     * @param {Groupe} groupe Le groupe (pas son nom)
     * @returns {boolean}
     */
    function isManaged (context, groupe) {
      if (!groupe || !groupe.gestionnaires) throw Error('groupe invalide')
      const oid = $accessControl.getCurrentUserOid(context)
      if (!oid) return false
      return groupe.gestionnaires.includes(oid)
    }

    /**
     * Retourne true si on est membre du groupe
     * @param {Context} context
     * @param {string|Groupe} groupe Le groupe ou son nom
     * @returns {boolean}
     */
    function isMemberOf (context, groupe) {
      const groupesMembre = $accessControl.getCurrentUserGroupesMembre(context)
      const nom = getNom(groupe)
      if (nom && groupesMembre.length) return groupesMembre.includes(nom)
      return false
    }

    /**
     * Ajoute un groupe (membre) à l'utilisateur courant
     * @param {Context} context
     * @param {string} nom Nom du groupe
     * @param {callbackPersonne} next
     */
    function joinGroup (context, nom, next) {
      addGroup(context, nom, membre, next)
    }

    /**
     * Ajoute le groupe à groupesMembre et groupesSuivis du user courant
     * @param {Context} context
     * @param {string} nom Le groupe
     * @param {callbackPersonne} next
     */
    function joinAndFollowGroup (context, nom, next) {
      addGroup(context, nom, both, next)
    }

    /**
     * Retire un groupe (membre) à l'utilisateur courant
     * @param {Context} context
     * @param {string} nom Nom du groupe
     * @param {callbackPersonne} next
     */
    function quitGroup (context, nom, next) {
      removeGroup(context, nom, membre, next)
    }

    return {
      addGestionnairesNames,
      areEquals,
      followGroup,
      ignoreGroup,
      isFollowed,
      isManaged,
      isMemberOf,
      joinGroup,
      joinAndFollowGroup,
      quitGroup
    }
  })
}
