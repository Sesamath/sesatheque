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
module.exports = function (controller, $ressourceRepository, $ressourceConverter, $accessControl, $routes, $settings) {
  var tools = require('../tools')
  var _ = require('lodash')
  var basePath = $settings.get('basePath', '/')

  // on désactive la compression dust en dev
  if ($settings.get('application.staging') !== 'production' &&
      lassi.transports.html.engine.disableWhiteSpaceCompression)
        lassi.transports.html.engine.disableWhiteSpaceCompression()
  
  function getDefaultData() {
    return {
      $views : __dirname + '/views',
      $metas : {
        css: ['/styles/ressources.css'],
        js : ['/vendors/requirejs/require.2.1.js']
      },
      $layout: '../../static/views/layout-page',
      contentBloc : {}
    }
  }

  function addJsVars(data, ressource) {
    if (ressource) {
      data.contentBloc.pluginBaseUrl = '/plugins/' + ressource.typeTechnique
      data.contentBloc.vendorsBaseUrl= '../../vendors'
      data.contentBloc.pluginName    = ressource.typeTechnique
      data.contentBloc.isDev         = ($settings.get('lassi.application.staging') !== 'production')
      // une string pour que dust le mette dans le source
      data.contentBloc.ressource     = tools.stringify(ressource)
    }
  }

  /**
   * Vérifie que le token du post correspond à celui en session
   * @param ctx
   * @param next
   */
  function checkToken(ctx, next) {
    if (!ctx.post.token || ctx.post.token !== ctx.session.token) {
      if (ctx.session.token) delete ctx.session.token
      log.debug('pb de token', ctx.post)
      ctx.accessDenied("Paramètres invalides")
    } else next()
  }

  /**
   * Vérifie que l'on a un user en session, affiche une 401 sinon
   * @param context
   * @returns {boolean} true si authentifié
   */
  function checkSession(context) {
    if (!context.session || !context.session.user) {
      var data = getDefaultData()
      data.error = "Authentification requise"
      context.status = 401
      context.html(data)

      return false
    }

    return true
  }

  /**
   * Init des liens de menu
   * @param context
   * @param data
   */
  function addMenu(context, data, ressource) {
    var id = ressource ? ressource.id : null
    // les liens du menu
    var links = []
    // lien ajout
    if ($accessControl.hasPermission('create', context)) {
      links.push(tools.link(basePath +$routes.get('add'), 'Ajouter une ressource'))
    }
    // si on est sur une ressource on ajoute les liens contextuels pour cette ressource (auxquels on a droit)
    if (id) {
      if ($accessControl.hasPermission('update', context, id))
        links.push(tools.link(basePath +$routes.get('edit', id), 'Modifier cette ressource'))
      if ($accessControl.hasPermission('delete', context))
        links.push(tools.link(basePath +$routes.get('delete', id), 'Supprimer cette ressource'))
      if ($accessControl.hasPermission('read', context, id)) {
        links.push(tools.link($routes.getAbs('preview', ressource), 'Voir la ressource'))
        links.push(tools.link($routes.getAbs('display', ressource), 'Voir la ressource (pleine page)'))
      }
    }
    data.menuBloc = {
      $view : 'menu',
      links : links
    }
  }

  /**
   * Prepare les data pour la vue dust et appelle html avec
   * @param error
   * @param ressource
   * @param context
   * @param view
   * @param options
   */
  function prepareAndSend(error, ressource, context, view, options) {
    var data = getDefaultData()
    // et la ressource (ou erreur)
    data.contentBloc = $ressourceConverter.getViewData(error, ressource)
    // pour display on ajoute les variables js
    if (view === 'display') addJsVars(data, ressource)
    // le menu pour tous, car preview utilise la vue display, petit gaspillage de data
    addMenu(context, data, ressource)
    data.contentBloc.$view = view
    // le titre
    data.$metas.title = (ressource && ressource.titre) ? ressource.titre : "Ressource introuvable"
    // et d'éventuels overrides
    if (options) tools.merge(data, options)
    // avant d'envoyer on vérifie que ça bégaye pas
    if (context.next) context.html(data)
    else log.error(new Error("prepareAndSend est appelé une 2e fois, on ignore"))
  }

  /**
   * Envoie la ressource à la vue
   * @param error
   * @param ressource
   * @param context
   * @param view
   * @param options
   */
  function printForRead(error, ressource, context, view, options) {
    if (error) {
      prepareAndSend(error, null, context, view, options)
    } else if (ressource) {
      $accessControl.checkPermission('read', context, ressource, function (ressource) {
        prepareAndSend(error, ressource, context, view, options)
      })
    } else {
      context.status = 404
      error = new Error("Ressource introuvable")
      prepareAndSend(error, null, context, view, options)
    }
  }

  /**
   * Prepare les data pour le form dust et appelle html avec
   * @param error
   * @param ressource
   * @param context
   * @param options
   */
  function printForm(error, ressource, context, options) {
    var data = getDefaultData()
    // on ajoute le menu
    addMenu(context, data, ressource)
    // les datas pour le form
    data.contentBloc = $ressourceConverter.getFormViewData(error, ressource)
    data.contentBloc.$view = 'form'
    // le titre
    data.$metas.title = 'Éditer une ressource'
    // et d'éventuels overrides
    if (options) tools.merge(data, options)
    // on ajoute le token, en session, pour éviter des post multiples et ne pas vérifier les droits au post
    context.session.token = data.contentBloc.token.value
    // avant d'envoyer
    context.html(data)
  }

  /**
   * Prepare les data pour le form dust et appelle html avec
   * @param context
   */
  function printSearchForm(context) {
    var data = getDefaultData()
    // on ajoute le menu
    addMenu(context, data, null)
    // les datas pour le form
    data.contentBloc = $ressourceConverter.getFormViewData(null, null)
    // on vire ou modifie ce qui nous intéresse pour la recherche
    var fd = data.contentBloc // raccourci d'écriture (form data)
    delete fd.id
    delete fd.version.value
    delete fd.version.readonly
    delete fd.parametres
    delete fd.dateCreation
    delete fd.dateMiseAJour
    delete fd.oid

    fd.typeTechnique.choices.unshift({label:'peu importe', value:''})
    data.contentBloc.$view = 'form'
    // le titre
    data.$metas.title = 'Recherche de ressources'
    // on ajoute le token, en session, pour éviter des post multiples et ne pas vérifier les droits au post
    context.session.token = data.contentBloc.token.value
    // avant d'envoyer
    context.html(data)
  }

  // describe
  controller.get($routes.get('describe', ':id'), function (context) {
    var id = context.arguments.id
    $ressourceRepository.load(id, function (error, ressource) {
      printForRead(error, ressource, context, 'describe')
    })
  })

// describeByOrigin
  controller.get($routes.get('describe ', ':origine', ':idOrigine'), function (context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      printForRead(error, ressource, context, 'describe')
    })
  })

// display : Voir la ressource pleine page (pour iframe)
  controller.get($routes.get('display', ':id'), function (context) {
    var id = context.arguments.id
    log("appel de l'action display pour " +id)
    /* ça fonctionne en affichant bien l'erreur sans repasser une 2e fois ici
    printForRead(new Error("display " +id), null, context, 'display', {$layout: './../static/views/layout-iframe'})
    return */
    $ressourceRepository.load(id, function (error, ressource) {
      log("load de display")
      printForRead(error, ressource, context, 'display', {$layout: '../../static/views/layout-iframe'})
    })
  })

// displayByOrigin : Voir la ressource pleine page (pour iframe)
  controller.get($routes.get('display', ':origine', ':idOrigine'), function (context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      printForRead(error, ressource, context, 'display', {$layout: '../../static/views/layout-iframe'})
    })
  })

// preview : Voir la ressource dans le site
  controller.get($routes.get('preview', ':id'), function (context) {
    var id = context.arguments.id
    $ressourceRepository.load(id, function (error, ressource) {
      printForRead(error, ressource, context, 'display')
    })
  })

// Create, affichage du form de saisie
  controller.get($routes.get('add'), function (context) {
    if (checkSession()) {
      $accessControl.checkPermission('create', context, null, function () {
        var options = {$metas: {title: 'Ajouter une ressource'}}
        printForm(null, null, context, options)
      })
    }
  })

// Create, traitement du post
  controller.post($routes.get('add'), function (context) {
    var ressource
    checkToken(context, function () {
      // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
      // et rediriger vers le describe ou vers le form avec les erreurs
      //log.debug('post dans add', controller.post);
      ressource = $ressourceConverter.getRessourceFromPost(context.post)
      // il validera avant d'enregistrer
      $ressourceRepository.write(ressource, function (error, ressource) {
        if (error || !_.isEmpty(ressource.warnings)) {
          // faut réafficher le form
          var options = {$metas: {title: 'Ajouter une ressource'}}
          printForm(error, ressource, context, options)
        } else {
          log.debug("Après le save on récupère l'id " + ressource.id + ", on lance le redirect")
          var prefix = basePath
          prefix += (ressource.restriction === 0) ? 'public' : 'ressource'
          context.redirect(prefix +$routes.get('describe', ressource.id))
        }
      }) // write
    }) // checkToken
  })

// Uptate, affichage du form
  controller.get($routes.get('edit', ':id'), function (context) {
    if (checkSession(context)) {
      var id = context.arguments.id
      $ressourceRepository.load(id, function (error, ressource) {
        $accessControl.checkPermission('update', context, ressource, function () {
          var options = {$metas: {title: 'Modifier la ressource : ' + ressource.titre}}
          printForm(error, ressource, context, options)
        })
      })
    }
  })

  // Uptate, traitement du form
  controller.post($routes.get('add'), function (context) {
    var ressource
    checkToken(context, function () {
      // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
      // et rediriger vers le describe ou vers le form avec les erreurs
      //log.debug('post dans add', controller.post);
      ressource = $ressourceConverter.getRessourceFromPost(context.post)
      // il validera avant d'enregistrer
      $ressourceRepository.write(ressource, function (error, ressource) {
        if (error || !_.isEmpty(ressource.warnings)) {
          // faut réafficher le form
          var options = {$metas: {title: 'Modifier la ressource : ' + ressource.titre}}
          printForm(error, ressource, context, options)
        } else {
          log.debug("update " + ressource.id + " ok, on lance le redirect")
          context.redirect(basePath +$routes.get('describe', ressource.id))
        }
      }) // write
    }) // checkToken
  })

  // Delete, demande de confirmation
  controller.get($routes.get('del', ':id'), function (context) {
    var id = context.arguments.id
    $ressourceRepository.load(id, function (error, ressource) {
      $accessControl.checkPermission('delete', context, ressource, function () {
        var options = {
          $metas : {title: 'Supprimer la ressource : ' + ressource.titre},
          contentBloc: {$view: 'delete'}
        }
        context.session['del' + id] = true
        printForm(error, ressource, context, options)
      })
    })
  })

  // Delete, traitement du post
  controller.post($routes.get('del'), function (context) {
    checkToken(context, function () {
      // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
      // et rediriger vers le describe ou vers le form avec les erreurs
      //log.debug('post dans add', controller.post);
      var ressource = $ressourceConverter.getRessourceFromPost(context.post)
      // il validera avant d'enregistrer
      $ressourceRepository.write(ressource, function (error, ressource) {
        if (error || !_.isEmpty(ressource.warnings)) {
          // faut réafficher le form
          var options = {$metas: {title: 'Modifier la ressource : ' + ressource.titre}}
          printForm(error, ressource, context, options)
        } else {
          log.debug("update " + ressource.id + " ok, on lance le redirect")
          context.redirect(basePath +$routes.get('describe',ressource.id))
        }
      })
    })
  })

  // form de recherche
  controller.get($routes.get('search'), function (context) {
    printSearchForm(context)
  })

  // résultats
  controller.post($routes.get('search'), function (context) {
    printSearchForm(context)
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
      orderBy: 'id',
      start  : parseInt(context.arguments.start),
      nb     : parseInt(context.arguments.nb)
    }
    var visibilite = 'public'
    // avec une exception pour l'admin qui peut passer ?all=1
    if (context.get.all && context.session.user && context.session.user.roles && context.session.user.roles.admin)
      visibilite = "tout"
    $ressourceRepository.getListe(visibilite, context, options, function (error, ressources) {
      var data = getDefaultData()
      data.$metas.title = 'Résultats de recherche'
      if (error) data.error = error.toString()
      else {
        data.contentBloc = $ressourceConverter.addUrlsToList(ressources)
        data.contentBloc.$view = 'liste'
      }
      context.html(data)
    })
  })
}
