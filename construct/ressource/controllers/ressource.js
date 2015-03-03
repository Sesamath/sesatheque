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

var controller = lassi.Controller('ressource');
var _ = require('underscore')._;

var converter = require('../converter')
var repository = require('../repository')
var routes = require('../config.js').constantes.routes;

controller.respond('html');

/**
 * On ajoute nos 4 méthodes CRUD (Create, Read, Update, Delete), avec 2 méthodes read suivant que
 * l'on veut voir la ressource (display ou embed) ou sa description (describe)
 *
 * Les erreurs liées à un bug dans le code sont en anglais,
 * celles liées à une incohérence de data et destinés à l'utilisateur en français
 * (celles liées à une url malformée doivent être interceptées avant nous)
 */

/**
 * describe : Voir les propriétés de la ressource
 */
controller
    .Action(routes.describe + '/:id', 'ressource.describe')
    .renderWith('describe')
    .do(function (ctx, next) {
      var id = ctx.arguments.id
      repository.load(id, function (error, ressource) {
        if (error) next(error)
        else if (ressource) {
          lassi.personne.checkPermission('read', ctx, ressource, function (ressource) {
            ctx.metas.title = ressource.titre
            converter.sendPageData(error, ressource, ctx, next)
          })
        } else ctx.notFound("La ressource d'identifiant " + id + " n'existe pas")
      })
    });

/**
 * describe via origine : Voir les propriétés de la ressource, ici via origine/idOrigine
 */
controller
    .Action(routes.describe + '/:origine/:idOrigine', 'ressource.describeByOrigin')
    .renderWith('describe')
    .do(function (ctx, next) {
      var origine = ctx.arguments.origine
      var idOrigine = ctx.arguments.idOrigine
      repository.loadByOrigin(origine, idOrigine, function (error, ressource) {
        if (error) next(error)
        else if(ressource) {
          // on ajoute l'argument id pour le décorateur menu
          lassi.personne.checkPermission('read', ctx, ressource, function (ressource) {
            ctx.ressourceId = ressource.id
            ctx.metas.title = ressource.titre
            if (!ressource.restriction) ctx.metas.permalink = ctx.url(lassi.action.public.describe, {id: ressource.id})
            else ctx.metas.permalink = ctx.url(lassi.action.ressource.describe, {id: ressource.id})
            converter.sendPageData(error, ressource, ctx, next)
          })
        } else ctx.notFound("La ressource d'identifiant " + idOrigine + " (origine " + origine +" n'existe pas")
      })
    })

/**
 * display : Voir la ressource
 *
 * Le layout-iframe est imposé via ctx.forceLayout qui est lu par un écouteur transports.html.on('layout'...
 * défini dans le mainComponent.initialize
 */
controller
  .Action(routes.display + '/:id', 'ressource.display')
  .renderWith('display')
  .do(function (ctx, next) {
      var id = ctx.arguments.id
      // on force le layout en ajoutant cette propriété au contexte,
      // qui sera récupéré par l'écouteur layout défini dans le mainComponent.initialize
      ctx.forceLayout = 'layout-iframe'

      repository.load(id, function (error, ressource) {
        // log.dev('retour de load dans display', ressource)
        if (error) next(error)
        else if (ressource) {
          lassi.personne.checkPermission('read', ctx, ressource, function (ressource) {
            display(error, ressource, ctx, '../..', next)
          })
        } else ctx.notFound("La ressource d'identifiant " + id + " n'existe pas")
      })
    })

/**
 * display : Voir la ressource
 *
 * Le layout-iframe est imposé via ctx.forceLayout qui est lu par un écouteur transports.html.on('layout'...
 * défini dans le mainComponent.initialize
 */
controller
    .Action(routes.display + '/:origine/:idOrigine', 'ressource.displayByOrigin')
    .renderWith('display')
    .do(function (ctx, next) {
      // on force le layout en ajoutant cette propriété au contexte,
      // qui sera récupéré par l'écouteur layout défini dans le mainComponent.initialize
      ctx.forceLayout = 'layout-iframe'
      var origine = ctx.arguments.origine
      var idOrigine = ctx.arguments.idOrigine
      repository.loadByOrigin(origine, idOrigine, function (error, ressource) {
        display(error, ressource, ctx, '../../..', next)
      })
    })
/**
 * preview : Voir la ressource dans le site
 */
controller
  .Action(routes.preview + '/:id', 'ressource.preview')
  .renderWith('preview')
    .do(function (ctx, next) {
      // sera affiché en iframe, comme pour tous les autres sites
      next(null, {url:ctx.url(lassi.action.ressource.display, ctx.arguments)})
    })

/**
 * Create, le form de saisie
 */
controller
  .Action(routes.add, 'ressource.add')
  .via('get', 'post')
  .renderWith('form')
  .do(function (ctx, next) {
      // ajouter un meta ou un autre moyen pour mettre le js client
      // qui va conditionner les types à la catégorie dans la page
      var ressource
      //log.dev('action', lassi.action.ressource); next()
      if (this.method === 'get') {
        lassi.personne.checkPermission('create', ctx, null, function () {
          ctx.metas.title = 'Ajouter une ressource'
          // on ajoute le token, permet de ne pas vérifier les droits au post
          ctx.session.token = converter.sendFormData(null, null, next)
        })
      } else {
        checkToken(ctx, function() {
          // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
          // et rediriger vers le describe ou vers le form avec les erreurs
          //log.dev('post dans add', this.post);
          ressource = converter.getRessourceFromPost(ctx.post)
          // il validera avant d'enregistrer
          repository.write(ressource, function (error, ressource) {
            if (error || !_.isEmpty(ressource.errors)) {
              // faut réafficher le form
              converter.sendFormData(error, ressource, next)
            } else {
              log.dev("Après le save on récupère l'id " + ressource.id + ", on lance le redirect");
              ctx.redirect(lassi.action.ressource.describe, {id: ressource.id});
              // on appelle pas next, on attend le redirect
            }
          }) // write
        }) // checkToken
      }
  });

/**
 * Uptate
 */
controller
  .Action(routes.edit +'/:id', 'ressource.edit')
  .via('get', 'post')
  .renderWith('form')
  .do(function (ctx, next) {

    if (this.isGet()) {
      // get => affichage du form
      var id = ctx.arguments.id
      repository.load(id, function (error, ressource) {
        if (ressource) {
          lassi.personne.checkPermission('update', ctx, ressource, function (ressource) {
            ctx.metas.title = 'Modifier ' + ressource.titre
            ctx.session.token = converter.sendFormData(error, ressource, next)
          })
        } else {
          ctx.notFound("La ressource d'identifiant " + id + " n'existe pas")
          return
        }
      })

    } else if (this.isPost()) {
      // post => on enregistre ou on réaffiche le form si pb
      checkToken(ctx, function () {
        var ressource = converter.getRessourceFromPost(ctx.post)
        repository.write(ressource, function(error, ressource) {
          if (error || !_.isEmpty(ressource.errors)) {
            // faut réafficher le form avec les erreurs
            converter.sendFormData(error, ressource, next)
          } else {
            log.dev("update ok, on lance le redirect")
            ctx.redirect(lassi.action.ressource.describe, {id: ressource.id});
          }
        })
      })
    } else {
      throw new Error("methode non supportée " +this.method)
    }
  });

/**
 * Del
 */
controller
  .Action(routes.del +'/:id', 'ressource.del')
  .via('get', 'post')
  .renderWith('del')
  .do(function (ctx, next) {
      var id = this.arguments.id;
      if (this.method === 'get') {
        // on affiche et on demande confirmation
        repository.load(id, function (error, ressource) {
          if (ressource) {
            lassi.personne.checkPermission('delete', ctx, ressource, function () {
              ctx.metas.title = 'Supprimer ' + ressource.titre
              // on ajoute un flag en session pour ne pas refaire les vérifs de droits dans le le post
              ctx.session['del' + id] = true
              converter.sendPageData(error, ressource, ctx, next)
            })
          } else ctx.notFound("La ressource d'identifiant " + id + " n'existe pas")
        })
      } else {
        // post
        checkToken(ctx, function () {
          repository.del(id, function (error, nbObjects, nbIndexes) {
            if (error) next(null, {error: error})
            else if (nbObjects > 0) next(null, {deletedId: id, nbObjects: nbObjects, nbIndexes: nbIndexes})
            else {
              log.error("del : au post on a aucun objet effacé")
              next(null, {error: "La ressource d'identifiant " + id +" n'a pas pu être effacée"})
            }
          });
        })
      }
  });

/**
 * Liste d'après le critère passé en 1er param (puis valeur, offset & nb)
 * Ne remonte que les ressources publiques
 * SELECT _string, COUNT(*) AS nb  FROM ressource_index WHERE name = 'typeTechnique' GROUP BY _string
 */
controller
  .Action('by/:index/:value/:start/:nb', 'ressource.by')
  .renderWith('liste')
  .do(function (ctx, next) {
      log.dev('liste avec les args', ctx.arguments)
      var index = ctx.arguments.index
      var value = ctx.arguments.value
      var options = {
        filters : [{index:index, values:[value]}],
        orderBy :'id',
        start   : parseInt(ctx.arguments.start),
        nb      : parseInt(ctx.arguments.nb)
      }
      var visibilite = 'public'
      // avec une exception pour l'admin qui peut passer ?all=1
      if (ctx.get.all && ctx.session.user && ctx.session.user.roles && ctx.session.user.roles.admin) visibilite = "all"
      repository.getListe(visibilite, ctx, options, function (error, ressources) {
        if (error) next(error)
        else {
          ctx.metas.title = 'Résultats de recherche'
          next(null, {ressources: addUrls(ctx, ressources)})
        }
      })
  });

module.exports = controller;

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

/**
 * Code commun aux 2 controlleurs display
 * @param error
 * @param ressource
 * @param ctx
 * @param publicPrefix Le chemin relatif pour trouver le dossier public
 *                     (par rapport à la route courante, sans / au début ou à la fin)
 * @param next
 */
function display (error, ressource, ctx, publicPrefix, next) {
  //log.dev('retour de load dans display', ressource)
  if (error) next(error)
  else if (ressource) {
    lassi.personne.checkPermission('read', ctx, ressource, function (ressource) {
      ctx.metas.title = ressource.titre
      // si public son permalink est dans le namespace public
      if (!ressource.restriction) ctx.metas.permalink = ctx.url(lassi.action.public.describe, {id: ressource.id})
      var data = {
        pluginBaseUrl : publicPrefix +'/plugins/' + ressource.typeTechnique,
        vendorsBaseUrl: publicPrefix + '/vendors',
        pluginName    : ressource.typeTechnique,
        titre         : ressource.titre,
        ressource     : lassi.tools.stringify(ressource),
        staging       : ctx.application.settings.application.staging
      }
      ctx.metas.addCss('styles/ressourceDisplay.css')
      next(null, data)
    })
  } else ctx.notFound("Cette ressource n'existe pas")
}