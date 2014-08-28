/**
 * @file Controleur de la route api/*
 * POST /api/ressource
 * GET  /api/ressource/:id Renvoie la ressource d'id :id
 * POST /api/ressourceMerge
 */
'use strict';

/**
 * Controleur de la route api/
 * @extends {lassi.Controller}
 */
var controller = lassi.Controller('api')

var _ = require('underscore')._
var converter = require('../converter')
var repository = require('../repository')

controller.respond('json');

/**
 * @callback api_ressource POST api/ressource
 */
controller
    .Action('ressource')
    .via('post')
    .do(postRessource, {timeout:5000})

/**
 * Create / update une ressource
 * Si le titre et la catégorie sont manquants on merge avec la ressource existante que l'on update, sinon on écrase
 * @callback Callback~Task
 * @param ctx
 * @param next
 */
function postRessource(ctx, next) {
  var partial = !ctx.post.titre && !ctx.post.categories &&
      (ctx.post.id || (ctx.post.origine && ctx.post.idOrigine))
  var id = ctx.post.id || 0
  var ressource = converter.getRessourceFromPost(ctx.post, partial)

  function update(error, ressourceLoaded) {
    if (error) next(null, {error:error.toString()})
    else {
      ressourceLoaded.udate(ressource)
      write(ctx, ressourceLoaded, next)
    }
  }

  //log.dev("dans api write on récupère en post", ctx.post)
  try {
    var msg = id
    // init du chrono
    var start = log.getElapsed(0)
    /** lassi.tmp sert à stocker des dates pour debug et mesures de perfs */
    if (!lassi.tmp) lassi.tmp = {}
    lassi.tmp[ctx.post.id] = {m:msg,s:start}
    lassi.tmp[ctx.post.id].m += '\tcv ' +log.getElapsed(lassi.tmp[ctx.post.id].s)
    //log.dev("que l'on a transformé en", ressource)

    if (partial) {
      // faut la charger
      if (ressource.id) repository.load(ressource.id, update)
      else repository.loadByOrigin(ressource.origine, ressource.idOrigine, update)
    } else write(ctx, ressource, next)

  } catch (e) {
    log.error(e);
    next(null, {error: e.toString()})
  }
}

/**
 * Merge
 * Si le titre et la catégorie sont manquants on merge avec la ressource existante que l'on update, sinon on écrase
 */
controller
    .Action('ressourceMerge')
    .via('post')
    .do(function(ctx, next) {
      var part = converter.getRessourceFromPost(ctx.post, true)

      function merge(error, ressource) {
        if (error) next(null, {error:error.toString()})
        else {
          ressource.merge(part)
          write(ctx, ressource, next)
        }
      }

      if (part.id) repository.load(ctx.post.id, merge)
      else if (ctx.post.origine && ctx.post.idOrigine) repository.loadByOrigin(part.origine, part.idOrigine, merge)
      else next(null, {error:"Il faut fournir id ou origine+idOrigine"})
    })

/**
 * Read (get) & delete
 */
controller
    .Action('ressource/:id', 'api.read')
    .via('get', 'delete')
    .do(function (ctx, next) {
      var id = ctx.arguments.id

      function del() {
        repository.del(id, function (error, nbObjects, nbIndexes) {
          if (error) next(null, {error: error.toString()})
          else if (nbObjects > 0) {
            next(null, {deletedId: id, nbObjects:nbObjects, nbIndexes:nbIndexes})
          } else next(null, {error: "Aucune ressource d'identifiant " + id})
        });
      }

      if (ctx.method === 'get') {
        repository.load(id, function (error, ressource) {
          // log.dev("dans api get " +id, ressource)
          if (error) next(null, {error: error.toString()})
          else if (ressource) {
            // l'entité passe pas le JSON.stringify, à cause de la propriété _entity, d'où le toObject
            if (lassi.personne.hasReadPermission(ctx, ressource)) next(null, ressource.toObject())
            else  denied("Droits insuffisants pour accéder à la ressource d'identifiant " + id, ctx, next)
          } else notFound("La ressource d'identifiant " + id + " n'existe pas", ctx, next)
        })

      } else {
        if (lassi.personne.hasPermission('del', ctx)) {
          del()
        } else {
          // faut charger la ressource pour le savoir
          repository.load(id, function (error, ressource) {
            if (error) next(error)
            else if (!ressource) next(new Error("la ressource d'identifiant " + id + " n'existe pas"))
            else if (lassi.personne.hasPermission('del', ctx, ressource)) del() // next inclus
            else denied("Droits insuffisants pour supprimer la ressource d'identifiant " + id, ctx, next)
          })
        }
      }
    })

/**
 * Read (get) & delete byOrigine
 */
controller
    .Action('ressource/:origine/:id', 'api.readByOrigine')
    .via('get', 'delete')
    .do(function (ctx, next) {
      var idOrigine = ctx.arguments.id
      var origine = ctx.arguments.origine

      /**
       * Efface la ressource d'après les params origine & idOrigine de la requete
       */
      function delByOrigine() {
        repository.delByOrigine(origine, idOrigine, function (error, nbObjects, nbIndexes) {
          if (error) next(null, {error: error.toString()})
          else if (nbObjects > 0) {
            next(null, {nbObjects:nbObjects, nbIndexes:nbIndexes})
          } else next(null, {error: "Aucune ressource d'origine " +origine +" et d'identifiant " + idOrigine})
        });
      }

      /**
       * Fct à privilégier car l'effacement du cache est nettement plus performant
       * @param id
       */
      function del(id) {
        repository.del(id, function (error, nbObjects, nbIndexes) {
          if (error) next(null, {error: error.toString()})
          else if (nbObjects > 0) {
            next(null, {deletedId: id, nbObjects:nbObjects, nbIndexes:nbIndexes})
          } else next(null, {error: "Aucune ressource d'identifiant " + id})
        });
      }

      if (ctx.method === 'get') {
        repository.loadByOrigin(origine, idOrigine, function (error, ressource) {
          // log.dev("dans api get " +id, ressource)
          if (error) next(null, {error: error.toString()})
          else if (ressource) {
            // l'entité passe pas le JSON.stringify pour la sortie, à cause de la propriété _entity, d'où le toObject
            if (lassi.personne.hasReadPermission(ctx, ressource)) next(null, ressource.toObject())
            else  denied("Droits insuffisants pour accéder à la ressource d'origine " +
                origine +" et d'identifiant " + idOrigine, ctx, next)
          } else notFound("La ressource d'origine " +origine +" et d'identifiant " + idOrigine +
              " n'existe pas", ctx, next)
        })

      } else {
        if (lassi.personne.hasPermission('del', ctx)) {
          delByOrigine()
        } else {
          // faut charger la ressource pour le savoir
          repository.loadByOrigin(origine, idOrigine, function (error, ressource) {
            if (error) next(error)
            else if (!ressource) notFound("La ressource d'origine " + origine + " et d'identifiant " + idOrigine +
                " n'existe pas", ctx, next)
            else if (lassi.personne.hasPermission('del', ctx, ressource)) del(ressource.id) // next inclus
            else denied("Droits insuffisants pour accéder à la ressource d'origine " +
                  origine + " et d'identifiant " + idOrigine, ctx, next)
          })
        }
      }
    })

/**
 * Read public (sans session)
 */
controller
    .Action('public/:id', 'api.public')
    .do(function (ctx, next) {
      var id = ctx.arguments.id

        repository.load(id, function (error, ressource) {
          if (error) next(null, {error: error.toString()})
          else if (ressource) {
            // l'entité passe pas le JSON.stringify, à cause de la propriété _entity, d'où le toObject
            if (ressource.restriction === 0) next(null, ressource.toObject())
            else  denied("Droits insuffisants pour accéder à la ressource d'identifiant " + id, ctx, next)
          } else notFound("La ressource d'identifiant " + id + " n'existe pas", ctx, next)
        })
    })

/**
 * Liste d'après les filtres en json (qui peuvent être multiple)
 *
 * Le json doit contenir
 * - filters : array d'objets {index:nomIndex, values:tableauValeurs},
 *        tableauValeurs peut être undefined et ça remontera toutes les ressources ayant cet index
 * et peut contenir
 * - orderBy : un nom d'index
 * - order : 'desc' si on veut l'ordre descendant
 * - start : offset
 * - nb : nb de résultats voulus
 */
controller
    .Action('public/by', 'api.public.by')
    .via('post')
    .renderWith('liste')
    .do(function (ctx, next) {
      console.log('do ')

      log.dev('do post', ctx.post)
      repository.getListe(ctx.post, function(error, ressources) {
        log.dev('retour de getListe error', error)
        log.dev('retour de getListe ress', ressources)
        if (error) next(null, {error:error.toString()})
        else next(null, addUrls(ctx, ressources))
      })
    })

controller
    .Action('prof/by', 'api.prof.by')
    .via('post')
    .renderWith('liste')
    .do(function (ctx, next) {
      if (!lassi.personne.isAuthenticated(ctx)) next(null, {error:"Il faut être authentifié pour accéder aux ressources prof"})
      else repository.getListe('prof', ctx, ctx.post, function(error, ressources) {
        if (error) next(null, {error:error.toString()})
        else next(null, addUrls(ctx, ressources))
      })
    })

controller
    .Action('my/by', 'api.my.by')
    .via('post')
    .renderWith('liste')
    .do(function (ctx, next) {
      if (!lassi.personne.isAuthenticated(ctx)) next(null, {error:"Il faut être authentifié pour accéder à ses ressources"})
      else repository.getListe('moi', ctx, ctx.post, function(error, ressources) {
        if (error) next(null, {error:error.toString()})
        else next(null, addUrls(ctx, ressources))
      })
    })

/**
 * Create / update une ressource à partir du post d'un arbre
 * Si l'arbre posté contient un id mais pas d'enfant, on tentera de récupérer l'arbre et de mettre à jour sa racine,
 * sinon, avec un id on écrase l'ancien s'il existait et sans on insère une nouvelle ressource
 */
controller
    .Action('arbre')
    .via('post')
    .do(function(ctx, next) {
      var partial = ctx.post.id && !ctx.post.childrens
      var id = ctx.post.id || 0
      var ressource = converter.getRessourceFromPostedArbre(ctx.post, partial)

      function update(error, ressourceLoaded) {
        if (error) next(null, {error:error.toString()})
        else {
          ressourceLoaded.udate(ressource)
          write(ctx, ressourceLoaded, next)
        }
      }

      //log.dev("dans api arbre on récupère en post", ctx.post)
      try {
        var msg = id
        // init du chrono
        var start = log.getElapsed(0)
        /** lassi.tmp sert à stocker des dates pour debug et mesures de perfs */
        if (!lassi.tmp) lassi.tmp = {}
        lassi.tmp[ctx.post.id] = {m:msg,s:start}
        lassi.tmp[ctx.post.id].m += '\tcv ' +log.getElapsed(lassi.tmp[ctx.post.id].s)

        if (partial) {
          // faut charger
          if (ressource.id) repository.load(ressource.id, update)
          else write(ctx, ressource, next)
        }
      } catch (e) {
        log.error(e);
        next(null, {error: e.toString()})
      }
    }, {timeout:5000})

module.exports = controller;

function denied(msg, ctx, next) {
  ctx.response.statusCode = 403;
  next(null, {error: msg})
}

function notFound(msg, ctx, next) {
  ctx.response.statusCode = 404;
  next(null, {error: msg})
}

/**
 * Ajoute les propriétés url à chaque elt du tableau de ressource
 * @param {Context} ctx
 * @param {Array} ressources
 * @returns {Array} Le nouveau tableau de ressources
 */
function addUrls(ctx, ressources) {
  return ressources.map(function (ressource) {
    if (ressource.restriction === 0) ressource.url = ctx.url(lassi.action.api.public.read, {id:ressource.id})
    else ressource.url = ctx.url(lassi.action.api.read, {id:ressource.id})
    return ressource.toObject()
  })
}

/**
 * Vérifie les droits et enregistre la ressource
 * @param ctx
 * @param ressource
 * @param next
 */
function write(ctx, ressource, next) {
  var permission = (ressource.id || ressource.idOrigine) ? 'write' : 'add'
  if (lassi.personne.hasPermission(permission, ctx, ressource)) {
    repository.write(ressource, function (error, ressource) {
      // id - convertPost - valide+setVersion - store - store2 - fin
      lassi.tmp[ctx.post.id].m += '\tretSt ' +log.getElapsed(lassi.tmp[ctx.post.id].s)
      log.errorData(lassi.tmp[ctx.post.id].m)
      //log.dev("dans cb api write on récupère", ressource)
      if (error) next(null, {error: error.toString()})
      else if (!_.isEmpty(ressource.errors)) {
        next(null, {error: ressource.errors.join("\n")})
      } else {
        next(null, {id: ressource.id})
      }
    })
  } else {
    var errorMsg = "Droits insuffisants"
    if (ressource.id) errorMsg += " pour modifier la ressource d'identifiant " + id
    else errorMsg += " pour ajouter une ressource"
    denied(errorMsg, ctx, next)
  }
}
