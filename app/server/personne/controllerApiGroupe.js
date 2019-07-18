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
  component.controller('api/groupe', function (EntityGroupe, $groupeRepository, $accessControl, $json, $personneRepository, $groupe, $session) {
    // les méthodes de $groupe qui nous intéressent
    const {addGestionnairesNames, followGroup, ignoreGroup, isManaged, isMemberOf, joinGroup, joinAndFollowGroup, quitGroup} = $groupe

    /**
     * Controleur de la route /api/groupe/
     * @Controller controllerApiGroupe
     */
    const controller = this

    let $ressourceRepository

    /**
     * Crée ou update un groupe
     * @route POST /api/groupe
     */
    controller.post('', function (context) {
      const data = context.post
      const myOid = $accessControl.getCurrentUserOid(context)
      const sendInternalError = (error) => $json.sendKo(context, error)

      // checks de base
      if (!myOid) return $json.denied(context, 'Vous devez être authentifié pour créer des groupes')
      if (!data.nom) return $json.sendKo(context, 'Impossible de créer un groupe sans nom')
      data.nom = data.nom.trim()
      if (!data.oid && !$accessControl.hasGenericPermission('createGroupe', context)) return $json.denied(context, 'Vous n’avez pas les droits suffisants pour créer un groupe')

      flow().seq(function () {
        if (data.oid) return EntityGroupe.match('oid').equals(data.oid).grabOne(this)
        // à la création on cherche d'après le nom pour vérifier qu'il n'existe pas
        EntityGroupe.match('nom').equals(data.nom).grabOne(this)
      }).seq(function (groupeBdd) {
        const nextStep = this
        if (data.oid) {
          if (!groupeBdd) return $json.notFound(context, `Le groupe d’identifiant ${data.oid} n’existe pas`)
          if (!isManaged(context, groupeBdd)) return $json.denied(context, 'Vous n’êtes pas gestionnaire de ce groupe et ne pouvez pas le modifier')

          // si le nom change pas on passe à la suite
          const oldName = groupeBdd.nom
          const newName = data.nom
          if (!newName || newName === oldName) return nextStep(null, groupeBdd)

          // mais sinon faut répercuter partout
          flow().seq(function () {
            $personneRepository.renameGroup(oldName, newName, this)
          }).seq(function () {
            $session.renameGroup(context, oldName, newName)
            if (!$ressourceRepository) $ressourceRepository = lassi.service('$ressourceRepository')
            $ressourceRepository.renameGroup(oldName, newName, this)
          }).seq(function () {
            // maj personne & ressource ok, on peut changer le nom du groupe
            groupeBdd.nom = newName
            nextStep(null, groupeBdd)
          }).catch(sendInternalError)
          // fin rename group
        } else {
          if (groupeBdd) {
            return $json.sendKo(context, `Le groupe « ${data.nom} » existe déjà`)
          }
          const groupe = {
            nom: data.nom,
            gestionnaires: [myOid] // à la création c'est imposé
          }
          nextStep(null, EntityGroupe.create(groupe))
        }

      // on peut passer aux autres propriétés du groupe
      }).seq(function (groupe) {
        // les booléens
        if (data.hasOwnProperty('ouvert')) groupe.ouvert = Boolean(data.ouvert)
        if (data.hasOwnProperty('public')) groupe.public = Boolean(data.public)
        // description
        if (data.hasOwnProperty('description')) groupe.description = data.description
        // et les gestionnaires à ajouter éventuellement, on shunt si les deux champs sont vides
        // (si seul l'un des deux est vide ça tentera le chargement et renverra une erreur)
        if (!data.newGestionnairePid && !data.newGestionnaireNom) return this(null, groupe)
        // on va chercher l'oid de ce nouveau gestionnaire
        $personneRepository.loadByPidAndNom(data.newGestionnairePid, data.newGestionnaireNom, (error, personne) => {
          if (error) return this(error)
          if (!groupe.gestionnaires.includes(personne.oid)) groupe.gestionnaires.push(personne.oid)
          this(null, groupe)
          // else faudrait ajouter un warning, mais le front redirige s'il récupère du 200, on laisse tomber
        })
      }).seq(function (groupe) {
        groupe.store(this)
      }).seq(function (groupe) {
        // à la création, faut imposer joinAndFollow + ajouter les gestionnairesNames
        // lors d'une modif faut ajouter les gestionnairesNames s'ils ont changé
        // vu que cette étape est assez rare on simplifie le back en renvoyant toujours tout
        // (le front pourra évoluer comme il veut sans répercussions ici)
        if (data.oid) return this(null, groupe)

        joinAndFollowGroup(context, groupe.nom, (error) => {
          if (error) return this(error)
          this(null, groupe)
        })
      }).seq(function (groupe) {
        addGestionnairesNames(context, groupe, this)
      }).seq(function (groupe) {
        $json.sendOk(context, groupe)
      }).catch(sendInternalError)
    })
    controller.options('', optionsOk)

    /**
     * Récupère un groupe (ce serait plus logique sur GET /api/groupe/:oid mais on a déjà plein de route /api/groupe/actionQcq)
     * @route GET /api/groupe/byId/:oid
     */
    controller.get(':oid', function (context) {
      const {oid} = context.arguments
      const isFullFormat = context.get.format === 'full'
      flow().seq(function () {
        $groupeRepository.load(oid, this)
      }).seq(function (groupe) {
        if (!groupe) return $json.notFound(context, `Le groupe d’identifiant ${oid} n’existe pas`)
        if (isFullFormat) addGestionnairesNames(context, groupe, this)
        else this(null, groupe)
      }).seq(function (groupe) {
        $json.sendOk(context, groupe)
      }).catch(function (error) {
        $json.sendKo(context, error)
      })
    })

    /**
     * Récupère les détails d'un groupe
     * @route GET /api/groupe/byNom/:nom
     */
    controller.get('byNom/:nom', function (context) {
      const {nom} = context.arguments
      const isFullFormat = context.get.format === 'full'
      flow().seq(function () {
        $groupeRepository.loadByNom(nom, this)
      }).seq(function (groupe) {
        if (!groupe) return $json.notFound(context, `Le groupe « ${nom} » n’existe pas`)
        if (isFullFormat) addGestionnairesNames(context, groupe, this)
        else this(null, groupe)
      }).seq(function (groupe) {
        $json.sendOk(context, groupe)
      }).catch(function (error) {
        $json.sendKo(context, error)
      })
    })

    /**
     * Create un groupe en donnant seulement le nom
     * @route GET /api/groupe/ajouter/:nom
     */
    controller.get('ajouter/:nom', function (context) {
      if (context.perf) {
        var msg = 'start-pers-' + context.post.id
        log.perf(context.response, msg)
      }
      if (!$accessControl.hasGenericPermission('createGroupe', context)) return $json.denied(context)
      const nom = context.arguments.nom
      flow().seq(function () {
        $groupeRepository.loadByNom(nom, this)
      }).seq(function (groupeBdd) {
        if (groupeBdd) return $json.sendKo(context, `Le groupe ${nom} existe déjà`)

        // on crée un nouveau groupe, par défaut fermé et public
        var groupe = EntityGroupe.create({
          nom,
          ouvert: false,
          public: true,
          gestionnaires: [$accessControl.getCurrentUserOid(context)]
        })
        groupe.store(this)
      }).seq(function (groupe) {
        joinAndFollowGroup(context, groupe.nom, this)
      }).seq(function () {
        $json.sendOk(context)
      }).catch(function (error) {
        $json.sendKo(context, error)
      })
    })

    /**
     * Ne plus suivre le groupe
     * @route GET /api/groupe/ignorer/:nom
     */
    controller.get('ignorer/:nom', function (context) {
      if (!$accessControl.isAuthenticated(context)) return $json.denied(context, 'Il faut être authentifié pour ignorer un groupe')
      ignoreGroup(context, context.arguments.nom, (error) => {
        if (error) return $json.sendKo(context, error)
        return $json.sendOk(context)
      })
    })

    /**
     * Retire le groupe au user courant
     * @route GET /groupe/quitter/:nom
     */
    controller.get('quitter/:nom', function (context) {
      if (!$accessControl.isAuthenticated(context)) return $json.denied(context, 'Il faut être authentifié pour quitter un groupe')
      quitGroup(context, context.arguments.nom, (error) => {
        if (error) return $json.sendKo(context, error)
        return $json.sendOk(context)
      })
    })

    /**
     * Abonne le user courant au groupe
     * @route GET /groupe/suivre/:nom
     */
    controller.get('suivre/:nom', function (context) {
      if (!$accessControl.isAuthenticated(context)) return $json.denied(context, 'Il faut être authentifié pour suivre un groupe')
      const nom = context.arguments.nom
      let groupe
      flow().seq(function () {
        $groupeRepository.loadByNom(nom, this)
      }).seq(function (grp) {
        if (!grp) return $json.sendKo(context, `Le groupe ${nom} n’existe pas`)
        if (!grp.public && !isManaged(context, grp)) return $json.sendKo(context, `Vous n’avez pas les droits suffisant pour suivre le groupe ${nom}`)
        groupe = grp
        followGroup(context, nom, this)
      }).seq(function () {
        addGestionnairesNames(context, groupe, this)
      }).seq(function () {
        $json.sendOk(context, groupe)
      }).catch(function (error) {
        $json.sendKo(context, error)
      })
    })

    /**
     * Ajoute le user courant au groupe
     * @route GET /groupe/rejoindre/:nom
     */
    controller.get('rejoindre/:nom', function (context) {
      if (!$accessControl.isAuthenticated(context)) return $json.denied(context, 'Il faut être authentifié pour rejoindre un groupe')
      const nom = context.arguments.nom
      let groupe
      flow().seq(function () {
        $groupeRepository.loadByNom(nom, this)
      }).seq(function (grp) {
        if (!grp) return $json.sendKo(context, `Le groupe ${nom} n’existe pas`)
        if (!grp.ouvert && !isMemberOf(context, grp) && !isManaged(context, grp)) return $json.sendKo(context, `Vous n’avez pas les droits suffisant pour rejoindre le groupe ${nom}`)
        groupe = grp
        joinGroup(context, nom, this)
      }).seq(function () {
        addGestionnairesNames(context, groupe, this)
      }).seq(function () {
        $json.sendOk(context, groupe)
      }).catch(function (error) {
        $json.sendKo(context, error)
      })
    })

    /**
     * Efface un groupe d'après son nom, appellera denied ou $json avec error ou deleted:nom
     * @private
     * @param {Context} context
     * @param nom
     */
    function deleteAndSend (context, nom) {
      log.debug('dans cb api deleteGroupe ' + nom)
      const myOid = $accessControl.getCurrentUserOid(context)
      // faut charger le groupe pour vérifier si l'utilisateur est admin (elle est probablement en cache)
      $groupeRepository.loadByNom(nom, function (error, groupe) {
        if (error) return $json.sendKo(context, error)
        if (!groupe) return $json.notFound(context, `Le groupe ${nom} n’existe pas`)
        if (!groupe.gestionnaires.includes(myOid)) return $json.denied(context, `Vous n’avez pas le droit de supprimer ce groupe`)
        flow().seq(function () {
          $groupeRepository.delete(nom, this)
        }).seq(function () {
          $personneRepository.removeGroup(nom, this)
        }).seq(function () {
          $json.sendOk(context, {deleted: nom})
        }).catch(function (error) {
          $json.sendKo(context, error)
        })
      })
    }

    /**
     * Répond ok pour les options delete
     * @private
     * @param {Context} context
     */
    function optionsDeleteOk (context) {
      context.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS')
      // context.setHeader('Access-Control-Allow-Headers', 'Origin,Content-Type,Accept')
      // et on laisse le middleware CORS faire son boulot
      context.next(null, 'OK') // ne pas renvoyer de chaîne vide sinon 404
    }

    /**
     * Delete groupe par nom, retourne {@link reponseDeleted}
     * @route DELETE /api/groupe/:
     * @param {String} nom
     */
    controller.delete(':nom', function (context) {
      deleteAndSend(context, context.arguments.nom)
    })

    controller.options(':nom', optionsDeleteOk)
  })
}
