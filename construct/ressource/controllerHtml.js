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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

/**
 * Le controleur html du composant ressource
 * @param {Controller} controller
 * @param $ressourceRepository
 * @param $ressourceConverter
 * @param $accessControl
 */
module.exports = function (controller, $ressourceRepository, $ressourceConverter, $accessControl, $views, $routes, $settings) {
  var _ = require('lodash')
  //var tools = require('../tools')
  //var seq = require('seq')

  /**
   * Vérifie que le token du post correspond à celui en session
   * @param context
   * @param next
   */
  function checkToken(context, next) {
    if (!context.post.token || context.post.token !== context.session.token) {
      if (context.session.token) delete context.session.token
      log.debug('pb de token', context.post)
      $views.printError(context, "Jeton invalide (probablement une deuxième soummission du formulaire)", 403)
    } else next()
  }

  /**
   * Vérifie que l'on a un user en session, affiche une 401 sinon
   * @param context
   * @returns {boolean} true si authentifié
   */
  function checkAuthenticated(context) {
    if (!context.session || !context.session.user) {
      $views.printError(context, "Authentification requise", 401)
      return false
    }
    return true
  }

  // describe
  controller.get($routes.get('describe', ':oid'), function (context) {
    var oid = context.arguments.oid
    $ressourceRepository.load(oid, function (error, ressource) {
      $views.printForRead(error, ressource, context, 'describe')
    })
  })

// describeByOrigin
  controller.get($routes.get('describe', ':origine', ':idOrigine'), function (context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      $views.printForRead(error, ressource, context, 'describe')
    })
  })

// display : Voir la ressource pleine page (pour iframe)
  controller.get($routes.get('display', ':oid'), function (context) {
    var oid = context.arguments.oid
    log("appel de l'action display pour " +oid)
    /* ça fonctionne en affichant bien l'erreur sans repasser une 2e fois ici
    printForRead(new Error("display " +oid), null, context, 'display', {$layout: './../static/views/layout-iframe'})
    return */
    $ressourceRepository.load(oid, function (error, ressource) {
      log("load de display")
      $views.printForRead(error, ressource, context, 'display', {$layout: '../../static/views/layout-iframe'})
    })
  })

// displayByOrigin : Voir la ressource pleine page (pour iframe)
  controller.get($routes.get('display', ':origine', ':idOrigine'), function (context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      $views.printForRead(error, ressource, context, 'display', {$layout: '../../static/views/layout-iframe'})
    })
  })

// preview : Voir la ressource dans le site
  controller.get($routes.get('preview', ':oid'), function (context) {
    var oid = context.arguments.oid
    $ressourceRepository.load(oid, function (error, ressource) {
      $views.printForRead(error, ressource, context, 'display')
    })
  })

  // previewByOrigin
  controller.get($routes.get('preview', ':origine', ':idOrigine'), function (context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      $views.printForRead(error, ressource, context, 'display')
    })
  })

// Ajouter, affichage du form de saisie
  controller.get($routes.get('add'), function (context) {
    if (checkAuthenticated(context)) {
      $accessControl.checkPermission('create', context, null, function () {
        var options = {$metas: {title: 'Ajouter une ressource'}}
        $views.printForm(null, null, context, options)
      })
    }
  })

// Ajouter, traitement du post
  controller.post($routes.get('add'), function (context) {
    log('ctrl add')
    function rePrintForm(error, ressource) {
      var options = {$metas: {title: 'Ajouter une ressource'}}
      $views.printForm(error, ressource, context, options)
    }

    checkToken(context, function () {
      // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
      // et rediriger vers le describe ou vers le form avec les erreurs
      //log.debug('post dans add', controller.post);
      $ressourceConverter.valideRessourceFromPost(context.post, false, function (error, ressource) {
        if (error || !_.isEmpty(ressource.warnings)) rePrintForm(error, ressource)
        else {
          $ressourceRepository.write(ressource, function (error, ressource) {
            if (error || !_.isEmpty(ressource.warnings)) {
              // là c'est un bug dans notre code
              log.error(new Error("on a une erreur au write mais pas au valide précédent"))
              rePrintForm(error, ressource)
            } else {
              log.debug("Après le save on récupère l'oid " + ressource.oid + ", on lance le redirect")
              context.redirect($routes.getAbs('describe', ressource.oid))
            }
          }) // write
        }
      }) // valideRessourceFromPost
    }) // checkToken
  })

  // Modifier, affichage du form
  controller.get($routes.get('edit', ':oid'), function (context) {
    if (checkAuthenticated(context)) {
      var oid = context.arguments.oid
      $ressourceRepository.load(oid, function (error, ressource) {
        $accessControl.checkPermission('update', context, ressource, function () {
          var options = {$metas: {title: 'Modifier la ressource : ' + ressource.titre}}
          $views.printForm(error, ressource, context, options)
        })
      })
    }
  })

  // Modifier, traitement du form
  controller.post($routes.get('edit', ':oid'), function (context) {
    function rePrintForm(error, ressource) {
      if (error) log.debug('une erreur au post update', error)
      else log.debug('des warnings au post update', ressource.warnings)
      var options = {$metas: {title: 'Modifier la ressource : ' + ressource.titre}}
      $views.printForm(error, ressource, context, options)
    }

    checkToken(context, function () {
      // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
      // et rediriger vers le describe ou vers le form avec les erreurs
      //log.debug('post dans add', controller.post);
      $ressourceConverter.valideRessourceFromPost(context.post, false, function (error, ressource) {
        if (error || !_.isEmpty(ressource.warnings)) rePrintForm(error, ressource)
        else {
          $ressourceRepository.write(ressource, function (error, ressource) {
            if (error || !_.isEmpty(ressource.warnings)) {
              rePrintForm(error, ressource)
            } else {
              var url = $routes.getAbs('describe', ressource)
              log.debug("update " + ressource.oid + " ok, on lance le redirect vers " +url)
              context.redirect(url)
            }
          })
        }
      })
    })
  })

  // Delete, demande de confirmation
  controller.get($routes.get('delete', ':oid'), function (context) {
    var oid = context.arguments.oid
    $ressourceRepository.load(oid, function (error, ressource) {
      $accessControl.checkPermission('delete', context, ressource, function () {
        var token = $ressourceConverter.getToken()
        var options = {
          $metas : {title: 'Supprimer la ressource : ' + ressource.titre},
          contentBloc: {
            $view: 'delete',
            /* token : {
              name  : 'token',
              value : token,
              hidden: true
            } */
          }
        }
        context.session.token = token
        // on mettait ça du temps où y'avait pas besoin de charger la ressource pour l'effacer
        // on le garde pour avoir le titre en cas d'effacements concurrents
        context.session.currentDelete = {
          oid : ressource.oid,
          titre : ressource.titre
        }
        // la vue delete inclue la vue describe
        $views.printForRead(error, ressource, context, 'describe', options)
      })
    })
  })

  // Delete, traitement du post
  controller.post($routes.get('delete', ':oid'), function (context) {
    var oid = context.arguments.oid
    var data = {
      $views : __dirname + '/views',
      $metas : {title: 'Suppression de ressource'},
      $layout: '../../static/views/layout-page',
      contentBloc: {$view: 'delete'}
    }
    if (context.session.currentDelete && oid > 0 && context.session.currentDelete.oid == oid) {
      // on peut effacer
      var titre = context.session.currentDelete.titre
      delete context.session.currentDelete
      checkToken(context, function () {
        // de toute façon lassi demande de charger la ressource pour l'effacer, on le fait ici pour vérifier les droits
        $ressourceRepository.load(oid, function (error, ressource) {
          if (error) {
            log.error(error)
            data.contentBloc.error = "Impossible d'accéder à la ressource " +titre +' (' +oid +")"
          } else if (ressource) {
            if ($accessControl.hasPermission('delete', context, ressource)) {
              $ressourceRepository.delete(ressource, function (error) {
                if (error) {
                  log.error(error)
                  data.contentBloc.error = "Erreur lors de la suppression de la ressource " + titre + ' (' + oid + ')'
                } else {
                  data.contentBloc.deletedOid = oid
                  data.contentBloc.titre = titre
                }
                context.html(data)
              })
            } else {
              log.debug("droits insuffisant pour effacer la ressource " +oid)
              data.contentBloc.error = "droits insuffisant pour effacer la ressource "  + titre + ' (' + oid + ')'
              context.html(data)
            }
          } else {
            data.contentBloc.error = "La ressource "  + titre + ' (' + oid + ") n'existait pas"
            context.html(data)
          }
        })
      })
    } else {
      data.contentBloc.error = "Post avec informations manquantes"
      context.html(data)
    }
  })

  // form de recherche
  controller.get($routes.get('search'), function (context) {
    $views.printSearchForm(context)
  })

  // résultats
  controller.post($routes.get('search'), function (context) {
    $views.printSearchForm(context)
  })

  /**
   * Liste d'après le critère passé en 1er param (puis valeur, offset & nb)
   * Ne remonte que les ressources publiques
   * SELECT _string, COUNT(*) AS nb  FROM ressource_index WHERE name = 'typeTechnique' GROUP BY _string
   */
  controller.get('by/:index/:value/:start/:nb', function (context) {
    log.debug('liste avec les args', context.arguments)
    var index = context.arguments.index
    var value = context.arguments.value
    var options = {
      filters: [{index: index, values: [value]}],
      orderBy: 'oid',
      start  : parseInt(context.arguments.start),
      nb     : parseInt(context.arguments.nb)
    }
    var visibilite = 'public'
    // avec une exception pour l'admin qui peut passer ?all=1
    if (context.get.all && context.session.user && context.session.user.roles && context.session.user.roles.admin)
      visibilite = "tout"
    $ressourceRepository.getListe(visibilite, context, options, function (error, ressources) {
      var data = $views.getDefaultData('liste')
      data.$metas.title = 'Résultats de la recherche'
      log.debug('liste avec les options', options)
      log.debug('qui remonte', ressources)
      if (error) data.contentBloc.error = error.toString()
      else data.contentBloc.ressources = $ressourceConverter.addUrlsToList(ressources)
      context.html(data)
    })
  })
}
