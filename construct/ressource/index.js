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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict';

var tools = require('../tools')
var _ = require('underscore')._

// raccourci pour se simplifier la saisie du code
var config = require('./config.js')
var routes = config.constantes.routes

/**
 * Génère le code html d'un lien
 * @param route La route (après "ressources/", cf config.routes)
 * @param label Le label à afficher
 * @param [id] Un id à ajouter à la route
 * @returns {string} Le code html du tag a
 */
function link(route, label, id) {
  if (id) route += '/' +id
  return '<a href="' +route +'">' +label +'</a>'
}

/**
 * Vérifie que le token du post correspond à celui en session
 * @param ctx
 * @param next
 */
function checkToken(ctx, next) {
  if (!ctx.post.token || ctx.post.token !== ctx.session.token) {
    if (ctx.session.token) delete ctx.session.token
    log.dev('pb de token', ctx.post)
    ctx.accessDenied("Paramètres invalides")
  } else next()
}

/** {Component} Composant de gestion des types de contenu "Ressource" */
var ressourceComponent = lassi.component('ressource');

ressourceComponent.config(function($settings) {
  // on vérifie que l'on a un cache avec des valeur acceptables
  var cacheTTL = $settings.get('components.ressource.cacheTTL', null)
  if (!cacheTTL) throw new Error("Il faut indiquer un TTL pour le cache de ressource" +
      " (en s, dans components.ressource.cacheTTL)")
  if (cacheTTL < 60) throw new Error("Le cache ressource doit avoir un TTL d'au moins 60s")
  if (cacheTTL > 12*3600) throw new Error("Le cache ressource doit avoir un TTL inférieur à 24h (86400s)")
  log('ttl du cache ressource fixé à ' +cacheTTL)
})

ressourceComponent.service('$ressourceRepository', require('./serviceRepository'))
ressourceComponent.service('$ressourceConverter', require('./serviceConverter'))

ressourceComponent.service('$ressourceSettings', function ($settings) {
  return {
    /**
     * getter des settings de ressource (ajoute le préfixe components.ressource. avant d'appeler $settings.get)
     * @param key La clé (ex constantes.categories.activiteFixe)
     * @returns {*} La valeur de key dans les settings ou undefined
     */
    get: function (key) {
      return $settings.get('components.ressource.' +key, undefined)
    }
  }
})

// nos ressources statiques
ressourceComponent.controller(function () {
  this.serve(__dirname + '/public')
})

// les pages de consultation / modification, avec layout complet
ressourceComponent.controller('ressource', function ($ressourceRepository, $ressourceConverter, $accessControl) {

  function checkSession(context) {
    if (!context.session || !context.session.user) {
      var data = {
        $metas : {
          css   : ['styles/ressources.css']
        },
        $layout : 'layout-pageError',
        content : "Authentification requise"
      }
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
    var id = ressource.id
    // les liens du menu
    var links = []
    // lien ajout
    if ($accessControl.hasPermission('create', context)) {
      links.push(link(routes.add, 'Ajouter une ressource'))
    }
    // si on est sur une ressource on ajoute les liens contextuels pour cette ressource (auxquels on a droit)
    if (id) {
      if ($accessControl.hasPermission('update', context, id))
        links.push(context.link(routes.edit, 'Modifier cette ressource', id))
      if ($accessControl.hasPermission('delete', context, id))
        links.push(context.link(routes.del, 'Supprimer cette ressource', id))
      if ($accessControl.hasPermission('read', context, id)) {
        links.push(context.link(routes.preview, 'Voir la ressource', id))
        links.push(context.link(routes.display, 'Voir la ressource (pleine page)', id))
      }
    }
    data.menu = {
      $view : 'menu',
      links : links
    }
  } // init

  function prepareAndSend(context, error, ressource, view, options) {
    var data = {
      $views: __dirname+'/views',
      $metas : {
        css   : ['styles/ressources.css']
      },
      $layout : 'layout-page'
    }
    // on ajoute le menu
    addMenu(context, data, ressource)
    // et la ressource (ou erreur)
    data.content = $ressourceConverter.getViewData(error, ressource)
    data.content.$view = view
    // le titre
    data.$metas.title = ressource.titre || "Ressource introuvable"
    // et d'éventuels overrides
    if (options) tools.merge(data, options)
    // avant d'envoyer
    context.html(data)
  }

  function printForRead(context, error, ressource, view, options) {
    if (error) {
      prepareAndSend(context, error, null, view, options)
    } else if (ressource) {
      $accessControl.checkPermission('read', context, ressource, function (ressource) {
        prepareAndSend(context, error, ressource, view, options)
      })
    } else {
      context.status = 404
      error = new Error("Ressource introuvable")
      prepareAndSend(context, error, null, view, options)
    }
  }

  function printForm(context, error, ressource, options) {
    var data = {
      $views: __dirname+'/views',
      $metas : {
        css   : ['styles/ressources.css']
        // @TODO ajouter un js client pour conditionner les types à la catégorie dans la page
      },
      $layout : 'layout-page',
      content : {
        $view : 'form'
      }
    }
    // on ajoute le menu
    addMenu(context, data, ressource)
    // les datas pour le form
    data.content = $ressourceConverter.getFormViewData(error, ressource)
    // le titre
    data.$metas.title = 'Éditer une ressource'
    // et d'éventuels overrides
    if (options) tools.merge(data, options)
    // on ajoute le token, en session, pour éviter des post multiples et ne pas vérifier les droits au post
    context.session.token = data.content.token.value
    // avant d'envoyer
    context.html(data)
  }

  /**
   * Ajoute les propriétés url à chaque elt du tableau de ressource
   * @param {Context} ctx
   * @param {Array} ressources
   * @returns {Array} Le nouveau tableau de ressources
   */
  function addUrls(ctx, ressources) {
    if (ressources && ressources.length) ressources.forEach(function (ressource) {
      ressource.urlDescribe = ctx.url(lassi.action.ressource.describe, {id:ressource.id})
      ressource.urlPreview = ctx.url(lassi.action.ressource.preview, {id:ressource.id})
      ressource.urlDisplay = ctx.url(lassi.action.ressource.display, {id:ressource.id})
    })
    return ressources
  }

  // describe
  this.get(routes.describe +'/:id', function(context) {
    var id = context.arguments.id
    $ressourceRepository.load(id, function (error, ressource) {
      printForRead(context, error, ressource, 'describe')
    })
  })

  // describeByOrigin
  this.get(routes.describe +'/:origine/:idOrigine', function(context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      printForRead(context, error, ressource, 'describe')
    })
  })

  // display : Voir la ressource pleine page (pour iframe)
  this.get(routes.display + '/:id', function (context) {
    var id = context.arguments.id
    $ressourceRepository.load(id, function (error, ressource) {
      printForRead(context, error, ressource, 'display', { $layout : 'layout-iframe' })
    })
  })

  // displayByOrigin : Voir la ressource pleine page (pour iframe)
  this.get(routes.display +'/:origine/:idOrigine', function(context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      printForRead(context, error, ressource, 'display', { $layout : 'layout-iframe' })
    })
  })

  // preview : Voir la ressource dans le site
  this.get(routes.preview +'/:id', function(context) {
    var id = context.arguments.id
    $ressourceRepository.load(id, function (error, ressource) {
      printForRead(context, error, ressource, 'preview')
    })
  })

  // Create, affichage du form de saisie
  this.get(routes.add, function (context) {
    if (checkSession()) {
      $accessControl.checkPermission('create', context, null, function () {
        var options = {$metas: {title: 'Ajouter une ressource'}}
        printForm(context, null, null, options)
      })
    }
  })

  // Create, traitement du post
  this.post(routes.add, function (context) {
    var ressource
    checkToken(context, function() {
      // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
      // et rediriger vers le describe ou vers le form avec les erreurs
      //log.dev('post dans add', this.post);
      ressource = $ressourceConverter.getRessourceFromPost(context.post)
      // il validera avant d'enregistrer
      $ressourceRepository.write(ressource, function (error, ressource) {
        if (error || !_.isEmpty(ressource.errors)) {
          // faut réafficher le form
          var options = {$metas: {title: 'Ajouter une ressource'}}
          printForm(context, error, ressource, options)
        } else {
          log.dev("Après le save on récupère l'id " + ressource.id + ", on lance le redirect");
          context.redirect(routes.describe +'/' +ressource.id)
        }
      }) // write
    }) // checkToken
  })

  // Uptate, affichage du form
  this.get(routes.edit +'/:id', function (context) {
    if (checkSession()) {
      var id = context.arguments.id
      $ressourceRepository.load(id, function (error, ressource) {
        $accessControl.checkPermission('update', context, ressource, function () {
          var options = {$metas: {title: 'Modifier la ressource : ' +ressource.titre}}
          printForm(context, error, ressource, options)
        })
      })
    }
  })

  // Uptate, traitement du form
  this.post(routes.add, function (context) {
    var ressource
    checkToken(context, function() {
      // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
      // et rediriger vers le describe ou vers le form avec les erreurs
      //log.dev('post dans add', this.post);
      ressource = $ressourceConverter.getRessourceFromPost(context.post)
      // il validera avant d'enregistrer
      $ressourceRepository.write(ressource, function (error, ressource) {
        if (error || !_.isEmpty(ressource.errors)) {
          // faut réafficher le form
          var options = {$metas: {title: 'Modifier la ressource : ' +ressource.titre}}
          printForm(context, error, ressource, options)
        } else {
          log.dev("update " + ressource.id + " ok, on lance le redirect")
          context.redirect(routes.describe +'/' +ressource.id)
        }
      }) // write
    }) // checkToken
  })

  // Delete, demande de confirmation
  this.get(routes.del +'/:id', function(context) {
    var id = context.arguments.id
    $ressourceRepository.load(id, function (error, ressource) {
      $accessControl.checkPermission('delete', context, ressource, function () {
        var options = {
          $metas: { title: 'Supprimer la ressource : ' +ressource.titre},
          content : { $view : 'delete' }
        }
        context.session['del' + id] = true
        printForm(context, error, ressource, options)
      })
    })
  })

  // Delete, traitement du post
  this.post(routes.del, function (context) {
    checkToken(context, function() {
      // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
      // et rediriger vers le describe ou vers le form avec les erreurs
      //log.dev('post dans add', this.post);
      var ressource = $ressourceConverter.getRessourceFromPost(context.post)
      // il validera avant d'enregistrer
      $ressourceRepository.write(ressource, function (error, ressource) {
        if (error || !_.isEmpty(ressource.errors)) {
          // faut réafficher le form
          var options = {$metas: {title: 'Modifier la ressource : ' +ressource.titre}}
          printForm(context, error, ressource, options)
        } else {
          log.dev("update " + ressource.id + " ok, on lance le redirect")
          context.redirect(routes.describe +'/' +ressource.id)
        }
      })
    })
  })

  /**
   * Liste d'après le critère passé en 1er param (puis valeur, offset & nb)
   * Ne remonte que les ressources publiques
   * SELECT _string, COUNT(*) AS nb  FROM ressource_index WHERE name = 'typeTechnique' GROUP BY _string
   */
  this.get('by/:index/:value/:start/:nb', function (context) {
    log.dev('liste avec les args', context.arguments)
    var index = context.arguments.index
    var value = context.arguments.value
    var options = {
      filters : [{index:index, values:[value]}],
      orderBy :'id',
      start   : parseInt(context.arguments.start),
      nb      : parseInt(context.arguments.nb)
    }
    var visibilite = 'public'
    // avec une exception pour l'admin qui peut passer ?all=1
    if (context.get.all && context.session.user && context.session.user.roles && context.session.user.roles.admin)
        visibilite = "all"
    $ressourceRepository.getListe(visibilite, context, options, function (error, ressources) {
      var data = {
        $views: __dirname+'/views',
        $metas : {
          css   : ['styles/ressources.css'],
          title : 'Résultats de recherche'
        },
        $layout : 'layout-page',
        content : {
          $view : 'liste'
        }
      }
      if (error) data.content.error = error.toString()
      else data.content.ressources = addUrls(context, ressources)
      context.html(data)
    })
  })


})
