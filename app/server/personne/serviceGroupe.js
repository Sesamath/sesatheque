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

/**
 * Helper des controleurs de groupe (api et html)
 * @private
 */
module.exports = function (component) {
  component.service('$groupe', function ($accessControl, $groupeRepository, $personneRepository) {
    /**
     * Récupère la liste des groupes dont je suis proprio
     * @private
     * @param {Context} context
     * @param {groupeListCallback} next
     */
    function loadMyGroupesManaged (context, next) {
      var myOid = $accessControl.getCurrentUserOid(context)
      if (myOid) $groupeRepository.getListManagedBy(myOid, next)
      else next()
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
     * Retourne true si on est gestionnaire du groupe
     * @private
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
    function addGroup (context, userOid, nom, isFollow, next) {
      flow().seq(function () {
        $personneRepository.load(userOid, this)
      }).seq(function (me) {
        const prop = isFollow ? 'groupesSuivis' : 'groupesMembre'
        if (!me[prop]) me[prop] = []
        if (me[prop].includes(nom)) {
          log.debug('Le groupe ' + nom + ' était déjà dans ' + prop + ' pour le user ' + me.oid)
          this(null, me)
        } else {
          me[prop].push(nom)
          // màj session
          // $accessControl.updateCurrentUser(context, me)
          // màj user en bdd
          $personneRepository.save(me, this)
          log.debug('groupe ' + nom + ' ajouté à ' + prop)
        }
      }).done(next)
    }

    /**
     * Retire un groupe à l'utilisateur courant
     * @private
     * @param {Context} context
     * @param {string} nom Nom du groupe
     * @param {boolean} isFollow true pour groupesSuivis, groupesMembre sinon
     * @param {callbackPersonne} next
     */
    function removeGroup (context, userOid, nom, isFollow, next) {
      flow().seq(function () {
        $personneRepository.load(userOid, this)
      }).seq(function (me) {
        const prop = isFollow ? 'groupesSuivis' : 'groupesMembre'
        const deniedMsg = "Vous n'étiez pas dans ce groupe ou il n’existe pas"
        if (me[prop] && me[prop].length) {
          var newGroupes = me[prop].filter(function (groupeNom) { return groupeNom !== nom })
          if (newGroupes.length === me[prop].length) {
            this(new Error(deniedMsg))
          } else {
            me[prop] = newGroupes
            // màj session, pas très utile car on doit avoir une ref dessus, mais plus propre
            // $accessControl.updateCurrentUser(context, me)
            // màj user en bdd (et en cache)
            $personneRepository.save(me, this)
          }
        }
      }).done(next)
    }

    /**
     * Ajoute un groupe (membre) à l'utilisateur courant
     * @private
     * @param {Context} context
     * @param {string} nom Nom du groupe
     * @param {callbackPersonne} next
     */
    function joinGroup (context, userOid, nom, next) {
      addGroup(context, userOid, nom, false, next)
    }

    /**
     * Retire un groupe (membre) à l'utilisateur courant
     * @private
     * @param {Context} context
     * @param {string} nom Nom du groupe
     * @param {callbackPersonne} next
     */
    function quitGroup (context, userOid, nom, next) {
      removeGroup(context, userOid, nom, false, next)
    }

    /**
     * Ajoute un groupe suivi pour l'utilisateur courant
     * @private
     * @param {Context} context
     * @param {string} nom Nom du groupe
     * @param {callbackPersonne} next
     */
    function followGroup (context, userOid, nom, next) {
      addGroup(context, userOid, nom, true, next)
    }

    /**
     * Retire un groupe suivi pour l'utilisateur courant
     * @private
     * @param {Context} context
     * @param {string} nom Nom du groupe
     * @param {callbackPersonne} next
     */
    function ignoreGroup (context, userOid, nom, next) {
      removeGroup(context, userOid, nom, true, next)
    }

    /**
     * Ajoute les noms des gestionnaires du groupe
     * @param {Context} context
     * @param groupe
     * @param {callback} next
     */
    const addInfos = (context, groupe, next) => {
      flow().seq(function () {
        // on veut les noms des gestionnaires
        const gestionnaires = groupe.gestionnaires || []
        $personneRepository.loadByOids(gestionnaires, this)
      }).seq(function (personnes) {
        groupe.gestionnairesNames = personnes.map((p, i) => {
          if (!p) {
            const oid = groupe.gestionnaires[i]
            log.dataError(Error(`Le gestionnaire ${oid} du groupe ${groupe.oid} n’existe plus`))
            return `${oid} inconnu`
          }
          return `${p.prenom} ${p.nom}`
        })
        next(null, groupe)
      }).catch(next)
    }

    return {
      addGroup,
      addInfos,
      followGroup,
      ignoreGroup,
      isFollowed,
      isManaged,
      joinGroup,
      loadMyGroupesManaged,
      quitGroup: quitGroup
    }
  })
}
