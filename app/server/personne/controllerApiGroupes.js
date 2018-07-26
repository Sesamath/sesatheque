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

const flow = require('an-flow')

/**
 * Répond sur certaines requetes OPTIONS
 * @private
 * @param {Context} context
 */
function optionsOk (context) {
  context.next(null, 'OK') // ne pas renvoyer de chaîne vide sinon 404
}

module.exports = function (component) {
  component.controller('api/groupes', function (EntityGroupe, $groupeRepository, $accessControl, $json, $personneRepository, $groupe) {
    const {addGestionnairesNames} = $groupe

    /**
     * Controleur de la route /api/groupe/
     * @Controller controllerApiGroupe
     */
    const controller = this

    /**
     * Récupère la liste des groupes dont on est admin
     * @route GET /api/groupes/admin
     */
    controller.get('admin', function (context) {
      const groupesAdmin = []
      const oid = $accessControl.getCurrentUserOid(context)
      if (!oid) return $json.denied(context, "Il faut s'authentifier avant pour récupérer ses groupes")
      flow().seq(function () {
        $groupeRepository.fetchListManagedBy(oid, this)
      }).seq(function (groupesManaged) {
        if (groupesManaged && groupesManaged.length) {
          groupesManaged.forEach(function (groupe) {
            groupesAdmin.push({name: groupe.nom, admin: true})
          })
        }
        $json.sendOk(context, {groupesAdmin: groupesAdmin})
      }).catch(function (error) {
        console.error(error)
        $json.sendError(context, 'Une erreur est survenue dans la récupération des groupes')
      })
    })
    controller.options('admin', optionsOk)

    /**
     * Récupère la liste des groupes dont on est membre
     * @route GET /api/groupes/membre
     */
    controller.get('membre', function (context) {
      const groupesMembre = []
      const done = {}
      const oid = $accessControl.getCurrentUserOid(context)
      if (!oid) return $json.denied(context, "Il faut s'authentifier avant pour récupérer ses groupes")
      flow().seq(function () {
        $groupeRepository.fetchListManagedBy(oid, this)
      }).seq(function (groupesManaged) {
        if (groupesManaged && groupesManaged.length) {
          groupesManaged.forEach(function (groupe) {
            groupesMembre.push({name: groupe.nom, admin: true})
            done[groupe.nom] = true
          })
        }
        $accessControl.getCurrentUserGroupesMembre(context).forEach(function (groupeName) {
          if (!done[groupeName]) {
            groupesMembre.push({name: groupeName, member: true})
            done[groupeName] = true
          }
        })
        $json.sendOk(context, {groupesMembre: groupesMembre})
      }).catch(function (error) {
        console.error(error)
        $json.sendError(context, 'Une erreur est survenue dans la récupération des groupes')
      })
    })
    controller.options('membre', optionsOk)

    /**
     * Retourne la liste de tous les groupes du user courant, sous la forme d'un objet
     * {groupesAll: {nom: groupe},groupesAdmin: string[], groupesMembre: string[], groupesSuivis: string[]}
     * @route GET /api/groupes/perso
     */
    controller.get('perso', function (context) {
      const oid = $accessControl.getCurrentUserOid(context)
      if (!oid) return $json.denied(context, 'Il faut être authentifié pour récupérer ses groupes')
      const groupes = {}
      const addGroupe = (groupe) => {
        delete groupe.$loadState
        groupes[groupe.nom] = groupe
      }
      const response = {
        groupes,
        groupesAdmin: []
      }

      flow().seq(function () {
        $groupeRepository.fetchListManagedBy(oid, this)
      }).seq(function (managedGroups) {
        managedGroups.forEach((groupe) => {
          addGroupe(groupe)
          response.groupesAdmin.push(groupe.nom)
        })

        // on peut charger le user (pour avoir ses groupes à jour)
        $personneRepository.load(oid, this)
      }).seq(function (personne) {
        const {groupesMembre, groupesSuivis} = personne
        response.groupesMembre = groupesMembre
        response.groupesSuivis = groupesSuivis

        // les groupes qui manquent
        const missing = new Set()
        groupesMembre.concat(groupesSuivis).forEach(nom => {
          if (!groupes[nom]) missing.add(nom)
        })
        if (!missing.size) return this()
        // faut aller chercher les groupes manquants
        const next = this
        $groupeRepository.fetchListByNom(Array.from(missing), (error, groupes) => {
          if (error) next(error)
          groupes.forEach(addGroupe)
          next()
        })
      }).seq(function () {
        // on peut traiter la liste de tous les groupes
        this(null, Object.values(groupes))
      }).seqEach(function (groupe) {
        addGestionnairesNames(context, groupe, this)
      }).seq(function () {
        $json.sendOk(context, response)
      }).catch($json.sendError.bind(null, context))
    })
    controller.options('perso', optionsOk)

    /**
     * Récupère la liste des groupes suivis
     * @route GET /api/groupes/suivis
     */
    controller.get('suivis', function (context) {
      const groupesSuivis = []
      const done = {}
      const oid = $accessControl.getCurrentUserOid(context)
      if (!oid) return $json.denied(context, "Il faut s'authentifier avant pour récupérer ses groupes suivis")

      flow().seq(function () {
        $groupeRepository.fetchListManagedBy(oid, this)
      }).seq(function (groupesManaged) {
        if (groupesManaged && groupesManaged.length) {
          groupesManaged.forEach(function (groupe) {
            groupesSuivis.push({name: groupe.nom, admin: true})
            done[groupe.nom] = true
          })
        }
        $accessControl.getCurrentUserGroupesMembre(context).forEach(function (groupeName) {
          if (!done[groupeName]) {
            groupesSuivis.push({name: groupeName, member: true})
            done[groupeName] = true
          }
        })
        $accessControl.getCurrentUserGroupesSuivis(context).forEach(function (groupeName) {
          if (!done[groupeName]) {
            // on ajoute les urls pour ne plus suivre
            groupesSuivis.push({name: groupeName, follower: true})
            done[groupeName] = true
          }
        })
        $json.sendOk(context, {groupesSuivis: groupesSuivis})
      }).catch(function (error) {
        console.error(error)
        $json.sendError(context, 'Une erreur est survenue dans la récupération des groupes')
      })
    })
    controller.options('suivis', optionsOk)

    /**
     * Récupère la liste des groupes ouverts
     * @route GET /api/groupes/ouverts
     */
    controller.get('ouverts', function (context) {
      var pid = $accessControl.getCurrentUserPid(context)
      if (pid) {
        flow().seq(function () {
          $groupeRepository.loadOuvert(this)
        }).seqEach(function (groupe) {
          addGestionnairesNames(context, groupe, this)
        }).seq(function (groupesOuverts) {
          $json.sendOk(context, {groupes: groupesOuverts})
        }).catch(function (error) {
          console.error(error)
          $json.sendError(context, 'Une erreur est survenue lors de la récupération des groupes ouverts')
        })
      } else {
        $json.denied(context, "Il faut s'authentifier avant pour récupérer les groupes ouverts")
      }
    })
    controller.options('ouverts', optionsOk)

    /**
     * Récupère la liste des groupes publics
     * @route GET /api/groupes/publics
     */
    controller.get('publics', function (context) {
      var pid = $accessControl.getCurrentUserPid(context)
      if (pid) {
        flow().seq(function () {
          $groupeRepository.loadPublic(this)
        }).seqEach(function (groupe) {
          addGestionnairesNames(context, groupe, this)
        }).seq(function (groupesPublics) {
          $json.sendOk(context, {groupes: groupesPublics})
        }).catch(function (error) {
          console.error(error)
          $json.sendError(context, 'Une erreur est survenue lors de la récupération des groupes publics')
        })
      } else {
        $json.denied(context, "Il faut s'authentifier avant pour récupérer les groupes ouverts")
      }
    })
    controller.options('publics', optionsOk)
  })
}
