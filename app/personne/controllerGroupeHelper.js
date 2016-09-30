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

var _ = require('lodash')

/**
 * Helper des controleurs de groupe (api et html)
 * @private
 */
module.exports = function ($accessControl, $groupeRepository, $personneRepository) {
  /**
   * Récupère la liste des groupes dont je suis proprio
   * @private
   * @param {Context} context
   * @param {groupeListCallback} next
   */
  function loadMyGroupesManaged (context, next) {
    var myId = $accessControl.getCurrentUserOid(context)
    if (myId) $groupeRepository.getListManagedBy(myId, next)
    else next()
  }

  /**
   * Retourne le nom du groupe (helper des fcts qui prennent un argument groupe|groupeNom)
   * @private
   * @param {string|Groupe} groupe Le groupe ou son nom
   * @returns {string} undefined si groupe n'est ni une string ni un objet avec une propriété nom
   */
  function getNom (groupe) {
    var nom
    if (groupe) {
      if (groupe.nom) nom = groupe.nom
      else if (typeof groupe === 'string') nom = groupe
    }
    if (!nom) log.error('getNom appelé avec un paramètre incorrect', groupe)
    return nom
  }

  /**
   * Retourne true si on est gestionnaire du groupe
   * @private
   * @param context
   * @param {Groupe} groupe Le groupe (pas son nom)
   * @returns {boolean}
   */
  function isManaged (context, groupe) {
    var myUid = $accessControl.getCurrentUserOid(context)
    var retour = false
    if (groupe && groupe.gestionnaires) {
      retour = _.includes(groupe.gestionnaires, myUid)
    }
    return retour
  }

  /**
   * Retourne true si on suit ce groupe
   * @private
   * @param context
   * @param {string|Groupe} groupe Le groupe ou son nom
   * @returns {boolean}
   */
  function isFollowed (context, groupe) {
    var groupesSuivis = $accessControl.getCurrentUserGroupesSuivis(context)
    var nom = getNom(groupe)
    var retour = false
    if (nom && groupesSuivis.length) {
      retour = groupesSuivis.some(function (groupeNom) { return groupeNom === nom })
    }
    return retour
  }

  /**
   * Ajoute un groupe à l'utilisateur courant
   * @private
   * @param {Context} context
   * @param {string} nom Nom du groupe
   * @param {boolean} isFollow true pour groupesSuivis, groupesMembre sinon
   * @param {callbackPersonne} next
   */
  function addGroup (context, nom, isFollow, next) {
    var me = $accessControl.getCurrentUser(context)
    var prop = isFollow ? 'groupesSuivis' : 'groupesMembre'
    if (me) {
      if (!me[prop]) me[prop] = []
      if (_.includes(me[prop], nom)) {
        log.debug('Le groupe ' + nom + ' était déjà dans ' + prop + ' pour le user ' + me.oid)
        next(null, me)
      } else {
        me[prop].push(nom)
        // si c'est un ajout de groupesMembre, faut aussi mettre groupesSuivis
        if (!isFollow) {
          // c'est lui qui fera la mise à jour en bdd et en cache, puis appelera next
          addGroup(context, nom, true, next)
          // on arrête donc là (et avec 2 lignes jslint râle plus pour une tail recursion inutile)
          return
        }
        // màj session
        $accessControl.updateCurrentUser(context, me)
        // màj user en bdd
        $personneRepository.save(me, next)
        log.debug('groupe ' + nom + ' ajouté à ' + prop)
      }
    } else {
      next(new Error('Il faut être authentifié pour ajouter un groupe'))
    }
  }

  /**
   * Retire un groupe à l'utilisateur courant
   * @private
   * @param {Context} context
   * @param {string} nom Nom du groupe
   * @param {boolean} isFollow true pour groupesSuivis, groupesMembre sinon
   * @param {callbackPersonne} next
   */
  function removeGroup (context, nom, isFollow, next) {
    var me = $accessControl.getCurrentUser(context)
    var prop = isFollow ? 'groupesSuivis' : 'groupesMembre'
    if (me) {
      var deniedMsg = "Vous n'étiez pas dans ce groupe ou il n'existe pas"
      if (me[prop] && me[prop].length) {
        var newGroupes = me[prop].filter(function (groupeNom) { return groupeNom !== nom })
        if (newGroupes.length === me[prop].length) {
          next(new Error(deniedMsg))
        } else {
          me[prop] = newGroupes
          // màj session, pas très utile car on doit avoir une ref dessus, mais plus propre
          $accessControl.updateCurrentUser(context, me)
          // màj user en bdd (et en cache)
          $personneRepository.save(me, next)
        }
      } else {
        next(new Error(deniedMsg))
      }
    } else {
      next(new Error('Il faut être authentifié pour modifier les groupe'))
    }
  }

  /**
   * Ajoute un groupe (membre) à l'utilisateur courant
   * @private
   * @param {Context} context
   * @param {string} nom Nom du groupe
   * @param {callbackPersonne} next
   */
  function joinGroup (context, nom, next) {
    addGroup(context, nom, false, next)
  }

  /**
   * Retire un groupe (membre) à l'utilisateur courant
   * @private
   * @param {Context} context
   * @param {string} nom Nom du groupe
   * @param {callbackPersonne} next
   */
  function quitGroup (context, nom, next) {
    removeGroup(context, nom, false, next)
  }

  /**
   * Ajoute un groupe suivi pour l'utilisateur courant
   * @private
   * @param {Context} context
   * @param {string} nom Nom du groupe
   * @param {callbackPersonne} next
   */
  function followGroup (context, nom, next) {
    addGroup(context, nom, true, next)
  }

  /**
   * Retire un groupe suivi pour l'utilisateur courant
   * @private
   * @param {Context} context
   * @param {string} nom Nom du groupe
   * @param {callbackPersonne} next
   */
  function ignoreGroup (context, nom, next) {
    removeGroup(context, nom, true, next)
  }

  return {
    addGroup: addGroup,
    followGroup: followGroup,
    ignoreGroup: ignoreGroup,
    isFollowed: isFollowed,
    isManaged: isManaged,
    joinGroup: joinGroup,
    loadMyGroupesManaged: loadMyGroupesManaged,
    quitGroup: quitGroup
  }
}
