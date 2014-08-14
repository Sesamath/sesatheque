'use strict';

var controller = lassi.Controller('ressource');
var _ = require('underscore')._;

var rights = require('../rights')
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
          rights.checkPermission('read', ctx, ressource, function (ressource) {
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
          rights.checkPermission('read', ctx, ressource, function (ressource) {
            ctx.metas.title = ressource.titre
            if (!ressource.restriction) ctx.metas.permalink = ctx.url(lassi.action.public.describe, {id: ressource.id})
            else ctx.metas.permalink = ctx.url(lassi.action.ressource.describe, {id: ressource.id})
            converter.sendPageData(error, ressource, ctx, next)
          })
        } else ctx.notFound("La ressource d'identifiant " + idOrigine + " (origine " + origine +" n'existe pas")
      })
    })

/**
 * display : Voir la ressource (layout-iframe est défini pour ressource.display dans le mainComponent.initialize)
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
        if (error) next(error)
        else if (ressource) {
          rights.checkPermission('read', ctx, ressource, function (ressource) {
            ctx.metas.title = ressource.titre
            // si public son permalink est dans le namespace public
            if (!ressource.restriction) ctx.metas.permalink = ctx.url(lassi.action.public.describe, {id: ressource.id})
            var data = {
              pluginBaseUrl : '../../plugins/' + ressource.typeTechnique,
              vendorsBaseUrl: '../../vendors',
              pluginName    : ressource.typeTechnique,
              ressource     : ressource.toString()
            }
            next(null, data)
          })
        } else ctx.notFound("La ressource d'identifiant " + id + " n'existe pas")
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
        rights.checkPermission('add', ctx, null, function (ressource) {
          ctx.metas.title = 'Ajouter une ressource'
          // on ajoute le token, permet de ne pas vérifier les droits au post
          ctx.session.addToken = converter.sendFormData(null, null, next)
        })
      } else {
        if (!ctx.post.token || ctx.post.token !== ctx.session.addToken) {
          if (ctx.session.addToken) delete ctx.session.addToken
          log.dev('pb de token au add', ctx.post)
          ctx.notFound("Paramètres invalides, ajout impossible")
          return
        }
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
        }) // compRessource.add
      }
      log.dev("fin do add");
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
        if (!ressource) {
          ctx.response.statusCode = 404;
          ressource = {
            errors: ["La ressource d'identifiant " + id + " n'existe pas"],
            noForm : true
          }
          next(null, ressource)
        } else {
          ctx.metas.title = 'Modifier ' +ressource.titre
          converter.sendFormData(error, ressource, next)
        }
      })

    } else if (this.isPost()) {
      // post => on enregistre ou on réaffiche le form si pb
      repository.write(
          converter.getRessourceFromPost(ctx.post),
          function(error, ressource) {
            if (error || !_.isEmpty(ressource.errors)) {
              // faut réafficher le form avec les erreurs
              converter.sendFormData(error, ressource, next)
            } else {
              log.dev("update ok, on lance le redirect")
              ctx.redirect(lassi.action.ressource.describe, {id: ressource.id});
              // on appelle pas next, on attend le redirect
            }
          }
      )
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
          if (!ressource) {
            ctx.response.statusCode = 404;
            ressource = {
              error : "La ressource d'identifiant " + id + " n'existe pas"
            }
            next(null, ressource)
          } else {
            rights.checkPermission('del', ctx, ressource, function() {
              ctx.metas.title = 'Supprimer ' +ressource.titre
              // on ajoute un flag en session pour ne pas refaire les vérifs de droits dans le le post
              ctx.session['del' +id] = true
              converter.sendPageData(error, ressource, ctx, next)
            })
          }
        })
      } else {
        // post, on supprime, si on a eu les droits au get
        if (ctx.session['del' +id]) {
          repository.del(id, function (error, nbObjects, nbIndexes) {
            if (error) next(null, {error: error})
            else if (nbObjects > 0) {
              delete ctx.session['del' + id]
              next(null, {deletedId: id, nbObjects: nbObjects, nbIndexes: nbIndexes})
            }
            else next(null, {error: "Aucune ressource d'identifiant " + id})
          });
        } else {
          ctx.accessDenied("Vous n'avez pas de droits suffisants pour effacer cette ressource")
        }
      }
  });

/**
 * Liste d'après le critère passé en 1er param (puis valeur, offset & nb)
 */
controller
  .Action('by/:index/:value/:start/:nb')
  .renderWith('liste')
  .do(function (ctx, next) {
      log.dev('liste avec les args', ctx.arguments)
      var index = ctx.arguments.index
      var value = ctx.arguments.value
      var start = ctx.arguments.start
      var nb    = ctx.arguments.nb
      var options = {
        filters : [{index:index, values:[value]}],
        orderBy:'id'
      }
      repository.getListe(options, start, nb, function (error, ressources) {
        ctx.metas.title = 'Résultats de recherche'
        next(error, {ressources:ressources})
      })
  });

module.exports = controller;
