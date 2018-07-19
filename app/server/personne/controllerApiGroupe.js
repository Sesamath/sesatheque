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
  component.controller('api/groupe', function (EntityGroupe, $groupeRepository, $accessControl, $json, $personneRepository) {
    const helper = require('./controllerGroupeHelper')($accessControl, $groupeRepository, $personneRepository)
    const {addGroup, addInfos, ignoreGroup, isManaged, joinGroup, quitGroup, followGroup} = helper
    /**
     * Controleur de la route /api/groupe/
     * @Controller controllerApiGroupe
     */
    const controller = this

    let $ressourceRepository
    const initRessourceRepository = () => {
      if (!$ressourceRepository) $ressourceRepository = lassi.service('$ressourceRepository')
    }

    /**
     * Crée ou update un groupe
     * @route POST /api/groupe
     */
    controller.post('', function (context) {
      const data = context.post
      const myOid = $accessControl.getCurrentUserOid(context)
      const sendInternalError = (error) => $json.sendError(context, error)
      if (!myOid) return $json.denied(context, 'Vous devez être authentifié pour créer des groupes')
      if (!data.nom) return $json.sendError(context, 'Impossible de créer un groupe sans nom')
      // on init les éventuelles valeurs manquantes par nos valeurs par défaut

      // cas modif
      if (data.oid) {
        // update, faut aller voir en base
        flow().seq(function () {
          EntityGroupe.match('oid').equals(data.oid).grabOne(this)
        }).seq(function (groupeBdd) {
          if (!groupeBdd) return $json.notFound(context, `Le groupe d’identifiant ${data.oid} n’existe pas`)
          if (!isManaged(context, groupeBdd)) return $json.denied(context, 'Vous n’êtes pas gestionnaire de ce groupe et ne pouvez pas le modifier')

          // si le nom change pas on passe à la suite
          if (!data.nom || data.nom === groupeBdd.nom) return this(null, groupeBdd)

          // mais sinon faut répercuter partout
          const nextStep = this
          flow().seq(function () {
            $personneRepository.renameGroup(groupeBdd.nom, data.nom, this)
          }).seq(function () {
            initRessourceRepository()
            $ressourceRepository.renameGroup(groupeBdd.nom, data.nom, this)
          }).seq(function () {
            // maj personne & ressource ok, on peut changer le nom du groupe
            groupeBdd.nom = data.nom
            nextStep(null, groupeBdd)
          }).catch(sendInternalError)

        // on peut passer aux autres propriétés du groupe
        }).seq(function (groupeBdd) {
          // les booléens
          if (data.hasOwnProperty('ouvert')) groupeBdd.ouvert = Boolean(data.ouvert)
          if (data.hasOwnProperty('public')) groupeBdd.public = Boolean(data.public)
          // description
          if (data.hasOwnProperty('description')) groupeBdd.description = data.description
          // et les gestionnaires
          if (Array.isArray(data.gestionnaires) && data.gestionnaires.length) {
            // le seul gestionnaire qu'on peut enlever est soi-même
            if (!data.gestionnaires.includes(myOid)) groupeBdd.gestionnaires = groupeBdd.gestionnaires.filter(oid => oid !== myOid)
            // le reste ne peut être que des ajouts
            data.gestionnaires.forEach(g => {
              if (!groupeBdd.gestionnaires.includes(g)) groupeBdd.gestionnaires.push(g)
            })
          }
          groupeBdd.store(this)
        }).seq(function (groupe) {
          addInfos(context, groupe, this)
        }).seq(function (groupe) {
          $json.sendOk(context, groupe)
        }).catch(sendInternalError)

      // cas nouveau groupe
      } else {
        if (!$accessControl.hasGenericPermission('createGroupe', context)) {
          return $json.denied(context, 'Vous n’avez pas les droits suffisants pour créer un groupe')
        }
        const gestionnaires = data.gestionnaires || []
        if (!gestionnaires.includes(myOid)) gestionnaires.push(myOid)

        const groupe = {
          nom: data.nom,
          ouvert: data.hasOwnProperty('ouvert') ? Boolean(data.ouvert) : false,
          public: data.hasOwnProperty('public') ? Boolean(data.public) : true,
          description: data.description,
          gestionnaires
        }
        // il manque une clé unique sur le nom?
        EntityGroupe.create(groupe).store((error, groupe) => {
          if (error) return $json.sendError(context, error)

          flow().seq(function () {
            joinGroup(context, myOid, groupe.nom, this)
          }).seq(function () {
            followGroup(context, myOid, groupe.nom, this)
          }).seq(function () {
            addInfos(context, groupe, this)
          }).seq(function () {
            $json.sendOk(context, groupe)
          }).catch(sendInternalError)
        })
      }
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
        if (isFullFormat) addInfos(context, groupe, this)
        else this(null, groupe)
      }).seq(function (groupe) {
        $json.sendOk(context, groupe)
      }).catch(function (error) {
        $json.sendError(context, error)
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
        if (isFullFormat) addInfos(context, groupe, this)
        else this(null, groupe)
      }).seq(function (groupe) {
        $json.sendOk(context, groupe)
      }).catch(function (error) {
        $json.sendError(context, error)
      })
    })

    /**
     * Create un groupe en donnant seulement le nom
     * @route GET /api/groupe/ajouter/:nom
     */
    controller.get('ajouter/:nom', function (context) {
      /* var reqHttp = context.request.method +' ' +context.request.parsedUrl.pathname +(context.request.parsedUrl.search||'')
       log.error(new Error('une trace pour ' +reqHttp)) */
      if (context.perf) {
        var msg = 'start-pers-' + context.post.id
        log.perf(context.response, msg)
      }
      if ($accessControl.hasGenericPermission('createGroupe', context)) {
        const nom = context.arguments.nom.toLowerCase()
        $groupeRepository.loadByNom(nom, function (error, groupeBdd) {
          if (error) {
            $json.sendError(context, new Error('Erreur interne (impossible de vérifier l’existence préalable du groupe)'))
          } else if (groupeBdd) {
            $json.sendError(context, 'Le groupe ' + nom + ' existe déjà')
          } else {
            // par défaut fermé et public
            var groupe = EntityGroupe.create({
              nom: nom,
              ouvert: false,
              public: true,
              gestionnaires: [$accessControl.getCurrentUserPid(context)]
            })
            groupe.store(function (error, groupeBdd) {
              if (error) {
                $json.spersonneRepositoryendError(context, error)
              } else if (groupeBdd && groupeBdd.oid) {
                addGroup(context, nom, false, function (error, personne) {
                  if (!error && personne) $json.sendOk(context)
                  else $json.sendError(context, new Error('Erreur interne (enregistrement des modifications sur la personne)'))
                })
              } else {
                $json.sendError(context, new Error("Erreur interne (groupe.store ne renvoie pas d'objet avec oid)"))
              }
            })
          }
        })
      } else {
        $json.denied(context)
      }
    })

    /**
     * Ne plus suivre le groupe
     * @route GET /api/groupe/ignorer/:nom
     */
    controller.get('ignorer/:nom', function (context) {
      const nom = context.arguments.nom.toLowerCase()
      const myOid = $accessControl.getCurrentUserOid(context)
      if (!myOid) return $json.denied(context, 'Il faut être authentifié pour ignorer un groupe')
      ignoreGroup(context, myOid, nom, (error) => {
        if (error) return $json.sendError(context, error)

        return $json.sendOk(context)
      })
    })

    /**
     * Retire le groupe au user courant
     * @route GET /groupe/quitter/:nom
     */
    controller.get('quitter/:nom', function (context) {
      const nom = context.arguments.nom.toLowerCase()
      const myOid = $accessControl.getCurrentUserOid(context)
      if (!myOid) return $json.denied(context, 'Il faut être authentifié pour quitter un groupe')
      quitGroup(context, myOid, nom, (error) => {
        if (error) return $json.sendError(context, error)

        return $json.sendOk(context)
      })
    })

    /**
     * Abonne le user courant au groupe
     * @route GET /groupe/suivre/:nom
     */
    controller.get('suivre/:nom', function (context) {
      const nom = context.arguments.nom.toLowerCase()
      const myOid = $accessControl.getCurrentUserOid(context)
      if (!myOid) return $json.denied(context, 'Il faut être authentifié pour suivre un groupe')
      let groupe
      flow().seq(function () {
        $groupeRepository.loadByNom(nom, this)
      }).seq(function (grp) {
        var deniedMsg = `Le groupe ${nom} n’existe pas ou vous n'avez pas droits pour le suivre`
        if (grp && (isManaged(context, grp) || grp.ouvert)) {
          groupe = grp
          followGroup(context, myOid, nom, this)
        } else this(deniedMsg)
      }).seq(function () {
        addInfos(context, groupe, this)
      }).seq(function () {
        $json.sendOk(context, groupe)
      }).catch(function (error) {
        $json.sendError(context, error)
      })
    })

    /**
     * Ajoute le user courant au groupe
     * @route GET /groupe/rejoindre/:nom
     */
    controller.get('rejoindre/:nom', function (context) {
      const nom = context.arguments.nom.toLowerCase()
      const myOid = $accessControl.getCurrentUserOid(context)
      if (!myOid) return $json.denied(context, 'Il faut être authentifié pour rejoindre un groupe')
      let groupe
      flow().seq(function () {
        $groupeRepository.loadByNom(nom, this)
      }).seq(function (grp) {
        var deniedMsg = `Le groupe ${nom} n’existe pas ou vous n'avez pas les droits pour le rejoindre`
        if (grp && (isManaged(context, grp) || grp.public)) {
          groupe = grp
          joinGroup(context, myOid, nom, this)
        } else this(deniedMsg)
      }).seq(function () {
        addInfos(context, groupe, this)
      }).seq(function () {
        $json.sendOk(context, groupe)
      }).catch(function (error) {
        $json.sendError(context, error)
      })
    })

    /**
     * Efface un groupe d'après son nom, appellera denied ou sendJson avec error ou deleted:nom
     * @private
     * @param {Context} context
     * @param nom
     */
    function deleteAndSend (context, nom) {
      log.debug('dans cb api deleteGroupe ' + nom)
      const myOid = $accessControl.getCurrentUserOid(context)
      // faut charger le groupe pour vérifier si l'utilisateur est admin (elle est probablement en cache)
      $groupeRepository.loadByNom(nom, function (error, groupe) {
        if (error) return $json.sendError(context, error)
        if (!groupe) return $json.notFound(context, `Le groupe ${nom} n’existe pas`)
        if (!groupe.gestionnaires.includes(myOid)) return $json.denied(context, `Vous n’avez pas le droit de supprimer ce groupe`)
        flow().seq(function () {
          $groupeRepository.delete(nom, this)
        }).seq(function () {
          $personneRepository.removeGroup(nom, this)
        }).seq(function () {
          $json.sendOk(context, {deleted: nom})
        }).catch(function (error) {
          $json.sendError(context, error)
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
