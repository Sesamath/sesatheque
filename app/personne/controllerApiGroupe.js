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

var _ = require('lodash')
var flow = require('an-flow')

/**
 * Répond sur certaines requetes OPTIONS
 * @private
 * @param {Context} context
 */
function optionsOk (context) {
  context.next(null, 'OK') // ne pas renvoyer de chaîne vide sinon 404
}

module.exports = function (controller, EntityGroupe, $groupeRepository, $accessControl, $json, $personneRepository) {
  var h = require('./controllerGroupeHelper')($accessControl, $groupeRepository, $personneRepository)
  /**
   * Controleur de la route /api/groupe/
   * @Controller controllerApiGroupe
   */

  /**
   * Create un groupe
   * @route GET /api/groupe/add/:nom
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
      $groupeRepository.load(nom, function (error, groupeBdd) {
        if (error) {
          $json.sendError(context, new Error('Erreur interne (impossible de vérifier l’existence préalable du groupe)'))
        } else if (groupeBdd) {
          $json.sendError(context, 'Le groupe ' + nom + 'existait déjà')
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
              h.addGroup(context, nom, false, function (error, personne) {
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
      $groupeRepository.load(nom, this)
    }).seq(function (grp) {
      var deniedMsg = 'Le groupe ' + nom + " n'existe pas ou vous n'en faite pas partie"
      if (grp && h.isFollowed(context, nom)) h.ignoreGroup(context, nom, this)
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
      $groupeRepository.load(nom, this)
    }).seq(function (grp) {
      var deniedMsg = 'Le groupe ' + nom + " n'existe pas ou vous n'en faite pas partie"
      if (grp && $accessControl.isGroupeMembre(context, nom)) h.quitGroup(context, nom, this)
      else this(deniedMsg)
    }).seq(function () {
      $json.send(context, 'Vous avez quitté le groupe ' + nom)
    }).catch(function (error) {
      $json.sendError(context, error)
    })
  })

  /**
   * Récupère la liste des groupes dont on est admin
   * @route GET /api/groupe/admin
   */
  controller.get('admin', function (context) {
    var groupesAdmin = []
    var pid = $accessControl.getCurrentUserPid(context)
    if (pid) {
      flow().seq(function () {
        $groupeRepository.getListManagedBy(pid, this)
      }).seq(function (groupesManaged) {
        if (groupesManaged && groupesManaged.length) {
          groupesManaged.forEach(function (groupe) {
            groupesAdmin.push({ name: groupe.nom, admin: true })
          })
        }
        $json.sendOk(context, {groupesAdmin: groupesAdmin})
      }).catch(function (error) {
        console.error(error)
        $json.sendError(context, 'Une erreur est survenue dans la récupération des groupes')
      })
    } else {
      $json.denied(context, "Il faut s'authentifier avant pour récupérer ses groupes")
    }
  })
  controller.options('admin', optionsOk)

  /**
   * Récupère la liste des groupes dont on est membre
   * @route GET /api/groupe/membre
   */
  controller.get('membre', function (context) {
    var groupesMembre = []
    var done = {}
    var pid = $accessControl.getCurrentUserPid(context)
    if (pid) {
      flow().seq(function () {
        $groupeRepository.getListManagedBy(pid, this)
      }).seq(function (groupesManaged) {
        if (groupesManaged && groupesManaged.length) {
          groupesManaged.forEach(function (groupe) {
            groupesMembre.push({ name: groupe.nom, admin: true })
            done[ groupe.nom ] = true
          })
        }
        $accessControl.getCurrentUserGroupesMembre(context).forEach(function (groupeName) {
          if (!done[ groupeName ]) {
            groupesMembre.push({ name: groupeName, member: true })
            done[ groupeName ] = true
          }
        })
        $json.sendOk(context, {groupesMembre: groupesMembre})
      }).catch(function (error) {
        console.error(error)
        $json.sendError(context, 'Une erreur est survenue dans la récupération des groupes')
      })
    } else {
      $json.denied(context, "Il faut s'authentifier avant pour récupérer ses groupes")
    }
  })
  controller.options('membre', optionsOk)

  /**
   * Récupère la liste des groupes suivis
   * @route GET /api/groupe/suivis
   */
  controller.get('suivis', function (context) {
    var groupesSuivis = []
    var done = {}
    var pid = $accessControl.getCurrentUserPid(context)
    if (pid) {
      flow().seq(function () {
        $groupeRepository.getListManagedBy(pid, this)
      }).seq(function (groupesManaged) {
        if (groupesManaged && groupesManaged.length) {
          groupesManaged.forEach(function (groupe) {
            groupesSuivis.push({ name: groupe.nom, admin: true })
            done[ groupe.nom ] = true
          })
        }
        $accessControl.getCurrentUserGroupesMembre(context).forEach(function (groupeName) {
          if (!done[ groupeName ]) {
            groupesSuivis.push({ name: groupeName, member: true })
            done[ groupeName ] = true
          }
        })
        $accessControl.getCurrentUserGroupesSuivis(context).forEach(function (groupeName) {
          if (!done[ groupeName ]) {
            // on ajoute les urls pour ne plus suivre
            groupesSuivis.push({ name: groupeName, follower: true })
            done[ groupeName ] = true
          }
        })
        $json.sendOk(context, { groupesSuivis: groupesSuivis })
      }).catch(function (error) {
        console.error(error)
        $json.sendError(context, 'Une erreur est survenue dans la récupération des groupes')
      })
    } else {
      $json.denied(context, "Il faut s'authentifier avant pour récupérer ses groupes suivis")
    }
  })
  controller.options('suivis', optionsOk)
}
