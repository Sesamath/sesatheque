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
const Ref = require('../../constructors/Ref')
const {getNormalizedGrabOptions} = require('../lib/grab')
const {update: urlUpdate} = require('../lib/url')
const baseUrl = require('../lib/config')

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
    const {addGroup, ignoreGroup, isFollowed, isManaged, quitGroup} = helper
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
     * Ajoute les ressources publiées dans le groupe et les noms des gestionnaires du groupe
     * @param context
     * @param groupe
     */
    const addInfos = (context, groupe) => {
      const data = groupe
      const {limit, skip} = getNormalizedGrabOptions(context.get)
      flow().seq(function () {
        // faut ajouter la liste des ressources publiées dans ce groupe
        initRessourceRepository()
        $ressourceRepository.fetchPublishedInGroup(groupe.nom, {limit, skip}, this)
      }).seq(function ({ressources}) {
        data.ressources = ressources.map(r => new Ref(r))
        // on ajoute les liens suivant et précédent
        const url = `${baseUrl}api/liste/groupe/${encodeURIComponent(data.nom)}`
        if (ressources.length === limit) {
          data.ressourcesNextUrl = `${url}?limit=${limit}&skip=${skip + limit}`
        }
        if (skip > 0) {
          data.ressourcesPreviousUrl = `${url}?limit=${limit}&skip=${Math.max(0, skip - limit)}`
        }
        // on veut aussi les noms des gestionnaires
        if (!groupe.gestionnaires || !groupe.gestionnaires.length) return this(null, {})
        $personneRepository.loadByPids(groupe.gestionnaires, this)
      }).seq(function ({personnes, missing}) {
        if (personnes && personnes.length) {
          groupe.gestionnairesNames = personnes.map(p => `${p.prenom} ${p.nom}`)
        }
        if (missing && missing.length) {
          if (!groupe.warnings) groupe.warnings = []
          groupe.warnings = groupe.warnings.concat(missing.map(pid => `Le gestionnaire ${pid} n’existe plus`))
        }
        context.rest(groupe)
      }).catch(function (error) {
        context.restKo(error)
      })
    }

    /**
     * Crée ou update un groupe
     * @route POST /api/groupe
     */
    controller.post('', function (context) {
      const data = context.post
      const myPid = $accessControl.getCurrentUserPid(context)
      const sendInternalError = (error) => $json.sendError(context, error)
      if (!myPid) return $json.denied(context, 'Vous devez être authentifié pour créer des groupes')
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
            if (!data.gestionnaires.includes(myPid)) groupeBdd.gestionnaires = groupeBdd.gestionnaires.filter(pid => pid !== myPid)
            // le reste ne peut être que des ajouts
            data.gestionnaires.forEach(g => {
              if (!groupeBdd.gestionnaires.includes(g)) groupeBdd.gestionnaires.push(g)
            })
          }
          groupeBdd.store(this)
        }).seq(function (groupe) {
          $json.sendOk(context, groupe)
        }).catch(sendInternalError)

      // cas nouveau groupe
      } else {
        if (!$accessControl.hasGenericPermission('createGroupe', context)) {
          return $json.denied(context, 'Vous n’avez pas les droits suffisants pour créer un groupe')
        }
        const groupe = {
          nom: data.nom,
          ouvert: data.hasOwnProperty('ouvert') ? Boolean(data.ouvert) : false,
          public: data.hasOwnProperty('public') ? Boolean(data.public) : true,
          gestionnaires: [myPid]
        }
        EntityGroupe.create(groupe).store((error, groupe) => {
          if (error) return $json.sendError(context, error)
          $json.sendOk(context, groupe)
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
        if (isFullFormat) addInfos(context, groupe)
        else $json.sendOk(context, groupe)
      }).catch(function (error) {
        $json.sendError(context, error)
      })
    })

    /**
     * Récupère les détails d'un groupe
     * @route GET /api/groupe/decrire/:nom
     */
    controller.get('byNom/:nom', function (context) {
      const {nom} = context.arguments
      const isFullFormat = context.get.format === 'full'
      flow().seq(function () {
        $groupeRepository.loadByNom(nom, this)
      }).seq(function (groupe) {
        if (!groupe) return $json.notFound(context, `Le groupe « ${nom} » n’existe pas`)
        if (isFullFormat) addInfos(context, groupe)
        else $json.sendOk(context, groupe)
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
                $json.sendError(context, error)
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
      var nom = context.arguments.nom.toLowerCase()
      flow().seq(function () {
        $groupeRepository.loadByNom(nom, this)
      }).seq(function (grp) {
        var deniedMsg = 'Le groupe ' + nom + " n’existe pas ou vous n'en faite pas partie"
        if (grp && isFollowed(context, nom)) ignoreGroup(context, nom, this)
        else this(deniedMsg)
      }).seq(function () {
        $json.sendOk(context)
      }).catch(function (error) {
        $json.sendError(context, error)
      })
    })

    /**
     * Retire le groupe au user courant
     * @route GET /groupe/quitter/:nom
     */
    controller.get('quitter/:nom', function (context) {
      var nom = context.arguments.nom.toLowerCase()
      flow().seq(function () {
        $groupeRepository.loadByNom(nom, this)
      }).seq(function (grp) {
        var deniedMsg = 'Le groupe ' + nom + " n’existe pas ou vous n'en faite pas partie"
        if (grp && $accessControl.isGroupeMembre(context, nom)) quitGroup(context, nom, this)
        else this(deniedMsg)
      }).seq(function () {
        $json.send(context, 'Vous avez quitté le groupe ' + nom)
      }).catch(function (error) {
        $json.sendError(context, error)
      })
    })
  })
}
